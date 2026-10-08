import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
async function load(path) {
  const out = await build({ entryPoints:[path], bundle:true, platform:'node', format:'esm', write:false });
  return import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
}
const { emptyEvidenceLedger, recordSemanticReview, recordGateEvidence, verifiedAudit, approveWithEvidence } = await load('src/utils/pedagogical-evidence.ts');
const fixture=()=>({
  schema_version:'1.0',lesson:{id:'lesson-1',title:'Lesson',language:'vi',status:'draft'},
  outcomes:[{id:'lo-1',text:'Explain',source:'user_provided',status:'locked'}],
  evidence:[{id:'ev-1',description:'Explanation',supports_outcomes:['lo-1'],evidence_type:'constructed_response'}],
  learning_units:[{id:'unit-1',title:'Unit',supports_outcomes:['lo-1'],activities:[{id:'act-1',learning_type:'production',supports_outcomes:['lo-1'],instruction:'Write',assessment:{id:'as-1',purpose:'formative',supports_outcomes:['lo-1'],measures_evidence:['ev-1'],assessment_function:'construct',feedback:{mode:'immediate',correct:'Good'}}}]}],
  qa:{status:'not_run',checks:[]}
});
const revision=()=>({revision:1,value:fixture(),approvals:[]});
const review=(r,ledger,id)=>recordSemanticReview(r,ledger,{rule_id:id,reviewer:'Teacher',rationale:'Checked against source',source_reference:'doc-1 p.2',reviewed_at:'2026-10-08T10:00:00Z',verdict:'pass'});
test('cannot approve outcomes without signed gate evidence',()=>assert.throws(()=>approveWithEvidence(revision(),emptyEvidenceLedger(),'outcomes','2026-10-08T10:00:00Z')));
test('outcome approval requires matching gate evidence',()=>{
 const r=revision();const ledger=recordGateEvidence(r,emptyEvidenceLedger(),{gate:'outcomes',reviewer:'Teacher',rationale:'Verified outcomes',reviewed_at:'2026-10-08T10:00:00Z'});
 assert.equal(approveWithEvidence(r,ledger,'outcomes','2026-10-08T10:00:00Z').approvals.length,1);
});
test('semantic review evidence requires provenance and reviewer',()=>{
 assert.throws(()=>recordSemanticReview(revision(),emptyEvidenceLedger(),{rule_id:'LO-03',reviewer:'',rationale:'',source_reference:'',reviewed_at:'invalid',verdict:'pass'}));
});
test('unreviewed semantic rules block design approval',()=>{
 const r=revision();const ledger=recordGateEvidence(r,emptyEvidenceLedger(),{gate:'design',reviewer:'Teacher',rationale:'Verified',reviewed_at:'2026-10-08T10:00:00Z'});
 assert.equal(verifiedAudit(r,ledger).design_ready,false);
 assert.throws(()=>approveWithEvidence(r,ledger,'design','2026-10-08T10:00:00Z'));
});
test('review from prior revision cannot be replayed',()=>{
 const r=revision();const ledger=review(r,emptyEvidenceLedger(),'LO-03');
 assert.ok(verifiedAudit({...r,revision:2},ledger).missing_reviews.includes('LO-03'));
});
test('review cannot be replayed after lesson mutation',()=>{
 const r=revision();const ledger=review(r,emptyEvidenceLedger(),'LO-03');
 const changed={...r,value:{...r.value,lesson:{...r.value.lesson,title:'Tampered'}}};
 assert.ok(verifiedAudit(changed,ledger).missing_reviews.includes('LO-03'));
});
test('fake gate boolean flags are not accepted by evidence approval API',()=>{
 const r=revision();assert.throws(()=>approveWithEvidence(r,emptyEvidenceLedger(),'publication','2026-10-08T10:00:00Z',{package_valid:true,runtime_accepted:true,accessibility_passed:true,dependency_valid:true}));
});

test('three gates require current revision evidence and prerequisite approvals',()=>{
 let r=revision();let ledger=emptyEvidenceLedger();
 const sign=(gate)=>{ledger=recordGateEvidence(r,ledger,{gate,reviewer:'Teacher',rationale:'Checked',reviewed_at:'2026-10-08T10:00:00Z'});};
 sign('outcomes');
 r=approveWithEvidence(r,ledger,'outcomes','2026-10-08T10:00:00Z');
 sign('design');
 assert.throws(()=>approveWithEvidence(r,ledger,'design','2026-10-08T10:00:00Z'));
 for(const id of verifiedAudit(r,ledger).missing_reviews) ledger=review(r,ledger,id);
 assert.equal(verifiedAudit(r,ledger).review_complete,true);
 assert.equal(verifiedAudit(r,ledger).design_ready,true);
 r=approveWithEvidence(r,ledger,'design','2026-10-08T10:00:00Z');
 sign('publication');
 assert.throws(()=>approveWithEvidence(r,ledger,'publication','2026-10-08T10:00:00Z'));
 r=approveWithEvidence(r,ledger,'publication','2026-10-08T10:00:00Z',{
   package_valid:true,runtime_accepted:true,accessibility_passed:true,dependency_valid:true
 });
 assert.deepEqual(r.approvals.map(x=>x.gate),['outcomes','design','publication']);
});
test('failed review cannot be promoted to PASS',()=>{
 const r=revision();
 const ledger=recordSemanticReview(r,emptyEvidenceLedger(),{
   rule_id:'LO-03',reviewer:'Teacher',rationale:'Not observable',source_reference:'doc-1',
   reviewed_at:'2026-10-08T10:00:00Z',verdict:'fail'
 });
 assert.ok(verifiedAudit(r,ledger).missing_reviews.includes('LO-03'));
});
