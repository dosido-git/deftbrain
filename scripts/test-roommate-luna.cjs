const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { EventEmitter } = require('events');
const sourcePath = process.env.ROOMMATE_ROUTE_FILE || path.join(__dirname, '../backend/routes/roommate-court.js');
const source = fs.readFileSync(sourcePath, 'utf8');
function fixture() { return {
  the_read: { label: 'YOUR REQUEST LOOKS REASONABLE', explanation: 'You asked for a clear shared arrangement.' },
  where_the_disagreement_is: { your_stated_concern: 'Ask before entering.', their_reported_concern: 'They say they misunderstood.', collision: 'Permission was not agreed.', unknowns_that_matter: ['Will they ask?'] },
  what_to_try: [{ action: 'Ask for permission each time.', why_it_may_help: 'It defines the request.' }],
  conversation: { start_with_this: 'Can we talk?', ask_this: 'Will you ask first?', if_they_push_back: [{ possible_response: 'If they say "but I returned it".', you_could_say: 'Please ask first. 🪑' }], proposal: 'Please ask before borrowing.' },
  if_that_doesnt_work: [{ next_step: 'Put the request in writing.', when_it_makes_sense: 'If a conversation remains unclear.' }], one_thing_not_to_lose_sight_of: null,
}; }
class Response extends EventEmitter {
  constructor(){ super(); this.locals={}; this.frames=[]; this.headers={}; this.headersSent=false; this.destroyed=false; this.writableEnded=false; this.statusCode=200; }
  status(n){this.statusCode=n;return this;}
  setHeader(k,v){this.headers[k]=v;}
  flushHeaders(){this.headersSent=true;}
  write(s){this.frames.push(s);}
  end(){this.writableEnded=true;}
  json(v){this.body=v;this.end();return this;}
}
function harness(fetchImpl, env={OPENAI_API_KEY:'test-key'}) {
  let handler;const calls=[],metrics=[];
  const router={post:(_p,_lim,h)=>{handler=h;}};
  const requires={
    express:{Router:()=>router},
    '../lib/claude':{callClaudeWithRetry:async()=>{throw Error('Unexpected Claude call');},withLanguage:(s,l)=>l==='es'?s+'\nRespond in Spanish.':s,withLocaleContext:()=>'',cleanJsonResponse:s=>s},
    '../lib/models':{MODELS:{SMART:'unchanged-claude'}},
    '../lib/rateLimiter':{rateLimit:()=>()=>{},DEFAULT_LIMITS:{}},
    '../lib/metricsSink':{logMetric:(...a)=>metrics.push(a)},
    '../lib/outputStandard':{currentIsTestClient:()=>true},
    '../lib/factCheck':{NO_QUOTE_RULE:'existing chore rule'},
  };
  const sandbox={require:n=>{if(!(n in requires))throw Error('Unexpected require '+n);return requires[n];},module:{exports:{}},process:{env},console:{error:()=>{}},AbortController,TextDecoder,structuredClone,setTimeout,clearTimeout,setInterval,clearInterval,fetch:async(url,options)=>{calls.push({url,options,body:JSON.parse(options.body)});return fetchImpl(options);}};
  vm.runInNewContext(source+'\nmodule.exports.testHelpers = { mediationDrafts, validateResult };',sandbox,{filename:sourcePath});
  return { handler:(body,res=new Response())=>handler({body},res).then(()=>res),calls,metrics,...sandbox.module.exports.testHelpers };
}
function provider(value, terminal='completed', chunkSize=13) {
  const text=JSON.stringify(value);const frames=[];
  for(let i=0;i<text.length;i+=19)frames.push({type:'response.output_text.delta',delta:text.slice(i,i+19)});
  frames.push({type:'response.'+terminal,response:{status:terminal,model:'gpt-6-luna',usage:{input_tokens:100,output_tokens:200,input_tokens_details:{cached_tokens:0}}}});
  const raw=frames.map(e=>'data: '+JSON.stringify(e)+'\r\n\r\n').join('');const encoded=new TextEncoder().encode(raw);
  return {ok:true,body:(async function*(){for(let i=0;i<encoded.length;i+=chunkSize)yield encoded.slice(i,i+chunkSize);})()};
}
function frames(res){return res.frames.filter(f=>f.startsWith('data:')).map(f=>JSON.parse(f.slice(5)));}
const input={action:'mediate',dispute:'My housemate borrows my chair without asking.',progressive:true};
test('one provider call publishes a complete read before completion and final payload matches schema',async()=>{
 const h=harness(()=>provider(fixture()));const r=await h.handler(input);const f=frames(r);
 assert.equal(h.calls.length,1);assert.equal(h.calls[0].body.model,'gpt-6-luna');assert.equal(h.calls[0].body.store,false);
 assert.equal(h.calls[0].body.text.format.strict,true);assert(!h.calls[0].body.instructions.includes('GLOBAL EPISTEMIC'));
 assert(f[0].draft.the_read.explanation);assert.equal(f[0].draft.conversation,undefined);
 assert.deepEqual(f.at(-2).draft,fixture());assert.deepEqual(f.at(-1),{done:true});assert(!f.some(x=>x.checked));assert.equal(h.metrics.length,1);
});
test('escaped quotes, braces, commas and multibyte text survive arbitrary stream fragmentation',async()=>{
 const v=fixture();v.the_read.explanation='Literal {braces}, a "quote", a slash \\ and café 🪑.';
 const h=harness(()=>provider(v,'completed',1));const r=await h.handler(input);assert.deepEqual(frames(r).at(-2).draft,v);
});
test('safety can omit every conversation script and closing perspective',async()=>{
 const v=fixture();v.the_read.label='THIS NEEDS A FIRMER BOUNDARY';v.conversation=null;
 const h=harness(()=>provider(v));const r=await h.handler(input);assert.equal(frames(r).at(-2).draft.conversation,null);assert(frames(r).at(-1).done);
});
test('non-progressive callers receive final JSON with no SSE frames',async()=>{
 const h=harness(()=>provider(fixture()));const r=await h.handler({...input,progressive:false});assert.deepEqual(JSON.parse(JSON.stringify(r.body)),fixture());assert.equal(r.frames.length,0);
});
test('incomplete output after a draft sends an error and never done',async()=>{
 const h=harness(()=>provider(fixture(),'incomplete'));const r=await h.handler(input);const f=frames(r);assert(f.some(x=>x.draft));assert(f.at(-1).error);assert(!f.some(x=>x.done));assert.equal(h.calls.length,1);
});
test('EOF without provider completion does not turn drafts into a complete answer',async()=>{
 const raw='data: '+JSON.stringify({type:'response.output_text.delta',delta:JSON.stringify(fixture())})+'\n\n';
 const h=harness(()=>({ok:true,body:(async function*(){yield new TextEncoder().encode(raw);})()}));const r=await h.handler(input);assert(frames(r).at(-1).error);assert(!frames(r).some(x=>x.done));
});
test('invalid enum and malformed nested arrays are rejected before success',async()=>{
 for(const mutate of [v=>v.the_read.label='MADE UP LABEL',v=>v.what_to_try=[{action:null,why_it_may_help:'why'}]]){
  const v=fixture();mutate(v);const h=harness(()=>provider(v));const r=await h.handler(input);assert(frames(r).at(-1).error);assert(!frames(r).some(x=>x.done));
 }
});
test('upstream refusal and HTTP errors do not leak details or retry',async()=>{
 const refuse='data: '+JSON.stringify({type:'response.refusal.delta',delta:'private-provider-refusal'})+'\n\n';
 for(const response of [{ok:false,status:401,body:null},{ok:true,body:(async function*(){yield new TextEncoder().encode(refuse);})()}]){
  const h=harness(()=>response);const r=await h.handler(input);assert(frames(r).at(-1).error);assert(!JSON.stringify(frames(r)).includes('private-provider'));assert.equal(h.calls.length,1);
 }
});
test('missing credentials and empty input make no model request',async()=>{
 const h=harness(()=>{throw Error('must not fetch');},{});const r=await h.handler(input);assert.equal(r.statusCode,503);assert.equal(h.calls.length,0);
 const configured=harness(()=>{throw Error('must not fetch');});const blank=await configured.handler({...input,dispute:'  '});assert.equal(blank.statusCode,400);assert.equal(configured.calls.length,0);
});
test('client disconnect aborts provider work',async()=>{
 let signal;const h=harness(options=>new Promise((resolve,reject)=>{signal=options.signal;signal.addEventListener('abort',()=>reject(Error('aborted')));}));
 const res=new Response();const running=h.handler(input,res);await new Promise(r=>setImmediate(r));res.destroyed=true;res.emit('close');await running;assert(signal.aborted);assert(!frames(res).some(x=>x.done));
});
test('locale and directly authored account provenance are retained',async()=>{
 const h=harness(()=>provider(fixture()));await h.handler({...input,userLanguage:'es',theirSide:'Written by me.',theirOwnWords:true,disputeByThem:true});
 assert(h.calls[0].body.instructions.includes('Spanish'));assert(h.calls[0].body.input.includes('written by the other person themselves'));assert(h.calls[0].body.input.includes("the other person's description"));
});

