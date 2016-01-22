var tape = require( 'tape' );

var elasticsearchStream = require( '../../lib/streams/elasticsearchStream' );

tape(
  'importPipeline.createPeliasElasticsearchPipeline() interface',
  function ( test ){
    test.plan( 1 );
    var esPipeline = elasticsearchStream.create();
    test.ok( esPipeline.writable, 'Stream is writable' );
  }
);
