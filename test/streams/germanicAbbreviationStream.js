var tape = require('tape');
var event_stream = require( 'event-stream' );

var germanicStream = require( '../../lib/streams/germanicAbbreviationStream' );

function test_stream(input, testedStream, callback) {
  var input_stream = event_stream.readArray(input);
  var destination_stream = event_stream.writeArray(callback);

  input_stream.pipe(testedStream).pipe(destination_stream);
}

tape( 'germanicStream expands tokens ending in "-str." to "-strasse" (mostly DEU)', function(test) {
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
    {
      address_parts: {
        street: 'Vermeerstr'
      },
      parent: {
        country_a: ['NLD']
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
        country_a: ['DNK']
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
  var stream = germanicStream.create();

  test_stream(inputs, stream, function(err, records) {
    test.equal(records.length, 7, 'stream length unchanged');

    test.equal(records[0].address_parts.street, 'Grolmanstrasse', 'expanded');
    test.equal(records[1].address_parts.street, 'Ohrdrufer Str', 'unchanged');
    test.equal(records[2].address_parts.street, 'Vermeerstraat', 'expanded');
    test.equal(records[3].address_parts.street, 'strada Mircești', 'expanded');
    test.equal(records[4].address_parts.street, 'Sankt Nic Kirkestræde', 'expanded');
    test.equal(records[5].address_parts.street, 'Große Str', 'unchanged');
    test.equal(records[6].address_parts.street, 'Lindenstrasse', 'expanded');
    test.end();
  });
});

  tape( 'germanictream leaves str in the middle alone', function(test) {
  var inputs = [
    {
      address_parts:{
        street: 'Grolmanstrasse'
      },
      parent:{
        country_a: ['DEU']
      }
    },
    {
      address_parts:{
        street: 'Ohrdrufer Strasse'
      },
      parent:{
        country_a: ['DEU']
      }
    },
    {
      address_parts: {
        street: 'Vermeerstraat'
      },
      parent: {
        country_a: ['NLD']
      }
    },
    // in Moldova the 'str.' prefix means 'Strada'
    {
      address_parts:{
        street: 'strada Mircești'
      },
      parent:{
        country_a: ['MDA']
      }
    },
    {
      address_parts:{
        street: 'Sankt Nic Kirkestrade'
      },
      parent:{
        country_a: ['DNK']
      }
    },
    {
      address_parts:{
        street: 'Große Strasse'
      },
      parent:{
        country_a: ['DEU']
      }
    },
    {
      address_parts:{
        street: 'Lindenstrasse'
      } ,
      parent:{
        country_a: ['DEU']
      }
    }
  ];
  var stream = germanicStream.create();

  test_stream(inputs, stream, function(err, records) {
    test.equal(records.length, 7, 'stream length unchanged');

    test.equal(records[0].address_parts.street, 'Grolmanstrasse', 'unchanged');
    test.equal(records[1].address_parts.street, 'Ohrdrufer Strasse', 'unchanged');
    test.equal(records[2].address_parts.street, 'Vermeerstraat', 'unchanged');
    test.equal(records[3].address_parts.street, 'strada Mircești', 'unchanged');
    test.equal(records[4].address_parts.street, 'Sankt Nic Kirkestrade', 'unchanged');
    test.equal(records[5].address_parts.street, 'Große Strasse', 'unchanged');
    test.equal(records[6].address_parts.street, 'Lindenstrasse', 'unchanged');
    test.end();
  });
});
