const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { EventEmitter } = require('events');
const sourcePath = process.env.ROOMMATE_ROUTE_FILE || path.join(__dirname, '../backend/routes/roommate-court.js');
const source = fs.readFileSync(sourcePath, 'utf8');
function fixture() { return {
  understanding: 'You asked for a clear shared arrangement.',
  way_forward: { recommendation: 'Ask for permission each time.', reason: 'It defines the request.', supporting_actions: [], fallback: null },
  words_you_can_use: { script: 'Please ask before borrowing.', pushback: { possible_response: 'But I returned it.', you_could_say: 'Please ask first. 🪑' } },
}; }
function caseFixture() { return { entries: [{ source_id: 'description', kind: 'concern', party: 'visitor',
 excerpt: 'borrows my chair without asking.' }], uncertainties: [] }; }
function assessmentFixture(v=fixture()) { return { case_record: caseFixture(), understanding: v.understanding }; }
function guidanceFixture(v=fixture()) { return { way_forward: v.way_forward, words_you_can_use: v.words_you_can_use,
 coverage: [{item_id:'p1',treatment:'addresses',advice_excerpt:v.way_forward.recommendation}],
 script_review: v.words_you_can_use ? [v.words_you_can_use.script,v.words_you_can_use.pushback?.you_could_say].filter(Boolean)
  .map(excerpt=>({excerpt,basis:'new_option',source_ids:[],proposal_framing:excerpt})) : [],
 }; }
