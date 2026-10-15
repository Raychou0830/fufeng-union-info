import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifestPath=path.join(root,'.work/source-manifest.json');
const processed=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')).items:[];
const files=[],foldersMissing=[];
for(const folder of ['收到的訊息','收到的公文或活動資訊']){
  if(!fs.existsSync(path.join(root,folder))){foldersMissing.push(folder);continue;}
  for(const item of fs.readdirSync(path.join(root,folder),{withFileTypes:true})){
    if(!item.isFile())continue;
    const relative=folder+'/'+item.name,buffer=fs.readFileSync(path.join(root,relative)),sha256=createHash('sha256').update(buffer).digest('hex');
    const previous=processed.find(p=>p.source===relative);
    files.push({source:relative,sha256,status:previous?(previous.sha256===sha256?'processed':'changed'):'new',records:previous?.records||[]});
  }
}
const missing=processed.filter(p=>!files.some(f=>f.source===p.source)).map(p=>p.source);
const report={scannedAt:new Date().toISOString(),new:files.filter(f=>f.status==='new'),changed:files.filter(f=>f.status==='changed'),processed:files.filter(f=>f.status==='processed').length,missing,foldersMissing};
fs.mkdirSync(path.join(root,'.work'),{recursive:true});
fs.writeFileSync(path.join(root,'.work/inbox-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
console.log('Report saved locally in .work/inbox-report.json. This command does not classify, edit content or publish; Codex reviews the listed sources.');
