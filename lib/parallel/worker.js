/**
  A single import pipeline reading frames from stdin. Spawned by the
  coordinator, never run directly.
**/

require('pelias-config').generate(require('../../schema'));

const logger = require('pelias-logger').get('openaddresses');
const importPipeline = require('../importPipeline');
const rowSource = require('../rowSource');

const id = process.env.PELIAS_OA_WORKER_ID || '0';
const source = rowSource.fromFrames(process.stdin);

source.on('error', (err) => {
  logger.error(`worker ${id} failed to read input: ${err.message}`);
  process.exit(1);
});

logger.info(`import worker ${id} ready`);
importPipeline.create(source, `openaddresses-${id}`);
