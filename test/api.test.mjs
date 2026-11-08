import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {server,validateQuiz} from '../server.mjs';
const question={question:'What is a cell?',options:['A unit of life','A planet','A rock','A wave'],answer:0,explanation:'Cells are the basic unit of life.',source:'The cell is the basic unit of life.'};
test('question contract rejects invalid answers and duplicates',()=>{assert.equal(validateQuiz({questions:Array.from({length:5},()=>({...question}))}).questions.length,5);assert.throws(()=>validateQuiz({questions:[question]}));assert.throws(()=>validateQuiz({questions:Array.from({length:5},()=>({...question,answer:4}))}));assert.throws(()=>validateQuiz({questions:Array.from({length:5},()=>({...question,options:['A','A','B','C']}))}));});
test('API validates input, configuration, generation, and source grounding',async()=>{
 const old={...process.env};let badSource=false;
 const mock=http.createServer(async(req,res)=>{let b='';for await(const c of req)b+=c;const p=JSON.parse(b);assert.equal(p.model,'custom-model');assert.equal(req.url,'/v1/chat/completions');res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:JSON.stringify({questions:Array.from({length:5},()=>({...question,source:badSource?'invented quote':question.source}))})}}]}));});
 await new Promise(r=>mock.listen(0,'127.0.0.1',r));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const post=data=>fetch(base+'/api/quiz',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 try{assert.equal((await post({text:'short',level:1})).status,400);delete process.env.AI_BASE_URL;delete process.env.AI_MODEL;const input={text:question.source.repeat(5),level:1};assert.equal((await post(input)).status,503);process.env.AI_BASE_URL=`http://127.0.0.1:${mock.address().port}/v1`;process.env.AI_MODEL='custom-model';const r=await post(input);assert.equal(r.status,200);assert.equal((await r.json()).questions.length,5);badSource=true;assert.equal((await post(input)).status,502);}finally{await new Promise(r=>server.close(r));await new Promise(r=>mock.close(r));for(const key of ['AI_BASE_URL','AI_MODEL','AI_API_KEY']){if(old[key]===undefined)delete process.env[key];else process.env[key]=old[key];}}
});
