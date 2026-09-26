const through = require( 'through2' );
const peliasModel = require( 'pelias-model' );
const fileContext = require( '../fileContext' );

// patter to match a two character country code from the directory prefix
const COUNTRY_CODE_PATTERN = /^([A-Za-z]{2})\//;

/*
 * Create a stream of Documents from valid, cleaned CSV records
 */
function createDocumentStream(stats) {
  return through.obj(
    function write( record, enc, next ){
      try {
        // the file a record came from travels with it, see fileContext
        const { idPrefix, path } = fileContext.get(record);

        // the row's uid is the fallback if there is no HASH that can be used as a more
        // unique identifier. See `peliasModel.Document.setId()` for information about UIDs.
        const model_id = `${idPrefix}:${record.HASH || fileContext.getUid(record)}`;

        const doc = new peliasModel.Document('openaddresses', 'address', model_id)
          .setName('default', `${record.NUMBER} ${record.STREET}`)
          .setAddress('number', record.NUMBER)
          .setAddress('street', record.STREET)
          .setCentroid({ lon: record.LON, lat: record.LAT });

        if (record.POSTCODE) {
          doc.setAddress('zip', record.POSTCODE);
        }

        // attempt to set the country code based on the directory prefix
        const match = idPrefix.match(COUNTRY_CODE_PATTERN);
        if (match && match[1]) {
          doc.setMeta('country_code', match[1].toUpperCase());
        }

        // store a reference to the original OA record in a 'meta'
        // field, this is available through the pipeline but is not
        // saved to elasticsearch.
        doc.setMeta('oa', record);
        doc.setMeta('file', path);

        this.push(doc);
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
