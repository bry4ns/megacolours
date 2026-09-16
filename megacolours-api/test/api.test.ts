import { strict as assert } from 'node:assert';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { before, after } from 'node:test';

process.env.NODE_ENV='test'; process.env.ADMIN_EMAIL='admin@test.local'; process.env.ADMIN_PASSWORD='secret-password'; process.env.SESSION_SECRET='test-secret';
const dir=mkdtempSync(join(tmpdir(),'megacolours-')); process.env.DATABASE_PATH=join(dir,'test.sqlite'); process.env.UPLOAD_DIR=join(dir,'uploads');
let app:any, cookie='';
before(async()=>{const mod=await import('../src/server.js');app=mod.buildApp();const r=await app.inject({method:'POST',url:'/api/admin/login',payload:{email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD}});assert.equal(r.statusCode,200);cookie=r.headers['set-cookie']!.split(';')[0]});
after(async()=>app.close());
const admin=(method:string,url:string,payload?:unknown,headers:any={})=>app.inject({method,url,payload,headers:{cookie,...headers}});
const base={productId:'pvc',width:100,height:100,quantity:1,options:[],deliveryMethodId:'pickup'};
test('catalog and auth',async()=>{assert.equal((await app.inject({method:'GET',url:'/api/catalog'})).json().products.length,5);assert.equal((await app.inject({method:'GET',url:'/api/admin/catalog'})).statusCode,401)});
test('pricing validation',async()=>{assert.equal((await app.inject({method:'POST',url:'/api/quotes/estimate',payload:base})).json().total,12000);assert.equal((await app.inject({method:'POST',url:'/api/quotes/estimate',payload:{...base,width:20,height:20}})).json().total,5000);assert.equal((await app.inject({method:'POST',url:'/api/quotes/estimate',payload:{...base,finalPrice:1}})).statusCode,400);assert.equal((await app.inject({method:'POST',url:'/api/quotes/estimate',payload:{...base,options:['x','x']}})).statusCode,400);assert.equal((await app.inject({method:'POST',url:'/api/quotes/estimate',payload:{...base,quantity:999999}})).statusCode,400);assert.equal((await app.inject({method:'POST',url:'/api/quotes/estimate',payload:{productId:'paloma',presetId:'std',width:80,height:180,quantity:1,options:[],deliveryMethodId:'pickup'}})).json().total,35000)});
test('admin schema and origin',async()=>{const p=(await admin('GET','/api/admin/catalog')).json().products[0];assert.equal((await admin('PUT','/api/admin/products/pvc',{...p,pricePerM2:-1})).statusCode,400);assert.equal((await admin('POST','/api/admin/logout',undefined,{origin:'https://evil.example'})).statusCode,403)});
test('quote snapshot history',async()=>{const r=await app.inject({method:'POST',url:'/api/quotes',payload:{selection:base,customer:{name:'Cliente',phone:'+56912345678',email:'a@example.com'}}});assert.equal(r.statusCode,201);const q=r.json();const p=(await admin('GET','/api/admin/catalog')).json().products[0];await admin('PUT','/api/admin/products/pvc',{...p,pricePerM2:99999});await admin('PATCH',`/api/admin/quotes/${q.id}/status`,{status:'CONTACTED'});const listed=(await admin('GET','/api/admin/quotes')).json().quotes[0];assert.equal(listed.snapshot.total,q.snapshot.total);assert.deepEqual(listed.history.map((x:any)=>x.status),['PENDING','CONTACTED'])});
test('invalid crop rejected',async()=>{const r=await app.inject({method:'POST',url:'/api/quotes',payload:{selection:base,customer:{name:'x',phone:'1',email:'a@example.com'},uploadId:'bad',crop:{x:0,y:2,zoom:1,rotation:0}}});assert.equal(r.statusCode,400)});
