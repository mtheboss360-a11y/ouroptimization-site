import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
const pages=fs.readdirSync(root).filter(n=>n.endsWith('.html'));
test('all 16 pages have current brand, one heading, and no retired prices',()=>{
 assert.equal(pages.length,16);
 for(const name of pages){const s=read(name);assert.equal((s.match(/<h1\b/g)||[]).length,1,name);assert.match(s,/<title>[^<]*Our Wellness Connections/,name);assert.doesNotMatch(s,/Our Wellness Network|R Wellness Network|\$500|\$700|\$1,400/,name);assert.match(s,/OUR Optimization LLC/,name);}
});
test('new pricing and route counts are present',()=>{
 const s=read('pricing.html');for(const v of ['$250','$400','$800','10 business visits','20 business visits','30 days','at no charge'])assert.ok(s.includes(v),v);
});
test('matching and three steps appear on both core pages',()=>{
 for(const n of ['index.html','referral-network.html']){const s=read(n);for(const v of ['Business matching,','We match you.','We run your routes.','You see every booking and where it came from.','Example'])assert.ok(s.includes(v),n+': '+v);}
});
test('contact choices, honeypot, endpoint and patient warning retained',()=>{
 const s=read('contact.html');for(const v of ['Referral network (routes)','Online search / review tags / website','Patient dinner','Not sure yet','name="dinner-call"','action="/thanks"','netlify-honeypot="bot-field"','Please don’t include any patient information.'])assert.ok(s.includes(v),v);
});
test('expo form transport retained',()=>{
 const s=read('expo-vendors.html');for(const v of ['name="expo-vendor"','action="/expo-vendors?sent=1"','data-netlify="true"','netlify-honeypot="bot-field"'])assert.ok(s.includes(v),v);
});
test('flyer service URLs redirect to referral network',()=>{
 const config=read('netlify.toml');for(const route of ['/flyer-network','/flyer-network.html','/flyer-drops','/flyer-drops.html']){const block=config.split('[[redirects]]').find(s=>s.includes('from = "'+route+'"'));assert.ok(block,route);assert.match(block,/to = "\/referral-network"/);assert.match(block,/status = 301/);}
 assert.ok(!fs.existsSync(path.join(root,'flyer-network.html')));
});
test('privacy, agreement safeguards and real client work retained',()=>{
 const p=read('privacy.html');assert.match(p,/2026-10-23/);assert.match(p,/not people’s location/);assert.match(p,/consent before anyone is texted/);
 const c=read('sample-contract.html');for(const v of ['Representing the clinic','Patient privacy','Ownership','Confidentiality','Liability and outcomes','one-page partner agreement','Nobody is paid per referral or per patient'])assert.ok(c.includes(v),v);
 assert.match(read('about.html'),/Grace Pediatrics/);
});
test('hero art, fonts and all portal screenshots remain byte-for-byte unchanged',()=>{
 const assets=JSON.parse(read('tests/preserved-assets.json'));
 for(const [name,hash] of Object.entries(assets)){const actual=createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex');assert.equal(actual,hash,name);}
});
