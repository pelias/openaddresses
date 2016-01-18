var tape = require( 'tape' );

var importPipelines = require( '../lib/import_pipelines' );

tape(
  'importPipeline.createPeliasElasticsearchPipeline() interface',
  function ( test ){
    test.plan( 1 );
    var esPipeline = importPipelines.createPeliasElasticsearchPipeline();
    test.ok( esPipeline.writable, 'Stream is writable' );
  }
);
