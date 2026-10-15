import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHome, homeMore, escapeHtml } from '../web/render.js';
import { validateContent } from './check.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(root,'content/site.json'),'utf8'));
const attachments=JSON.parse(fs.readFileSync(path.join(root,'content/attachments.json'),'utf8'));
validateContent(data,attachments);
const dist = path.join(root,'dist');
if (path.dirname(dist)!==root || path.basename(dist)!=='dist') throw new Error('Unsafe build output path');
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(dist,{recursive:true});
for (const entry of fs.readdirSync(path.join(root,'web'),{withFileTypes:true})) {
  if (entry.name !== 'index.html') fs.cpSync(path.join(root,'web',entry.name),path.join(dist,entry.name),{recursive:true});
}
const now = process.env.SITE_BUILD_TIME ? new Date(process.env.SITE_BUILD_TIME) : new Date();
const html = fs.readFileSync(path.join(root,'web/index.html'),'utf8').replace('<!-- HOME_CONTENT -->',renderHome(data,now)+homeMore(data,now)).replaceAll('{{SITE_TITLE}}',escapeHtml(data.site.title)).replaceAll('{{DESCRIPTION}}',escapeHtml(data.site.description)).replaceAll('{{UPDATED_ISO}}',data.site.updatedAt).replaceAll('{{UPDATED_DATE}}',data.site.updatedAt.replaceAll('-','.'));
fs.writeFileSync(path.join(dist,'index.html'),html);
fs.writeFileSync(path.join(dist,'data.js'),'export default '+JSON.stringify(data)+';\n');
fs.writeFileSync(path.join(dist,'.nojekyll'),'');
fs.mkdirSync(path.join(dist,'files'),{recursive:true});
for(const attachment of attachments){
  if(attachment.public!==true)continue;
  if(!/^[a-z0-9-]+\.pdf$/.test(attachment.file))throw new Error('Unsafe PDF filename');
  const source=path.resolve(root,attachment.source);
  const sourceRoot=path.join(root,'content','public-files')+path.sep;
  if(!source.startsWith(sourceRoot))throw new Error('Attachment is outside the source folder');
  const {createHash}=await import('node:crypto');
  const bytes=fs.readFileSync(source);
  if(createHash('sha256').update(bytes).digest('hex')!==attachment.sha256)throw new Error('Attachment changed; review required: '+attachment.file);
  fs.writeFileSync(path.join(dist,'files',attachment.file),bytes);
}
console.log('Built dist/ (public files only).');