function stageProvider(options,v=fixture(),terminal='completed',chunkSize=13) {
 return provider(JSON.parse(options.body).text.format.name==='roommate_assessment'?assessmentFixture(v):guidanceFixture(v),terminal,chunkSize);
}
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
  vm.runInNewContext(source+'\nmodule.exports.testHelpers = { mediationDrafts, validateResult, validateCase, validateGuidance };',sandbox,{filename:sourcePath});
  return { handler:(body,res=new Response())=>handler({body},res).then(()=>res),calls,metrics,...sandbox.module.exports.testHelpers };
}
function provider(value, terminal='completed', chunkSize=13) {
  const text=JSON.stringify(value);const frames=[];
  for(let i=0;i<text.length;i+=19)frames.push({type:'response.output_text.delta',delta:text.slice(i,i+19)});
  frames.push({type:'response.'+terminal,response:{status:terminal,model:'gpt-6.1-sol',usage:{input_tokens:100,output_tokens:200,input_tokens_details:{cached_tokens:0}}}});
  const raw=frames.map(e=>'data: '+JSON.stringify(e)+'\r\n\r\n').join('');const encoded=new TextEncoder().encode(raw);
  return {ok:true,body:(async function*(){for(let i=0;i<encoded.length;i+=chunkSize)yield encoded.slice(i,i+chunkSize);})()};
}
function frames(res){return res.frames.filter(f=>f.startsWith('data:')).map(f=>JSON.parse(f.slice(5)));}
const input={action:'mediate',dispute:'My housemate borrows my chair without asking.',progressive:true};
test('two calls publish assessment early, retain the public contract and hide internal records',async()=>{
 const h=harness(options=>stageProvider(options));const r=await h.handler(input);const f=frames(r);
 assert.equal(h.calls.length,2);assert.equal(h.calls[0].body.model,'gpt-6.1-sol');assert.equal(h.calls[0].body.reasoning.effort,'low');assert.equal(h.calls[1].body.reasoning.effort,'medium');assert.equal(h.calls[0].body.store,false);
 assert.equal(h.calls[0].body.text.format.strict,true);assert(!h.calls[0].body.instructions.includes('GLOBAL EPISTEMIC'));
 assert(f[0].draft.understanding);assert.equal(f[0].draft.words_you_can_use,undefined);
 assert.deepEqual(f.at(-2).draft,fixture());assert.deepEqual(f.at(-1),{done:true});assert(!f.some(x=>x.checked));assert.equal(h.metrics.length,3);
});
test('escaped quotes, braces, commas and multibyte text survive arbitrary stream fragmentation',async()=>{
 const v=fixture();v.understanding='Literal {braces}, a "quote", a slash \\ and café 🪑.';
 const h=harness(options=>stageProvider(options,v,'completed',1));const r=await h.handler(input);assert.deepEqual(frames(r).at(-2).draft,v);
});
test('safety can omit conversation advice',async()=>{
 const v=fixture();v.words_you_can_use=null;
 const h=harness(options=>stageProvider(options,v));const r=await h.handler(input);assert.equal(frames(r).at(-2).draft.words_you_can_use,null);assert(frames(r).at(-1).done);
});
test('a conditional fallback is accepted without requiring a pushback or extra actions',async()=>{
 const v=fixture();v.way_forward.fallback={condition:'If the agreed boundary is ignored again.',next_step:'Keep the chair in your own room while you revisit access.'};v.words_you_can_use.pushback=null;
 const h=harness(options=>stageProvider(options,v));const r=await h.handler(input);assert.deepEqual(frames(r).at(-2).draft,v);assert(frames(r).at(-1).done);
});
test('non-progressive callers receive final JSON with no SSE frames',async()=>{
 const h=harness(options=>stageProvider(options));const r=await h.handler({...input,progressive:false});assert.deepEqual(JSON.parse(JSON.stringify(r.body)),fixture());assert.equal(r.frames.length,0);
});
test('incomplete output after a draft sends an error and never done',async()=>{
 const h=harness(options=>stageProvider(options,fixture(),'incomplete'));const r=await h.handler(input);const f=frames(r);assert(f.some(x=>x.draft));assert(f.at(-1).error);assert(!f.some(x=>x.done));assert.equal(h.calls.length,2);
});
test('EOF without provider completion does not turn drafts into a complete answer',async()=>{
 const raw='data: '+JSON.stringify({type:'response.output_text.delta',delta:JSON.stringify(assessmentFixture())})+'\n\n';
 const h=harness(()=>({ok:true,body:(async function*(){yield new TextEncoder().encode(raw);})()}));const r=await h.handler(input);assert(frames(r).at(-1).error);assert(!frames(r).some(x=>x.done));
});
test('missing understanding and excessive supporting actions are rejected before success',async()=>{
 for(const mutate of [v=>v.understanding=null,v=>v.way_forward.supporting_actions=['one','two','three']]){
  const v=fixture();mutate(v);const h=harness(options=>stageProvider(options,v));const r=await h.handler(input);assert(frames(r).at(-1).error);assert(!frames(r).some(x=>x.done));
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
test('disconnect cancels both overlapping provider calls',async()=>{
 let begin;const started=new Promise(r=>{begin=r;});
 const h=harness(options=>{
  if(JSON.parse(options.body).text.format.name==='roommate_assessment')return provider(assessmentFixture());
  begin();return new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}));
 });const res=new Response(),running=h.handler(input,res);await started;
 assert.equal(h.calls.length,2);assert.equal(h.calls[0].options.signal,h.calls[1].options.signal);
 res.destroyed=true;res.emit('close');await running;assert(h.calls[1].options.signal.aborted);assert(!frames(res).some(f=>f.done));
});
test('locale and directly authored account provenance are retained',async()=>{
 const h=harness(options=>stageProvider(options));await h.handler({...input,userLanguage:'es',theirSide:'Written by me.',theirOwnWords:true,disputeByThem:true});
 assert(h.calls[0].body.instructions.includes('Spanish'));
 const sources=JSON.parse(h.calls[0].body.input).sources;
 assert.equal(sources.find(s=>s.id==='description').author,'other');
 assert.equal(sources.find(s=>s.id==='other_account').author,'other');
 assert.equal(sources.find(s=>s.id==='other_account').attribution,'direct');
 assert.equal(sources.find(s=>s.id==='visitor_account'),undefined);
 const record=JSON.parse(h.calls[1].body.input).case_record;
 assert.equal(record.entries[0].author,'other');
});

