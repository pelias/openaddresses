var through = require( 'through2' );

var peliasDbclient = require( 'pelias-dbclient' );

/**
 * Create the Pelias elasticsearch import pipeline.
 *
 * @return {stream.Writable} The entry point to the elasticsearch pipeline,
 *    which will perform additional processing on inbound `Document` objects
 *    before indexing them in the elasticsearch pelias index.
 */
function createPeliasElasticsearchPipeline(){
  var dbclientMapper = through.obj( function( model, enc, next ){
    this.push({
      _index: 'pelias',
      _type: model.getType(),
      _id: model.getId(),
      data: model
    });
    next();
  });

  var entryPoint = dbclientMapper;
  entryPoint.pipe( peliasDbclient() );

  return entryPoint;
}

module.exports = {
  create: createPeliasElasticsearchPipeline
};
