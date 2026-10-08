import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
async function load(path) {
  const out = await build({ entryPoints:[path], bundle:true, platform:'node', format:'esm', write:false, loader:{'.json':'json'} });
  return import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
}
const { validateLessonSchema } = await load('src/utils/pedagogical-schema-validator.ts');
const { auditLesson } = await load('src/utils/pedagogical-semantic-auditor.ts');
const fixture = () => ({
  schema_version:'1.0',
  lesson:{id:'lesson-1',title:'Lesson',language:'vi',status:'draft'},
  outcomes:[{id:'lo-1',text:'Explain',source:'official',status:'locked',cognitive_process:'understand'}],
  evidence:[{id:'ev-1',description:'Written explanation',supports_outcomes:['lo-1'],evidence_type:'constructed_response'}],
  learning_units:[{id:'unit-1',title:'Unit',supports_outcomes:['lo-1'],activities:[{
    id:'act-1',learning_type:'production',supports_outcomes:['lo-1'],instruction:'Write',
    assessment:{id:'as-1',purpose:'formative',supports_outcomes:['lo-1'],measures_evidence:['ev-1'],assessment_function:'construct'}
  }]}],
  qa:{status:'not_run',checks:[]}
});
test('runtime validator accepts canonical fixture',()=>assert.equal(validateLessonSchema(fixture()).valid,true));
test('runtime validator rejects unknown nested properties',()=>{const x=fixture();x.lesson.hacked=true;assert.equal(validateLessonSchema(x).valid,false);});
test('runtime validator rejects invalid nested enum',()=>{const x=fixture();x.learning_units[0].activities[0].learning_type='invalid';assert.equal(validateLessonSchema(x).valid,false);});
test('runtime validator rejects missing required nested field',()=>{const x=fixture();delete x.learning_units[0].activities[0].instruction;assert.equal(validateLessonSchema(x).valid,false);});
test('auditor reports all 25 rules, no duplicates',()=>{const x=auditLesson(fixture(),{'lo-1':'Explain'});assert.equal(x.results.length,25);assert.equal(new Set(x.results.map(r=>r.rule_id)).size,25);});
test('semantic review never silently passes',()=>{const x=auditLesson(fixture(),{'lo-1':'Explain'});assert.equal(x.design_ready,false);assert.ok(x.review_required.includes('LO-03'));});
test('official outcome requires trusted snapshot',()=>{const x=auditLesson(fixture());assert.equal(x.results.find(r=>r.rule_id==='LO-01').status,'block');});
test('modified official outcome is blocked',()=>{const x=auditLesson(fixture(),{'lo-1':'Different'});assert.equal(x.results.find(r=>r.rule_id==='LO-01').status,'block');});
test('malformed schema blocks design readiness',()=>{const x=fixture();x.schema_version='9';const result=auditLesson(x,{'lo-1':'Explain'});assert.equal(result.design_ready,false);assert.equal(result.schema.valid,false);});
