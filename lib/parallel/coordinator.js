/**
  Parallel import coordinator.

  Reads the OpenAddresses files one at a time and forwards their contents to N
  worker processes, each running the full import pipeline. Every file is read
  in order and split into blocks of records, so similar records stay close
  together in the index no matter how many workers there are, and all workers
  stay busy no matter how the files vary in size.

  Blocks go to whichever worker is currently accepting writes. When every
  worker is busy the reader waits, which propagates backpressure to the disk.
  The start of each file is sent to all workers so they know where blocks
  come from.

  Only used when imports.openaddresses.parallelism is greater than 1.
**/

const child = require('child_process');
const path = require('path');

const logger = require('pelias-logger').get('openaddresses');
const reader = require('./reader');
const frames = require('./frames');

const WORKER_PATH = path.join(__dirname, 'worker.js');

function run(files, dirPath, parallelism) {
  const state = { shuttingDown: false, exitCode: 0, workers: [] };
  const dispatcher = createDispatcher(state);

  for (let id = 0; id < parallelism; id++) {
    state.workers.push(spawnWorker(id, state, dispatcher));
  }
  logger.info(`started ${parallelism} import workers, importing ${files.length} files`);

  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => fatal(state, `received ${signal}`));
  });

  dispatchAll(reader.readFiles(files, dirPath), dispatcher)
    .then(() => {
      logger.info('reading complete, waiting for workers to flush');
      state.shuttingDown = true;
      dispatcher.end();
    })
    .catch((err) => fatal(state, err.message));
}

async function dispatchAll(frameSource, dispatcher) {
  for await (const frame of frameSource) {
    await dispatcher.send(frame);
  }
}

function spawnWorker(id, state, dispatcher) {
  const proc = child.spawn(process.execPath, process.execArgv.concat(WORKER_PATH), {
    stdio: ['pipe', 'inherit', 'inherit'],
    env: Object.assign({}, process.env, { PELIAS_OA_WORKER_ID: String(id) })
  });

  const worker = { id, proc, ready: true, alive: true };

  // a closed stdin surfaces as the exit below, no need to also throw here
  proc.stdin.on('error', () => {});

  proc.on('exit', (code, signal) => {
    worker.alive = false;
    worker.ready = false;
    dispatcher.notify();

    if (!state.shuttingDown) {
      fatal(state, `worker ${id} exited early (code ${code}, signal ${signal})`);
      return;
    }

    if (code !== 0) {
      logger.error(`worker ${id} exited with code ${code}, signal ${signal}`);
      state.exitCode = 1;
    }

    if (state.workers.every((w) => !w.alive)) {
      logger.info('import complete');
      process.exit(state.exitCode);
    }
  });

  return worker;
}

function createDispatcher(state) {
  let cursor = 0;
  let waiters = [];

  function write(worker, frame) {
    const wasReady = worker.ready;

    if (worker.proc.stdin.write(frame)) { return; }

    if (wasReady) {
      worker.ready = false;
      worker.proc.stdin.once('drain', () => {
        worker.ready = worker.alive;
        notify();
      });
    }
  }

  function notify() {
    const pending = waiters;
    waiters = [];
    pending.forEach((resolve) => resolve());
  }

  function waitForWorker() {
    return new Promise((resolve) => waiters.push(resolve));
  }

  // round robin over the workers currently accepting writes
  async function claim() {
    for (;;) {
      const workers = state.workers;

      for (let i = 0; i < workers.length; i++) {
        const worker = workers[(cursor + i) % workers.length];
        if (worker.alive && worker.ready) {
          cursor = (cursor + i + 1) % workers.length;
          return worker;
        }
      }

      if (!workers.some((w) => w.alive)) { throw new Error('all workers have exited'); }
      await waitForWorker();
    }
  }

  return {
    notify,

    send: async (frame) => {
      if (frame[0] === frames.FILE) {
        state.workers.filter((w) => w.alive).forEach((w) => write(w, frame));
        return;
      }
      write(await claim(), frame);
    },

    end: () => {
      state.workers.forEach((w) => { if (w.alive) { w.proc.stdin.end(); } });
    }
  };
}

function fatal(state, message) {
  logger.error(message);
  state.shuttingDown = true;
  state.workers.forEach((w) => { if (w.alive) { w.proc.kill(); } });
  process.exit(1);
}

module.exports = { run, createDispatcher };
