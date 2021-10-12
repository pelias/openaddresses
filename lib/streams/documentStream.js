const through = require( 'through2' );
const peliasModel = require( 'pelias-model' );

// examples: GAACT718519668, GASA_424005553
const GNAF_PID_PATTERN = /^(GA)(NSW|VIC|QLD|SA_|WA_|TAS|NT_|ACT|OT_)([0-9]{9})$/;

/*
 * Create a stream of Documents from valid, cleaned CSV records
 */
function createDocumentStream(id_prefix, stats) {
  /**
   * Used to track the UID of individual records passing through the stream if
   * there is no HASH that can be used as a more unique identifier.  See
   * `peliasModel.Document.setId()` for information about UIDs.
   */
  let uid = 0;

  return through.obj(
    function write( record, enc, next ){
      const id_number = record.HASH || uid;
      const model_id = `${id_prefix}:${id_number}`;
      uid++;

      try {
        const addrDoc = new peliasModel.Document( 'openaddresses', 'address', model_id )
        .setName( 'default', (record.NUMBER + ' ' + record.STREET) )
        .setCentroid( { lon: record.LON, lat: record.LAT } );

        addrDoc.setAddress( 'number', record.NUMBER );

        addrDoc.setAddress( 'street', record.STREET );

        if (record.POSTCODE) {
          addrDoc.setAddress( 'zip', record.POSTCODE );
        }

        // detect Australian G-NAF PID concordances
        if (id_prefix.startsWith('au/')) {
          if (record.ID.length === 14 && record.ID.match(GNAF_PID_PATTERN)) {
            addrDoc.setAddendum('concordances', {'gnaf:pid': record.ID});
          }
        }

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