test('unsupported or cross-source excerpts block guidance before any draft is exposed',async()=>{
 for(const change of [r=>r.entries[0].excerpt='An invented admission.',r=>r.entries[0].source_id='other_account']){
  const record=caseFixture();change(record);
  const h=harness(()=>provider({case_record:record,understanding:fixture().understanding}));
  const r=await h.handler(input);assert.equal(h.calls.length,1);assert(!frames(r).some(f=>f.draft));assert(frames(r).at(-1).error);
 }
});
test('missing, duplicated and ungrounded coverage cannot be published as completed guidance',async()=>{
 for(const change of [g=>g.coverage=[],g=>g.coverage.push(g.coverage[0]),g=>g.coverage[0].advice_excerpt='Advice that was never written.']){
  const h=harness(options=>{
   if(JSON.parse(options.body).text.format.name==='roommate_assessment')return provider(assessmentFixture());
   const g=guidanceFixture();change(g);return provider(g);
  });const r=await h.handler(input);const f=frames(r);
  assert(f.some(x=>x.draft?.understanding));assert(!f.some(x=>x.draft?.way_forward));assert(f.at(-1).error);assert(!f.some(x=>x.done));
 }
});
test('recorded safety risk prevents conversation scripts even if the second model supplies one',async()=>{
 const record=caseFixture();record.entries[0].kind='safety_risk';
 const h=harness(options=>JSON.parse(options.body).text.format.name==='roommate_assessment'
  ?provider({case_record:record,understanding:fixture().understanding}):provider(guidanceFixture()));
 const r=await h.handler(input);assert(frames(r).at(-1).error);assert(!frames(r).some(f=>f.done));
});
test('guidance starts before the assessment finishes and the assessment appears while guidance is pending',async()=>{
 let startGuidance,finishAssessment,finishGuidance;
 const started=new Promise(r=>{startGuidance=r;});
 const assessmentGate=new Promise(r=>{finishAssessment=r;});
 const guidanceGate=new Promise(r=>{finishGuidance=r;});
 const h=harness(options=>{
  if(JSON.parse(options.body).text.format.name==='roommate_assessment')return {ok:true,body:(async function*(){
   const prefix=JSON.stringify({case_record:caseFixture()}).slice(0,-1)+',';
   yield new TextEncoder().encode(wire({type:'response.output_text.delta',delta:prefix}));
   await assessmentGate;
   yield new TextEncoder().encode(wire({type:'response.output_text.delta',delta:'"understanding":'+JSON.stringify(fixture().understanding)+'}'}));
   yield new TextEncoder().encode(wire({type:'response.completed',response:{status:'completed'}}));
  })()};
  startGuidance();return guidanceGate.then(()=>provider(guidanceFixture()));
 });
 const res=new Response(),running=h.handler(input,res);
 await started;assert.equal(frames(res).length,0);finishAssessment();await new Promise(r=>setImmediate(r));
 assert.deepEqual(frames(res),[{draft:{understanding:fixture().understanding}}]);assert(!res.writableEnded);
 finishGuidance();await running;assert(frames(res).at(-1).done);
});
test('all decisive uncertainties and visitor offers require grounded advice coverage',()=>{
 const h=harness(()=>{});const record=caseFixture();record.entries[0].kind='conditional_offer';record.uncertainties=[{question:'Was anything accepted?',decision:'Whether to honor an agreement or negotiate terms.'}];
 const checked=h.validateCase(record,[{id:'description',text:input.dispute,author:'visitor',attribution:'direct'}]);
 assert.deepEqual(JSON.parse(JSON.stringify(checked.entries[0])).author,'visitor');
 assert.throws(()=>h.validateGuidance(guidanceFixture(),checked),/Missing concern coverage/);
});

