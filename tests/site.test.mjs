import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {taipeiDate,eventState,benefitState,claimState,archivedPost,safeUrl,textMatch,escapeHtml} from '../web/logic.js';
import {renderEvent,renderHome,renderArchive,filterWelfare,renderPost,renderBenefit,renderSearch,renderMore} from '../web/render.js';
import {validateContent,checkFiles} from '../scripts/check.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../content/site.json',import.meta.url),'utf8'));
const attachments=JSON.parse(fs.readFileSync(new URL('../content/attachments.json',import.meta.url),'utf8'));
const movie=data.events.find(e=>e.id==='movie-2026');
test('registration changes exactly at the Taiwan cutoff',()=>{
  assert.equal(eventState(movie,new Date('2026-10-09T07:59:59Z')).canRegister,true);
  assert.equal(eventState(movie,new Date('2026-10-09T08:00:00Z')).canRegister,false);
  assert.equal(eventState(movie,new Date('2026-09-29T04:59:59Z')).label,'報名尚未開始');
});
test('event stays current on its date, archives after Taipei midnight',()=>{
  assert.equal(eventState(movie,new Date('2026-10-18T15:59:59Z')).archive,false);
  assert.equal(eventState(movie,new Date('2026-10-18T16:00:00Z')).archive,true);
  assert.equal(taipeiDate(new Date('2026-10-18T16:00:00Z')),'2026-10-19');
});
test('closed and archived events never render a registration CTA',()=>{
  const now=new Date('2026-10-15T04:00:00Z');
  assert.doesNotMatch(renderEvent(data,movie.id,now),/>前往報名/);
  assert.match(renderEvent(data,movie.id,now),/報名截止/);
  assert.match(renderEvent(data,movie.id,new Date('2026-10-09T07:00:00Z')),/>前往報名/);
});
test('unknown validity is never treated as verified or permanent',()=>{
  assert.match(benefitState({id:'unknown'},new Date('2026-10-15T00:00:00Z')).label,/待確認/);
  const b={id:'test',expiresAt:'2026-10-15',verifiedAt:'2026-10-01'};
  assert.equal(benefitState(b,new Date('2026-10-15T15:59:00Z')).archive,false);
  assert.equal(benefitState(b,new Date('2026-10-15T16:00:00Z')).archive,true);
});
test('HSR form only appears during the exact third-period application window',()=>{
  const b=data.benefits.find(b=>b.id==='hsr-cashback'),p=b.claimPeriods[0];
  const before=new Date('2026-09-30T16:00:59Z'),start=new Date('2026-09-30T16:01:00Z');
  const last=new Date('2026-10-15T15:59:59.999Z'),cutoff=new Date('2026-10-15T16:00:00Z');
  assert.equal(claimState(p,before).open,false);assert.equal(claimState(p,start).open,true);
  assert.equal(claimState(p,last).open,true);assert.equal(claimState(p,cutoff).open,false);
  assert.match(renderBenefit(data,b.id,last),/href="https:\/\/forms.gle\/rQ2Gd8RexAXAjqm79"/);
  assert.doesNotMatch(renderBenefit(data,b.id,cutoff),/href="https:\/\/forms.gle\/rQ2Gd8RexAXAjqm79"/);
  assert.match(benefitState(b,last).label,/今日23:59截止/);
  assert.match(benefitState(b,cutoff).label,/第四期搭乘累計中/);
});
test('fourth-period ride dates remain separate from next-year applications',()=>{
  const b=data.benefits.find(b=>b.id==='hsr-cashback'),p=b.claimPeriods[1];
  assert.equal(p.rideThrough,'2026-12-31');assert.equal(p.applicationFrom,'2027-01-01');assert.equal(p.applicationThrough,'2027-01-15');
  assert.match(benefitState(b,new Date('2027-01-01T00:00:00+08:00')).label,/第四期申請中/);
  assert.match(benefitState(b,new Date('2027-01-16T00:00:00+08:00')).label,/已截止/);
  assert.doesNotMatch(renderBenefit(data,b.id,new Date('2027-01-01T00:00:00+08:00')),/forms.gle/);
});
test('confirmed contracts expire after their final Taipei day and editorial notes stay private',()=>{
  for(const b of data.benefits.filter(b=>b.expiresAt)){
    assert.equal(benefitState(b,new Date(b.expiresAt+'T23:59:59+08:00')).label,(b.validityLabel||'效期至 ')+b.expiresAt.replaceAll('-','.'));
    assert.equal(benefitState(b,new Date(new Date(b.expiresAt+'T23:59:59+08:00').getTime()+1000)).archive,true);
  }
  assert.doesNotMatch(JSON.stringify(data),/來源完整性|資料夾內|收到的文字未|原訊息未載|尚未取得完整|標記疑義|公開整理方式/);
});
test('September travel redemption stays archived despite later travel dates',()=>{
  const now=new Date('2026-10-15T12:00:00+08:00');
  assert.doesNotMatch(filterWelfare(data,'全部','易遊網',now).html,/eztravel-member-day-20260915/);
  assert.match(renderArchive(data,new URLSearchParams('kind=benefit'),now),/易遊網企業會員日/);
  assert.match(renderSearch(data,new URLSearchParams('q=易遊網'),now),/優惠已到期/);
  assert.doesNotMatch(JSON.stringify(data),/\b(?:BNEU\d+|B2E[A-Z0-9]+)\b/);
});
test('closed LINE applications stay archived while the service period continues',()=>{
  const now=new Date('2026-10-15T12:00:00+08:00'),line=data.benefits.find(b=>b.id==='line-official-account-2026');
  assert.equal(line.serviceThrough,'2027-07-31');assert.deepEqual(benefitState(line,now),{label:'申請已截止',archive:true});
  assert.equal(filterWelfare(data,'全部','LINE@',now).count,0);
  assert.match(renderArchive(data,new URLSearchParams('kind=benefit'),now),/申請已截止/);
  const html=renderBenefit(data,line.id,now);assert.match(html,/2027\/7\/31/);assert.doesNotMatch(html,/forms.gle|docs.google.com\/forms/);
});
test('general eztravel validity does not extend the September member-day codes',()=>{
  const now=new Date('2026-10-15T12:00:00+08:00'),ez=data.benefits.find(b=>b.id==='eztravel-hsr-group');
  assert.equal(ez.expiresAt,'2026-10-31');assert.equal(filterWelfare(data,'旅遊','易遊網',now).count,2);
  assert.equal(benefitState(ez,new Date('2026-10-31T23:59:59+08:00')).archive,false);
  assert.equal(benefitState(ez,new Date('2026-11-01T00:00:00+08:00')).archive,true);
  assert.equal(data.posts.find(p=>p.id==='new-member-offer-2026').date,'2026-09-06');
});
test('October member-day coupons archive at Taipei midnight, not the travel or general benefit deadline',()=>{
  const id='eztravel-member-day-20261015',benefit=data.benefits.find(b=>b.id===id);
  const last=new Date('2026-10-15T23:59:59.999+08:00'),cutoff=new Date('2026-10-16T00:00:00+08:00');
  assert.equal(benefit.expiresAt,'2026-10-15');
  assert.match(renderBenefit(data,id,last),/2026\/10\/15–12\/31/);
  assert.equal(benefitState(benefit,last).archive,false);
  assert.match(filterWelfare(data,'旅遊','易遊網',last).html,new RegExp(id));
  assert.match(renderHome(data,last),new RegExp(id));
  assert.equal(benefitState(benefit,cutoff).archive,true);
  assert.doesNotMatch(filterWelfare(data,'旅遊','易遊網',cutoff).html,new RegExp(id));
  assert.doesNotMatch(renderHome(data,cutoff),new RegExp(id));
  assert.match(renderArchive(data,new URLSearchParams('kind=benefit'),cutoff),new RegExp(id));
  assert.equal(benefitState(data.benefits.find(b=>b.id==='eztravel-hsr-group'),cutoff).archive,false);
});
test('earlier sources merge into one film story and the current rest-rights progression',()=>{
  assert.equal(data.posts.filter(p=>p.id==='teachers-day-film-response-2026').length,1);
  const film=renderPost(data,'teachers-day-film-response-2026');assert.match(film,/工會新聞稿・立場/);assert.match(film,/BeHds_xK0to/);
  const rest=renderPost(data,'rest-rights-notice');assert.match(rest,/9月29日轉知各校/);assert.match(rest,/9月10日/);
  assert.ok(data.posts.some(p=>p.id==='offline-rights-draft'));
});
test('October 19 updates keep the completed movie and preschool advocacy clearly attributed',()=>{
  const recap=data.posts.find(p=>p.id==='digger-film-workshop-recap');
  const preschool=data.posts.find(p=>p.id==='early-childhood-working-conditions-2026');
  assert.ok(data.site.updatedAt>='2026-10-19');
  assert.equal(recap.relatedEvent,'movie-2026');
  assert.match(renderPost(data,recap.id),/活動成果・已完成/);
  assert.match(renderPost(data,recap.id),/18WhjhbaF7/);
  assert.equal(movie.updatedAt,'2026-10-19');
  assert.equal(movie.history.at(-1).date,'2026-10-19');
  assert.match(renderEvent(data,movie.id,new Date('2026-10-19T12:00:00+08:00')),/活動已完成/);
  assert.match(renderPost(data,preschool.id),/全教產新聞稿・工會主張/);
  assert.match(renderPost(data,preschool.id),/以教育部及主管機關正式公告為準/);
  assert.match(renderPost(data,preschool.id),/1M1etG5rKg/);
});
test('youth safety article protects identities and distinguishes source claims from final findings',()=>{
  const id='zhongli-youth-safety-network-2026',html=renderPost(data,id);
  assert.match(html,/事件追蹤・工會倡議/);
  assert.match(html,/來源貼文所述進度/);
  assert.match(html,/以主管機關與司法正式資訊為準/);
  assert.match(html,/19bLRwAKGT/);
  assert.doesNotMatch(html,/受害者學校校名|5位媽媽|1位大伯/);
});
test('history includes the ended hike but no future movie',()=>{
  const now=new Date('2026-10-15T04:00:00Z'),html=renderArchive(data,new URLSearchParams('kind=event'),now);
  assert.match(html,/陽光親子928健行/);assert.doesNotMatch(html,/挖掘者/);
  const future=renderHome(data,new Date('2026-10-19T00:00:00Z'));assert.doesNotMatch(future,/活動將至/);
});
test('more navigation preserves document and history entry points',()=>{
  const html=renderMore();
  assert.match(html,/href="#\/documents"/);assert.match(html,/href="#\/archive"/);assert.match(html,/href="#\/about"/);
});
test('built homepage contains all three reading sections before JavaScript runs',()=>{
  const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  assert.match(html,/aria-labelledby="welfare-title"/);assert.match(html,/aria-labelledby="events-title"/);assert.match(html,/aria-labelledby="news-title"/);
  assert.doesNotMatch(html,/\{\{UPDATED_/);
});
test('benefit filters and Unicode search behave together',()=>{
  assert.equal(filterWelfare(data,'餐飲','',new Date('2026-10-15')).count,2);
  assert.equal(filterWelfare(data,'交通','高鐵',new Date('2026-10-15')).count,1);
  assert.equal(filterWelfare(data,'餐飲','不存在',new Date('2026-10-15')).count,0);
  assert.equal(textMatch({title:'Colorbowl'},'ＣＯＬＯＲ'),true);
});
test('source text and URLs cannot inject markup or executable links',()=>{
  assert.equal(safeUrl('javascript:alert(1)'),'');assert.equal(safeUrl('data:text/html,test'),'');
  assert.equal(escapeHtml('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');
  const evil=structuredClone(data);evil.posts[0].sections[0].text='<script>alert(1)</script>';
  const rendered=renderPost(evil,evil.posts[0].id);assert.doesNotMatch(rendered,/<script>/);assert.match(rendered,/&lt;script&gt;/);
  assert.equal(archivedPost({archiveAfter:'2026-09-28'},new Date('2026-10-15')),true);
});
test('content relationships and immutable public PDFs are valid',()=>{assert.equal(validateContent(data,attachments),true);checkFiles();});
test('duplicate IDs, unsafe sources and incomplete records fail validation',()=>{
  const bad=structuredClone(data);bad.benefits[1].id=bad.benefits[0].id;assert.throws(()=>validateContent(bad,attachments),/duplicate/);
  const unsafe=structuredClone(data);unsafe.posts[0].sources[0].url='javascript:alert(1)';assert.throws(()=>validateContent(unsafe,attachments),/Unsafe/);
  const incomplete=structuredClone(data);delete incomplete.benefits[0].conditions;assert.throws(()=>validateContent(incomplete,attachments),/Benefit fields/);
  const invalidDate=structuredClone(data);invalidDate.posts[0].date='2026-02-31';assert.throws(()=>validateContent(invalidDate,attachments),/date/);
  const claim=structuredClone(data);claim.benefits.find(b=>b.id==='hsr-cashback').claimPeriods[0].applicationThrough='2026-02-31';assert.throws(()=>validateContent(claim,attachments),/claim/);
  const form=structuredClone(data);form.benefits.find(b=>b.id==='hsr-cashback').claimPeriods[0].applicationUrl='javascript:alert(1)';assert.throws(()=>validateContent(form,attachments),/Unsafe claim/);
});
