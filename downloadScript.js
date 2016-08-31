var http = require('http');
var https = require('https');
var parse = require('csv-parse');
var through = require('through2');
var fs = require('fs-extra');
var path = require('path');
var crypto = require('crypto');
var parallelStream = require('pelias-parallel-stream');
var config = require('pelias-config').generate();

var dir = config.imports.openaddresses.datapath || '/tmp';
var failures = [];

function titleZip(zipURL){
  var string_parts = zipURL.split('/');
  var fileParts = string_parts.slice(5,string_parts.length);
  var title = fileParts.join();
  return title;
}

function processEntry(rec,next){
  var fileName = titleZip(rec.processed);
  var localName = path.join(dir,fileName);
  http.get(rec.processed,function(res){
    res.pipe(fs.createWriteStream(localName));
  }).on('error', function(err){
    console.log(err + ' while processing '+ rec.processed);
    failures.push(fileName);
  }).on('close', function(){
    console.log('done downloading '+ rec.processed);
    next(null,{name:fileName, sum: rec['process hash']});
  });
}

https.get('https://results.openaddresses.io/state.txt', function(response){
  fs.ensureDirSync(dir);
  response
  .pipe(parse({delimiter: '\t',columns: true}))
  .pipe(parallelStream(10,function(rec,enc,next){
    if (rec.processed){
      try{
        var file = titleZip(rec.processed);
        fs.statSync(path.join(dir,file));
        var hash = crypto.createHash('md5');
        hash.setEncoding('hex');
        fs.createReadStream(path.join(dir,file)).pipe(hash).on('finish', function(){
          if(hash.read()!== rec['process hash']){
            processEntry(rec,next);
          }
          else{
            next();
          }
        });
      }
      catch(err){
        processEntry(rec, next);
      }
    }
    else{
      next();
    }
  }))
  .pipe(through.obj(function(rec,enc,next){
    if(rec){
      var hash = crypto.createHash('md5');
      hash.setEncoding('hex');
      fs.createReadStream(path.join(dir,rec.name)).pipe(hash).on('finish', function(){
        var result = hash.read();

        //second half of this ensures that files without a hash dont get deleted
        if(result !== rec.sum && rec.sum !== ''){
          fs.ensureDirSync('failures');
          fs.createReadStream(path.join(dir,rec.name)).pipe(fs.createWriteStream(path.join('failures',rec.name)));
          failures.push(rec.name);
        }
      });
    }
    next();
  })).on('finish',function(){
    failures.forEach(function(failure){
      console.log(failure + ' could not be downloaded properly. It has been placed in the failures directory');
    });
    if (failures.length === 0){
      console.log('finished with no issues');
    }
  });
}).on('error',function(err){console.log(err);});
