var through = require( 'through2' );

var peliasModel = require( 'pelias-model' );

/*
 * Create a stream of Documents from valid, cleaned CSV records
 */
function createDocumentStream(stats) {
  /**
   * Used to track the UID of individual records passing through the stream
   * created by `createRecordStream()`.  See `peliasModel.Document.setId()` for
   * information about UIDs.
   */
  var uid = 0;

  return through.obj(
    function write( record, enc, next ){
      var model_id = ( uid++ ).toString();
      try {
        var addrDoc = new peliasModel.Document( 'openaddresses', 'address', model_id )
        .setName( 'default', (record.NUMBER + ' ' + record.STREET).replace(/ +/g, ' ') )
        .setCentroid( { lon: record.LON, lat: record.LAT } );

        addrDoc.setAddress( 'number', record.NUMBER );

        addrDoc.setAddress( 'street', record.STREET );

        if (record.POSTCODE) {
          addrDoc.setAddress( 'zip', record.POSTCODE );
        }

        addrDoc.phrase = addrDoc.name;
        this.push( addrDoc );
      }
      catch ( ex ){
        stats.badRecordCount++;
      }

      next();
    }
  );
}

module.exports = {
  create: createDocumentStream
};