test('an unreviewed script clause cannot pass just because another clause was grounded',()=>{
 const h=harness(()=>{}),c=h.validateCase(caseFixture(),[{id:'description',text:input.dispute,author:'visitor',attribution:'direct'}]);
 const g=guidanceFixture();g.words_you_can_use.script+=' I promise to pay extra.';
 assert.throws(()=>h.validateGuidance(g,c),/Unreviewed spoken advice/);
});
test('stated script positions must cite direct visitor positions, not another persons preference',()=>{
 const h=harness(()=>{}),base={entries:[{id:'p1',source_id:'other_account',kind:'preference',party:'other',excerpt:'I prefer simplicity.',author:'visitor',attribution:'reported'}],uncertainties:[]};
 const g=guidanceFixture();g.script_review[0]={excerpt:g.words_you_can_use.script,basis:'stated_position',source_ids:['p1'],proposal_framing:null};
 assert.throws(()=>h.validateGuidance(g,base),/not supplied directly/);
 for(const entry of [{...base.entries[0],kind:'concern',party:'visitor',attribution:'direct'}, {...base.entries[0],party:'visitor',author:'other',attribution:'direct'}])
  assert.throws(()=>h.validateGuidance(g,{entries:[entry],uncertainties:[]}),/not supplied directly/);
});
test('a directly supplied visitor preference can support a reviewed script',()=>{
 const h=harness(()=>{}),c={entries:[{id:'p1',source_id:'visitor_account',kind:'preference',party:'visitor',excerpt:'Please ask before borrowing.',author:'visitor',attribution:'direct'}],uncertainties:[]};
 const g=guidanceFixture();g.script_review[0]={excerpt:g.words_you_can_use.script,basis:'stated_position',source_ids:['p1'],proposal_framing:null};
 assert.equal(h.validateGuidance(g,c),g);
});
test('new script options require a framing excerpt actually present in the same spoken passage',()=>{
 const h=harness(()=>{}),c=h.validateCase(caseFixture(),[{id:'description',text:input.dispute,author:'visitor',attribution:'direct'}]);
 for(const frame of [null,'An option that was never presented.']){
  const g=guidanceFixture();g.script_review[0].proposal_framing=frame;
  assert.throws(()=>h.validateGuidance(g,c),/lacks public proposal framing/);
 }
});
test('uncertainty mentioned only in a reason, script or fallback condition does not count as action',()=>{
 const h=harness(()=>{}),c={entries:[],uncertainties:[{id:'q1',question:'Was there an agreement?',decision:'Whether to honor or negotiate terms.'}]};
 for(const placement of ['reason','script','condition']){
  const g=guidanceFixture();const quote='Was there an agreement?';
  if(placement==='reason')g.way_forward.reason=quote;
  if(placement==='script'){g.words_you_can_use.script=quote;g.script_review[0]={excerpt:quote,basis:'neutral_question',source_ids:[],proposal_framing:null};}
  if(placement==='condition')g.way_forward.fallback={condition:quote,next_step:'Pause the decision.'};
  g.coverage=[{item_id:'q1',treatment:'clarifies',advice_excerpt:quote}];
  assert.throws(()=>h.validateGuidance(g,c),/Uncertainty lacks actionable handling/);
 }
});
test('decisive uncertainty must have clarification, conditional action or a deferred decision',()=>{
 const h=harness(()=>{}),c={entries:[],uncertainties:[{id:'q1',question:'Was there an agreement?',decision:'Whether to honor or negotiate terms.'}]};
 for(const [treatment,action] of Object.entries({clarifies:'Before deciding, ask whether there was an accepted agreement.',conditional:'If an agreement was accepted, honor it; otherwise negotiate terms.',defers:'Pause changes until you establish what was accepted.'})){
  const g=guidanceFixture();g.way_forward.recommendation=action;g.coverage=[{item_id:'q1',treatment,advice_excerpt:g.way_forward.recommendation}];assert.equal(h.validateGuidance(g,c),g);
 }
 const g=guidanceFixture();g.coverage=[{item_id:'q1',treatment:'unresolved',advice_excerpt:g.way_forward.recommendation}];
 assert.throws(()=>h.validateGuidance(g,c),/Uncertainty lacks actionable handling/);
});

function browserHook(wire) {
  const hookFile = process.env.ROOMMATE_HOOK_FILE || path.join(__dirname, '../src/hooks/useClaudeAPI.js');
  const code = fs.readFileSync(hookFile,'utf8').replace(/^import .*;\n/gm,'').replace('export const useClaudeAPI =','const useClaudeAPI =');
  const sandbox={module:{exports:{}},process:{env:{}},useState:v=>[v,()=>{}],useRef:v=>({current:v}),useLocale:()=>({userLanguage:'en'}),track:()=>{},beginWait:()=>()=>{},summarizeRequest:()=>'',toolFromPath:()=>'',setWaitSearching:()=>{},signalBusy:()=>{},t:k=>k,AbortController,TextDecoder,setTimeout,clearTimeout,fetch:async()=>({ok:true,status:200,headers:{get:()=> 'text/event-stream'},body:new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(wire));controller.close();}})})};
  vm.runInNewContext(code+'\nmodule.exports=useClaudeAPI();',sandbox,{filename:hookFile});return sandbox.module.exports;
}
const wire = f => 'data: '+JSON.stringify(f)+'\n\n';
test('frontend accepts only an explicitly complete stream when required',async()=>{
 const hook=browserHook(wire({draft:fixture()})+wire({done:true}));const r=await hook.callToolEndpointProgressive('roommate-court',{}, {requireComplete:true});assert.equal(r.understanding,fixture().understanding);
});
test('frontend rejects a transport EOF after a draft for Roommate Court',async()=>{
 const hook=browserHook(wire({draft:fixture()}));await assert.rejects(hook.callToolEndpointProgressive('roommate-court',{}, {requireComplete:true}),/interrupted/);
});
test('frontend propagates an upstream error even after a displayed draft',async()=>{
 const hook=browserHook(wire({draft:fixture()})+wire({error:'Please try again.'}));await assert.rejects(hook.callToolEndpointProgressive('roommate-court',{}, {requireComplete:true}),/Please try again/);
});
test('other progressive callers retain their existing partial-answer behavior',async()=>{
 const hook=browserHook(wire({draft:fixture()}));const r=await hook.callToolEndpointProgressive('other-tool',{});assert.equal(r.understanding,fixture().understanding);
});
