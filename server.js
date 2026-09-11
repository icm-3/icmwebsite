import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DateTime } from 'luxon';
import { openStore } from './backend/store.js';
import { seed } from './backend/seed.js';
import { contentSchema,monthSchema,prayerRow } from './backend/schema.js';
import { prayerService,WORDPRESS } from './backend/prayers.js';
import { mobileContent } from './backend/mobile.js';

const root=path.dirname(fileURLToPath(import.meta.url));
export function createApp({dbPath=process.env.DB_PATH||path.join(root,'runtime/icm.sqlite'),fetcher=fetch,initialContent=seed()}={}) {
  const store=openStore(dbPath,initialContent),prayers=prayerService(store,fetcher),attempts=new Map();
  const origin=process.env.ICM_PUBLIC_ORIGIN||'http://127.0.0.1:4180';
  const secure=origin.startsWith('https://');
  const json=(res,status,value)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(value));};
  const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
  async function body(req) {
    if(!String(req.headers['content-type']).startsWith('application/json')) fail(415,'JSON body required');
    let size=0;const chunks=[];
    for await(const chunk of req){size+=chunk.length;if(size>2500000)fail(413,'Content exceeds 2.5 MB');chunks.push(chunk);}
    try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail(400,'Invalid JSON');}
  }
  const cookie=(token,maxAge=28800)=>`icm_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure?'; Secure':''}`;
  const server=createServer(async(req,res)=>{
    res.setHeader('x-content-type-options','nosniff');res.setHeader('referrer-policy','strict-origin-when-cross-origin');res.setHeader('x-frame-options','DENY');
    try {
      const url=new URL(req.url,origin),p=url.pathname,method=req.method;
      const publicRead=['/api/health','/api/cms','/api/content','/api/mobile-content','/api/prayers'].includes(p);
      if(publicRead){res.setHeader('access-control-allow-origin','*');res.setHeader('access-control-allow-methods','GET, HEAD, OPTIONS');res.setHeader('access-control-allow-headers','Accept');}
      if(method==='OPTIONS'&&publicRead){res.writeHead(204);return res.end();}
      const token=String(req.headers.cookie||'').match(/(?:^|;\s*)icm_session=([a-f0-9]{64})(?:;|$)/)?.[1];
      const user=store.session(token);
      if(['POST','PUT','DELETE','PATCH'].includes(method)) {
        if(req.headers.origin&&req.headers.origin!==origin)fail(403,'Origin is not allowed');
        if(req.headers['sec-fetch-site']==='cross-site')fail(403,'Cross-site writes are not allowed');
        if(p!=='/api/login') {
          if(!user)fail(401,'Sign in to continue');
          if(req.headers['x-csrf-token']!==user.csrf)fail(403,'Refresh your session and try again');
        }
      }
      if(p==='/api/login'&&method==='POST') {
        const ip=req.socket.remoteAddress,now=Date.now();
        for(const [k,v] of attempts)if(now-v.start>900000)attempts.delete(k);
        const attempt=attempts.get(ip)||{start:now,count:0};
        if(attempt.count>=10)fail(429,'Too many attempts. Try again in 15 minutes.');
        attempt.count++;attempts.set(ip,attempt);
        const b=await body(req);
        if(typeof b.username!=='string'||typeof b.password!=='string'||b.password.length>200)fail(400,'Invalid sign-in details');
        const session=store.login(b.username,b.password);
        if(!session)fail(401,'Incorrect username or password');
        attempts.delete(ip);res.setHeader('set-cookie',cookie(session.token));return json(res,200,{username:session.username,csrf:session.csrf});
      }
      if(p==='/api/session'&&method==='GET')return json(res,user?200:401,user||{error:'Sign in to continue'});
      if(p==='/api/logout'&&method==='POST'){store.logout(token);res.setHeader('set-cookie',cookie('',0));return json(res,200,{ok:true});}
      if(p.startsWith('/api/admin/')&&!user)fail(401,'Sign in to continue');
      if(p==='/api/health'&&method==='GET')return json(res,200,{ok:true,name:'ICM Connected'});
      if(p==='/api/cms'&&method==='GET')return json(res,200,store.read('published').content);
      if(p==='/api/content'&&method==='GET')return json(res,200,store.read('published'));
      if(p==='/api/mobile-content'&&method==='GET')return json(res,200,mobileContent(store.read('published').content));
      if(p==='/api/admin/content'&&method==='GET')return json(res,200,store.read('draft'));
      if(p==='/api/admin/content'&&method==='PUT') {
        const b=await body(req),parsed=contentSchema.parse(b.content);
        return json(res,200,store.save(parsed,b.revision,user.username,b.publish===true));
      }
      if(p==='/api/admin/revisions'&&method==='GET')return json(res,200,store.db.prepare('SELECT id,actor,action,created FROM revisions ORDER BY id DESC LIMIT 50').all());
      if(p==='/api/admin/media'&&method==='POST') {
        const b=await body(req);
        if(typeof b.data!=='string'||!['image/png','image/jpeg','image/webp'].includes(b.mime))fail(400,'Upload a PNG, JPEG, or WebP image');
        const data=Buffer.from(b.data,'base64');
        if(data.length>1500000||data.length<12)fail(400,'Image must be smaller than 1.5 MB');
        const valid=b.mime==='image/png'?data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):b.mime==='image/jpeg'?data[0]===255&&data[1]===216&&data[2]===255:data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP';
        if(!valid)fail(400,'Image format does not match its contents');
        const id=randomUUID();store.db.prepare('INSERT INTO media VALUES (?,?,?,?,?)').run(id,b.mime,data,user.username,new Date().toISOString());
        return json(res,201,{url:'/media/'+id});
      }
      if(p==='/api/admin/restore'&&method==='POST') {
        const b=await body(req),r=store.db.prepare('SELECT payload FROM revisions WHERE id=?').get(Number(b.id));
        if(!r)fail(404,'Revision not found');
        return json(res,200,store.save(contentSchema.parse(JSON.parse(r.payload)),b.revision,user.username,false));
      }
      if((p==='/api/prayers'||p==='/api/admin/prayers/sync')&&((p==='/api/prayers'&&method==='GET')||(p.endsWith('/sync')&&method==='POST'))) {
        const month=monthSchema.parse(url.searchParams.get('month')||DateTime.now().setZone('America/New_York').toFormat('yyyy-MM'));
        return json(res,200,await prayers.get(month,p.endsWith('/sync')));
      }
      if(p==='/api/admin/prayers/proposal'&&method==='GET') {
        const month=monthSchema.parse(url.searchParams.get('month'));
        const r=store.db.prepare('SELECT * FROM prayer_proposals WHERE month=?').get(month);
        return json(res,200,r?{...r,rows:JSON.parse(r.payload),base:JSON.parse(r.base),payload:undefined}:null);
      }
      if(p==='/api/admin/prayers/proposal'&&method==='PUT') {
        const b=await body(req),month=monthSchema.parse(b.month),cached=store.schedule(month);
        if(!cached)fail(409,'Sync the month before preparing changes');
        if(!Array.isArray(b.rows)||b.rows.length!==cached.rows.length)fail(400,'Keep every day in the proposal');
        const rows=b.rows.map(r=>prayerRow.parse(r));
        if(rows.some((r,i)=>r.key!==cached.rows[i].key))fail(400,'Proposal dates must match the official month');
        store.db.prepare('INSERT INTO prayer_proposals VALUES (?,?,?,?,?) ON CONFLICT(month) DO UPDATE SET payload=excluded.payload,base=excluded.base,actor=excluded.actor,updated=excluded.updated').run(month,JSON.stringify(rows),JSON.stringify(cached.rows),user.username,new Date().toISOString());
        return json(res,200,{ok:true,message:'Proposal saved. Official times are unchanged until applied in WordPress and synced.'});
      }
      if(p==='/api/admin/wordpress'&&method==='GET')return json(res,200,{source:WORDPRESS,editorUrl:WORDPRESS+'/wp-admin/admin.php?page=dpt',writeConnected:false,reason:'The existing plugin API is read-only. Use its WordPress editor to apply approved proposals.'});
      if(p.startsWith('/api/'))fail(404,'API route not found');
      if(method!=='GET'&&method!=='HEAD')fail(405,'Method not allowed');
      if(/^\/media\/[a-f0-9-]{36}$/.test(p)) {
        const r=store.db.prepare('SELECT mime,data FROM media WHERE id=?').get(p.slice(7));if(!r)fail(404,'Image not found');
        res.writeHead(200,{'content-type':r.mime,'cache-control':'public,max-age=31536000,immutable'});return res.end(method==='HEAD'?undefined:Buffer.from(r.data));
      }
      const aliases={'/':'index.html','/admin':'admin.html'};
      const relative=aliases[p]||decodeURIComponent(p).replace(/^\//,'');
      const allowed=/^(?:index|about|calendar|donate|news|programs|admin)\.html$/.test(relative)||relative==='styles.css'||/^public\/(?:app|images|icons|news)\/[a-zA-Z0-9_./-]+$/.test(relative);
      if(!allowed||relative.split('/').some(s=>s==='..'||s.startsWith('.')))fail(404,'Not found');
      const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
      const data=await readFile(path.join(root,relative));
      res.writeHead(200,{'content-type':(types[path.extname(relative)]||'application/octet-stream')+'; charset=utf-8','cache-control':'no-cache'});
      res.end(method==='HEAD'?undefined:data);
    }catch(e){json(res,e.status||(e.name==='ZodError'?400:e.code==='ENOENT'?404:500),{error:e.name==='ZodError'?e.issues.map(i=>i.path.join('.')+': '+i.message).join('; '):e.status?e.message:'Request could not be completed'});}
  });
  return {server,store,prayers};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const {server}=createApp();
  server.listen(Number(process.env.ICM_SERVER_PORT||4180),process.env.ICM_SERVER_HOST||'127.0.0.1',()=>console.log('ICM Connected: '+(process.env.ICM_PUBLIC_ORIGIN||'http://127.0.0.1:4180')+'/'));
}
