import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID, randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

export const hash = v => createHash('sha256').update(v).digest('hex');
export function openStore(file,seed) {
  if(file!==':memory:') mkdirSync(path.dirname(file),{recursive:true});
  const db=new DatabaseSync(file);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS content (slot TEXT PRIMARY KEY, revision INTEGER NOT NULL, payload TEXT NOT NULL, updated TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS revisions (id INTEGER PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, payload TEXT NOT NULL, created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, salt TEXT NOT NULL, password TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, username TEXT NOT NULL REFERENCES users(username), csrf TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS schedules (month TEXT PRIMARY KEY, payload TEXT NOT NULL, synced TEXT NOT NULL, error TEXT);
    CREATE TABLE IF NOT EXISTS prayer_proposals (month TEXT PRIMARY KEY, payload TEXT NOT NULL, base TEXT NOT NULL, actor TEXT NOT NULL, updated TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, mime TEXT NOT NULL, data BLOB NOT NULL, actor TEXT NOT NULL, created TEXT NOT NULL);
  `);
  for(const slot of ['draft','published']) db.prepare('INSERT OR IGNORE INTO content VALUES (?,1,?,?)').run(slot,JSON.stringify(seed),new Date().toISOString());
  const read=slot=>{const r=db.prepare('SELECT * FROM content WHERE slot=?').get(slot);return {revision:r.revision,content:JSON.parse(r.payload),updated:r.updated};};
  const transaction=fn=>{db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}};
  function save(content,revision,actor,publish=false) {
    return transaction(()=>{
      if(read('draft').revision!==revision) throw Object.assign(new Error('Someone else saved changes. Reload before saving.'),{status:409});
      const payload=JSON.stringify(content),now=new Date().toISOString();
      db.prepare('UPDATE content SET revision=revision+1,payload=?,updated=? WHERE slot=?').run(payload,now,'draft');
      if(publish) db.prepare('UPDATE content SET revision=revision+1,payload=?,updated=? WHERE slot=?').run(payload,now,'published');
      db.prepare('INSERT INTO revisions(actor,action,payload,created) VALUES (?,?,?,?)').run(actor,publish?'publish':'save',payload,now);
      return read('draft');
    });
  }
  function addUser(username,password) {
    if(!/^[a-zA-Z0-9@._-]{3,100}$/.test(username)||password.length<14) throw new Error('Use a username of 3–100 characters and a password of at least 14 characters.');
    const salt=randomBytes(16).toString('hex');
    db.prepare('INSERT INTO users VALUES (?,?,?) ON CONFLICT(username) DO UPDATE SET salt=excluded.salt,password=excluded.password').run(username,salt,scryptSync(password,salt,64).toString('hex'));
    db.prepare('DELETE FROM sessions WHERE username=?').run(username);
  }
  function login(username,password) {
    const u=db.prepare('SELECT * FROM users WHERE username=?').get(username);
    const actual=scryptSync(password,u?.salt||'dummy-salt',64);
    if(!u||!timingSafeEqual(actual,Buffer.from(u.password,'hex'))) return null;
    const token=randomBytes(32).toString('hex'),csrf=randomUUID();
    db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES (?,?,?,?)').run(hash(token),username,csrf,Date.now()+8*3600000);
    return {token,csrf,username};
  }
  return {db,read,save,addUser,login,transaction,
    session:token=>db.prepare('SELECT username,csrf FROM sessions WHERE token=? AND expires>?').get(hash(token||''),Date.now()),
    logout:token=>db.prepare('DELETE FROM sessions WHERE token=?').run(hash(token||'')),
    schedule:month=>{const r=db.prepare('SELECT * FROM schedules WHERE month=?').get(month);return r?{month,rows:JSON.parse(r.payload),syncedAt:r.synced,error:r.error}:null;},
    putSchedule:(month,rows)=>db.prepare('INSERT INTO schedules VALUES (?,?,?,NULL) ON CONFLICT(month) DO UPDATE SET payload=excluded.payload,synced=excluded.synced,error=NULL').run(month,JSON.stringify(rows),new Date().toISOString()),
  };
}
