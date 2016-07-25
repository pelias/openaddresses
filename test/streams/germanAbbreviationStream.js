var tape = require('tape');
var event_stream = require( 'event-stream' );

var germanStream = require( '../../lib/streams/germanAbbreviationStream' );

function test_stream(input, testedStream, callback) {
  var input_stream = event_stream.readArray(input);
  var destination_stream = event_stream.writeArray(callback);

  input_stream.pipe(testedStream).pipe(destination_stream);
}

tape( 'germanStream expands tokens ending in "-str." to "-strasse" (mostly DEU)', function(test) {
  var inputs = [
    {
      address_parts:{
        street: 'Grolmanstr.'
      },
      parent:{
        country_a: ['DEU']
      }
    },
    {
      address_parts:{
        street: 'Ohrdrufer Str'
      },
      parent:{
        country_a: ['DEU']
      }
    },
    // in Moldova the 'str.' prefix means 'Strada'
    {
      address_parts:{
        street: 'str. Mircești'
      },
      parent:{
        country_a: ['MDA']
      }
    },
    {
      address_parts:{
        street: 'Sankt Nic Kirkestr'
      },
      parent:{
        country_a: ['DMK']
      }
    },
    {
      address_parts:{
        street: 'Große Str'
      },
      parent:{
        country_a: ['DEU']
      }
    },
    {
      address_parts:{
        street: 'Lindenstr'
      } ,
      parent:{
        country_a: ['DEU']
      }
    }
  ];
  var stream = germanStream.create();

  test_stream(inputs, stream, function(err, records) {
    test.equal(records.length, 6, 'stream length unchanged');

    test.equal(records[0].address_parts.street, 'Grolmanstrasse', 'expanded');
    test.equal(records[1].address_parts.street, 'Ohrdrufer Str', 'unchanged');
    test.equal(records[2].address_parts.street, 'str. Mircești', 'unchanged');
    test.equal(records[3].address_parts.street, 'Sankt Nic Kirkestræde', 'expanded');
    test.equal(records[4].address_parts.street, 'Große Str', 'unchanged');
    test.equal(records[5].address_parts.street, 'Lindenstrasse', 'expanded');
    test.end();
  });
});