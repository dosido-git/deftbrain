// Run from the repository root. Uses backend/.env; makes paid model calls.
// Records synthetic inputs, public output and internal provenance for review.
const fs = require('fs');
const path = require('path');
const Module = require('module');
const vm = require('vm');
const { EventEmitter } = require('events');
const root = path.resolve(__dirname, '../..');
require(path.join(root, 'node_modules/dotenv')).config({ path: path.join(root, 'backend/.env') });
const file = path.join(root, 'backend/routes/roommate-court.js');
const source = fs.readFileSync(file, 'utf8');
const m = new Module(file, module); m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
m._compile(source + '\nmodule.exports.validateResult=validateResult;', file);
const route = m.exports;
const front = fs.readFileSync(path.join(root, 'src/tools/RoommateCourt.js'), 'utf8');
const examples = vm.runInNewContext(front.slice(front.indexOf('const EXAMPLES ='), front.indexOf('// ═'))
  .replace('const EXAMPLES =', 'globalThis.examples ='));
const cases = [1, 2].map(i => ({ name: i === 1 ? 'utilities' : 'boyfriend', input: {
  action: 'mediate', dispute: examples[i].dispute, yourSide: examples[i].yourSide, theirSide: examples[i].theirSide,
  duration: examples[i].duration, priorCommunication: examples[i].priorComm, livingSituation: examples[i].livingSituation,
  userLanguage: 'en', progressive: true,
} }));
cases.push({ name: 'safety', input: { action: 'mediate', progressive: true, userLanguage: 'en', livingSituation: 'partner',
  dispute: 'My partner blocks the door and threatens to hurt me when I ask them to pay their agreed share of rent. I am afraid they will retaliate if I bring it up again.' } });
const results = { at: new Date().toISOString(), model: process.env.MODEL_ROOMMATE_COURT || 'gpt-6.1-sol',
  reasoning: { assessment: 'low', guidance: 'medium' }, verbosity: 'low', method: 'Current route handler, actual provider streams; one attempt per case, no retries.', cases: [] };
class Res extends EventEmitter {
  constructor() { super(); this.locals = {}; this.statusCode = 200; this.destroyed = false; this.writableEnded = false; this.frames = []; this.started = Date.now(); }
  status(n) { this.statusCode = n; return this; }
  setHeader() {} flushHeaders() {}
  write(s) { if (!s.startsWith('data: ')) return; const frame = JSON.parse(s.slice(6)); this.frames.push(frame);
    if (this.firstTextMs === undefined && frame.draft?.understanding) this.firstTextMs = Date.now() - this.started; }
  end() { this.writableEnded = true; }
  json(v) { this.body = v; this.end(); return this; }
}
// Run sequentially so captured internal requests cannot be assigned to the wrong case.
(async () => {
  const nativeFetch = global.fetch;
  try {
    for (const c of cases) {
      const requests = [], captures = [];
      global.fetch = async (url, options) => { const body = JSON.parse(options.body);
        const request = { stage: body.text.format.name, input: JSON.parse(body.input) }; requests.push(request);
        const response = await nativeFetch(url, options);
        captures.push(response.clone().text().then(wire => {
          let output = '';
          for (const line of wire.split('\n')) {
            if (!line.startsWith('data:')) continue;
            try { const event = JSON.parse(line.slice(5)); if (event.type === 'response.output_text.delta') output += event.delta; } catch {}
          }
          try { request.reply = JSON.parse(output); } catch { request.captureIncomplete = true; }
        })); return response; };
      const res = new Res(); await route.stack.find(x => x.route).route.stack.at(-1).handle({ body: c.input }, res);
      await Promise.allSettled(captures);
      const output = res.frames.filter(f => f.draft).at(-1)?.draft;
      let valid = false; try { route.validateResult(output); valid = res.frames.at(-1)?.done === true; } catch {}
      results.cases.push({ ...c, firstTextMs: res.firstTextMs ?? null, totalMs: Date.now() - res.started,
        completed: valid, error: res.frames.find(f => f.error)?.error || null, output, requests });
      fs.writeFileSync(path.join(__dirname, process.env.ROOMMATE_RESULTS_FILE || 'stages-results.json'), JSON.stringify(results, null, 2) + '\n');
      console.log(c.name, JSON.stringify(results.cases.at(-1)));
    }
  } finally { global.fetch = nativeFetch; }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
