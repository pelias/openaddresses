const tape = require('tape');
const EventEmitter = require('events');

const frames = require('../../lib/parallel/frames');
const coordinator = require('../../lib/parallel/coordinator');

function fakeWorker(id) {
  const stdin = new EventEmitter();
  stdin.written = [];
  stdin.accepting = true;
  stdin.write = (buf) => { stdin.written.push(buf); return stdin.accepting; };
  stdin.end = () => { stdin.ended = true; };
  return { id, proc: { stdin }, ready: true, alive: true, stdin };
}

function setup(count) {
  const state = { workers: [] };
  for (let i = 0; i < count; i++) { state.workers.push(fakeWorker(i)); }
  return { state, dispatcher: coordinator.createDispatcher(state) };
}

const file = frames.encodeFile({ path: '/a.csv' });
const data = (s) => frames.encode(frames.DATA, Buffer.from(s));

tape('FILE frames go to every worker, DATA frames to exactly one', async (t) => {
  const { state, dispatcher } = setup(3);

  await dispatcher.send(file);
  await dispatcher.send(data('a'));
  await dispatcher.send(data('b'));

  t.deepEqual(state.workers.map((w) => w.stdin.written.length), [2, 2, 1], 'file everywhere, data round robin');
  t.ok(state.workers.every((w) => w.stdin.written[0] === file));
  t.end();
});

tape('busy workers are skipped and the sender waits when all are busy', async (t) => {
  const { state, dispatcher } = setup(2);
  state.workers.forEach((w) => { w.stdin.accepting = false; });

  await dispatcher.send(data('a')); // worker 0 takes it, then is busy
  await dispatcher.send(data('b')); // worker 1 takes it, then is busy

  let sent = false;
  const pending = dispatcher.send(data('c')).then(() => { sent = true; });
  await new Promise((resolve) => setImmediate(resolve));
  t.notOk(sent, 'send is waiting for a worker');

  state.workers[1].stdin.accepting = true;
  state.workers[1].stdin.emit('drain');
  await pending;

  t.deepEqual(state.workers.map((w) => w.stdin.written.length), [1, 2], 'drained worker got the block');
  t.end();
});

tape('a dead worker gets nothing and all dead is an error', async (t) => {
  const { state, dispatcher } = setup(2);
  state.workers[0].alive = false;
  state.workers[0].ready = false;

  await dispatcher.send(file);
  await dispatcher.send(data('a'));
  t.equal(state.workers[0].stdin.written.length, 0);
  t.equal(state.workers[1].stdin.written.length, 2);

  state.workers[1].alive = false;
  try {
    await dispatcher.send(data('b'));
    t.fail('should have thrown');
  } catch (e) {
    t.match(e.message, /exited/);
  }
  t.end();
});

tape('end closes stdin of live workers', (t) => {
  const { state, dispatcher } = setup(2);
  dispatcher.end();
  t.ok(state.workers.every((w) => w.stdin.ended));
  t.end();
});
