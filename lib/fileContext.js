const _ = require('lodash');
const path = require('path');

// rows travel through the pipeline under this key until they become Documents.
// a symbol keeps it out of Object.keys(), JSON output and the stored `oa` meta.
const FILE_CONTEXT = Symbol('fileContext');

// identifies a row within its file, for ids when there is no content hash
const ROW_UID = Symbol('rowUid');

/*
 * Construct a suitable id prefix for a CSV file given
 * its full filename and the base directory of all OA CSV files.
 */
function getIdPrefix(filename, dirPath) {
  if (filename && dirPath) {
    // if the file is within the dir path, use the structure
    // of the directory tree to create the id
    if (filename.indexOf(dirPath) !== -1) {
      const subpath = _.replace(filename, dirPath, '');
      const prefix = _.replace(_.replace(subpath, /\.(csv|geojson)/, ''), /\.gz/, '');
      return _.trim(prefix, '/');
    }
  }

  // if the dirPath doesn't contain this file, return the basename without extension
  return path.basename(path.basename(path.basename(filename, '.gz'), '.csv'), '.geojson');
}

// the per-file information every row needs downstream
function create(filePath, idPrefix) {
  return {
    path: filePath,
    idPrefix: idPrefix,
    countryCode: idPrefix.replace(/\\/g, '/').split('/')[0]
  };
}

function attach(row, context, uid) {
  row[FILE_CONTEXT] = context;
  row[ROW_UID] = uid;
  return row;
}

function get(row) {
  return row[FILE_CONTEXT];
}

function getUid(row) {
  return row[ROW_UID];
}

module.exports = { FILE_CONTEXT, ROW_UID, getIdPrefix, create, attach, get, getUid };
