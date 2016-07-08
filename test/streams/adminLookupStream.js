var sink = require('through2-sink');
var adminLookup = require('../../lib/streams/adminLookupStream').create;
var tape = require('tape');


tape('enabled: create pipResolver', function (t) {
    var config = {
    imports: {
      openaddresses:{
        adminLookup: true
      },
      adminlookup: {
        url: 'anything.org'
      }
    }
  };

var wofAdminLookup = {
    createLocalWofPipResolver: function(){},
    createLookupStream: function(){}
  };
    // assert that the PipResolver was instantiated with the correct URL
    wofAdminLookup.createLocalWofPipResolver = function () {
      t.pass('Resolver created');
      t.end();
    };

    adminLookup(config, wofAdminLookup);
  });

tape('enabled: pip resolver is passed into stream constructor', function (t) {
    var config = {
    imports: {
      openaddresses:{
        adminLookup: true
      },
      adminlookup: {
        url: 'anything.org'
      }
    }
  };

var wofAdminLookup = {
    createLocalWofPipResolver: function(){},
    createLookupStream: function(){}
  };

    t.plan(1); // expect 3 assertions

    var pipResolverMock = {foo: 'bar'};

    // mock the creation of pip resolver
    wofAdminLookup.createLocalWofPipResolver = function () {
      return pipResolverMock;
    };

    wofAdminLookup.createLookupStream = function (pipResolver) {
      t.equal(pipResolver, pipResolverMock);
      t.end();
    };

    adminLookup(config, wofAdminLookup);
  });

  /*
   * There was a bug (https://github.com/pelias/wof-admin-lookup/issues/51) where admin lookup could
   * not be enabled without the adminLookup config section
   */
  tape('enabled without any special adminLookup config: return pip stream', function (t) {
    var config = {
    imports: {
      openaddresses: {
        adminLookup: true
      }
    }
  };

    t.plan(1);

    var streamMock = {madeBy: 'mock'};

    var wofAdminLookup = {
      createLocalWofPipResolver: function() {
      },
      createLookupStream: function() {
        return streamMock;
      }
    };

    var stream = adminLookup(config, wofAdminLookup);
    t.equal(stream, streamMock, 'stream created');
    t.end();
  });

  tape('disabled: return passthrough stream', function(t) {
    var config = {
    imports: {
      openstreetmap: {
        adminLookup: false
      }
    }
  };

    t.plan(2); // expect 2 assertions

    var dataItem = { some: 'data' };

    var stream = adminLookup(config, {});

    t.equal(typeof stream, 'object', 'disabled stream is an object');

    stream.pipe(sink.obj( function (doc) {
      t.deepEqual(doc, dataItem);
      t.end();
    }));

    stream.write(dataItem);
  });
