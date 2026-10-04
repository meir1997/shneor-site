import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('./Code.gs', import.meta.url),'utf8');
let records = [];
const props = new Map([['SPREADSHEET_ID','test-sheet']]);
const cache = new Map([['form:nonce','1']]);
let headers;
let sent = 0;
const sheet = {
  getLastRow:()=>records.length + 1,
  getRange:(row,col,count,width)=>({
    getValues:()=>row===1 ? [headers] : records.map(r=>[...r]),
    setValues:values=>{records[row-2]=[...values[0]];},
    setValue:value=>{records[row-2][col-1]=value;}
  }),
  appendRow:row=>{records.push([...row]);}
};
const context = vm.createContext({
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>props.get(key)})},
  CacheService:{getScriptCache:()=>({get:key=>cache.get(key)})},
  LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
  SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet}),flush(){}},
  Utilities:{formatDate:()=> '2026-10-04 15:00:00',getUuid:()=> 'mock-uuid'},
  MailApp:{sendEmail:()=>{sent++;}},
  ContentService:{createTextOutput:()=>({setMimeType:()=>({})}),MimeType:{JSON:'json'}}
});
vm.runInContext(source+'\nthis.headers=HEADERS;',context); headers=Array.from(context.headers);
const input={name:'Test Parent',email:'TEST@example.com',phone:'+972501234567',consent:true,
  requestId:'12345678-1234-1234-1234-123456789012',nonce:'nonce'};
assert.equal(context.registerWorkshop(input).saved,true);
assert.equal(records.length,1); assert.equal(records[0][5],'ממתין לתשלום');
context.registerWorkshop(input); assert.equal(records.length,1);
assert.throws(()=>context.registerWorkshop({...input,phone:'bad'}),/INVALID_PHONE/);
assert.throws(()=>context.registerWorkshop({...input,consent:false}),/INVALID_CONSENT/);
assert.throws(()=>context.registerWorkshop({...input,email:'=evil@example.com'}),/INVALID_EMAIL/);
assert.throws(()=>context.registerWorkshop({...input,nonce:'missing'}),/FORM_EXPIRED/);
assert.equal(context.text_('=1+1'),"'=1+1");
const payload={webhookKey:'secret',purchasePageKey:'page',paymentSum:80,amount:1,
  transactionCode:'tx1',payerEmail:'test@example.com',payerPhone:'0501234567'};
const event={postData:{contents:JSON.stringify(payload)}};
assert.throws(()=>context.doPost(event),/WEBHOOK_DISABLED/);
props.set('GROW_WEBHOOK_ENABLED','true');props.set('GROW_WEBHOOK_KEY','secret');props.set('GROW_PAGE_KEY','page');
assert.throws(()=>context.validatePayment_({...payload,webhookKey:'bad'},{key:'secret',pageKey:'page'}),/UNAUTHORIZED/);
assert.throws(()=>context.validatePayment_({...payload,paymentSum:1},{key:'secret',pageKey:'page'}),/INVALID_PAYMENT/);
context.doPost(event);assert.equal(records[0][5],'שולם');
context.doPost(event);assert.equal(records.length,1);
context.doPost({postData:{contents:JSON.stringify({...payload,transactionCode:'tx2',payerEmail:'other@example.com'})}});
assert.equal(records[1][5],'שולם — לבדיקה');
context.sendZoomReminders_();assert.equal(sent,0);
records=Array.from({length:30},()=>['id','2026-10-03','Parent','x@example.com','0501234567','שולם']);
assert.throws(()=>context.registerWorkshop({...input,requestId:'12345678-1234-1234-1234-123456789013'}),/SOLD_OUT/);
console.log('Passed: validation, formula injection, idempotency, webhook authentication, amount, unmatched payments, email disabled and capacity.');
