import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function validateContent(data,attachments){
  const errors=[];const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
  if(!data.site?.title||!date(data.site.updatedAt))errors.push('Site title or update date missing');
  for(const key of ['posts','events','benefits']){
    if(!Array.isArray(data[key])){errors.push(key+' is not an array');continue;}
    const ids=new Set();for(const item of data[key]){
      if(!/^[a-z0-9-]+$/.test(item.id)||ids.has(item.id))errors.push('Invalid/duplicate id: '+item.id);ids.add(item.id);
      if(!item.title||!item.summary||!date(item.date))errors.push('Missing title, summary or date: '+item.id);
      for(const s of item.sources||[]){try{if(!['https:','http:'].includes(new URL(s.url).protocol))errors.push('Unsafe URL: '+item.id);}catch{errors.push('Invalid URL: '+item.id);}}
      if(item.expiresAt&&!date(item.expiresAt))errors.push('Invalid expiry: '+item.id);
      if(item.verifiedAt&&!date(item.verifiedAt))errors.push('Invalid verification date: '+item.id);
    }
  }
  if(!data.posts.some(p=>p.id===data.site.featuredPost))errors.push('Featured post does not exist');
  for(const p of data.posts){
    if(!['rights','document','news'].includes(p.type)||!p.relevance||!p.action||!Array.isArray(p.sections)||p.sections.some(s=>!s.heading||!s.text))errors.push('Article fields missing: '+p.id);
    if(p.archiveAfter&&!date(p.archiveAfter))errors.push('Invalid article archive date: '+p.id);
    if(p.relatedEvent&&!data.events.some(ev=>ev.id===p.relatedEvent))errors.push('Missing related event: '+p.id);
  }
  for(const b of data.benefits)if(!b.category||!b.highlight||!b.eligibility||!b.how||!Array.isArray(b.conditions)||!b.conditions.every(c=>typeof c==='string'))errors.push('Benefit fields missing: '+b.id);
  for(const b of data.benefits){
    if(b.applicationsClosed!==undefined&&typeof b.applicationsClosed!=='boolean')errors.push('Invalid application status: '+b.id);
    if(b.serviceFrom||b.serviceThrough)if(!date(b.serviceFrom)||!date(b.serviceThrough)||b.serviceFrom>b.serviceThrough)errors.push('Invalid service dates: '+b.id);
    if(b.sections&&(!Array.isArray(b.sections)||b.sections.some(s=>!s.heading||!s.text)))errors.push('Benefit sections missing: '+b.id);
    if(b.claimPeriods){
      if(!Array.isArray(b.claimPeriods))errors.push('Invalid claim periods: '+b.id);
      else for(const p of b.claimPeriods){
        if(!p.label||!['rideFrom','rideThrough','applicationFrom','applicationThrough'].every(k=>date(p[k]))||p.rideFrom>p.rideThrough||p.applicationFrom>p.applicationThrough)errors.push('Invalid claim dates: '+b.id);
        if(p.applicationOpen||p.applicationClose){
          if(!p.applicationOpen?.endsWith('+08:00')||!p.applicationClose?.endsWith('+08:00')||!(new Date(p.applicationOpen)<new Date(p.applicationClose))||p.applicationOpen.slice(0,10)!==p.applicationFrom||p.applicationClose.slice(0,10)!==p.applicationThrough)errors.push('Invalid claim cutoff: '+b.id);
        }
        if(p.applicationUrl){try{if(new URL(p.applicationUrl).protocol!=='https:')errors.push('Unsafe claim URL: '+b.id);}catch{errors.push('Unsafe claim URL: '+b.id);}}
      }
    }
  }
  const publicFiles=new Set(attachments.filter(a=>a.public===true).map(a=>a.file));
  for(const ev of data.events){
    if(!publicFiles.has(ev.pdf))errors.push('No approved attachment for '+ev.id);
    if(!ev.eligibility||!ev.location)errors.push('Event essentials missing: '+ev.id);
    if(!Array.isArray(ev.steps)||ev.steps.some(s=>!s.title||!s.text)||!Array.isArray(ev.history)||ev.history.some(h=>!date(h.date)||!h.text))errors.push('Event details missing: '+ev.id);
    if(!ev.registrationOpen?.endsWith('+08:00')||!ev.registrationClose?.endsWith('+08:00')||!(new Date(ev.registrationOpen)<new Date(ev.registrationClose)))errors.push('Invalid Taiwan registration times: '+ev.id);
  }
  if(errors.length)throw new Error(errors.join('\n'));
  return true;
}
export function checkFiles(){
  const data=JSON.parse(fs.readFileSync(path.join(root,'content/site.json'),'utf8'));
  const attachments=JSON.parse(fs.readFileSync(path.join(root,'content/attachments.json'),'utf8'));
  validateContent(data,attachments);
  for(const a of attachments.filter(a=>a.public===true)){
    const source=fs.readFileSync(path.resolve(root,a.source)),published=fs.readFileSync(path.join(root,'dist/files',a.file));
    if(createHash('sha256').update(source).digest('hex')!==a.sha256||!source.equals(published))throw new Error('PDF integrity mismatch: '+a.file);
  }
  const files=fs.readdirSync(path.join(root,'dist/files'));
  if(files.length!==attachments.filter(a=>a.public===true).length)throw new Error('Unapproved public file');
  const safeRoot=new Set(['assets','files','app.js','data.js','index.html','logic.js','render.js','styles.css','.nojekyll']);
  for(const file of fs.readdirSync(path.join(root,'dist')))if(!safeRoot.has(file))throw new Error('Unexpected public file: '+file);
  const publicText=fs.readFileSync(path.join(root,'dist/index.html'),'utf8')+fs.readFileSync(path.join(root,'dist/data.js'),'utf8');
  const privateRules=path.join(root,'.work/private-exclusions.json');
  const privateTerms=fs.existsSync(privateRules)?JSON.parse(fs.readFileSync(privateRules,'utf8')):[];
  for(const forbidden of [...privateTerms,'Direction contract','b4dc7cfb'])if(publicText.includes(forbidden))throw new Error('Private/internal content detected in public output. Review local exclusion rules.');
  console.log(`Checked ${data.posts.length} articles, ${data.events.length} events, ${data.benefits.length} benefits; ${files.length} PDFs match originals.`);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))checkFiles();