function browserHook(wire) {
  const hookFile = process.env.ROOMMATE_HOOK_FILE || path.join(__dirname, '../src/hooks/useClaudeAPI.js');
  const code = fs.readFileSync(hookFile,'utf8').replace(/^import .*;\n/gm,'').replace('export const useClaudeAPI =','const useClaudeAPI =');
  const sandbox={module:{exports:{}},process:{env:{}},useState:v=>[v,()=>{}],useRef:v=>({current:v}),useLocale:()=>({userLanguage:'en'}),track:()=>{},beginWait:()=>()=>{},summarizeRequest:()=>'',toolFromPath:()=>'',setWaitSearching:()=>{},signalBusy:()=>{},t:k=>k,AbortController,TextDecoder,setTimeout,clearTimeout,fetch:async()=>({ok:true,status:200,headers:{get:()=> 'text/event-stream'},body:new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(wire));controller.close();}})})};
  vm.runInNewContext(code+'\nmodule.exports=useClaudeAPI();',sandbox,{filename:hookFile});return sandbox.module.exports;
}
const wire = f => 'data: '+JSON.stringify(f)+'\n\n';
test('frontend accepts only an explicitly complete stream when required',async()=>{
 const hook=browserHook(wire({draft:fixture()})+wire({done:true}));const r=await hook.callToolEndpointProgressive('roommate-court',{}, {requireComplete:true});assert.equal(r.the_read.label,fixture().the_read.label);
});
test('frontend rejects a transport EOF after a draft for Roommate Court',async()=>{
 const hook=browserHook(wire({draft:fixture()}));await assert.rejects(hook.callToolEndpointProgressive('roommate-court',{}, {requireComplete:true}),/interrupted/);
});
test('frontend propagates an upstream error even after a displayed draft',async()=>{
 const hook=browserHook(wire({draft:fixture()})+wire({error:'Please try again.'}));await assert.rejects(hook.callToolEndpointProgressive('roommate-court',{}, {requireComplete:true}),/Please try again/);
});
test('other progressive callers retain their existing partial-answer behavior',async()=>{
 const hook=browserHook(wire({draft:fixture()}));const r=await hook.callToolEndpointProgressive('other-tool',{});assert.equal(r.the_read.label,fixture().the_read.label);
});
