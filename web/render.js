import {escapeHtml as e,displayDate,eventState,benefitState,claimState,archivedPost,textMatch,safeUrl} from './logic.js';
export {escapeHtml} from './logic.js';
const paths = {
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  home:'<path d="m3 10 9-8 9 8v11h-7v-7h-4v7H3z"/>',
  gift:'<path d="M3 8h18v5H3zM5 13v9h14v-9M12 8v14"/><path d="M12 8C3 10 4 0 9 3c2 1 3 5 3 5Zm0 0c9 2 8-8 3-5-2 1-3 5-3 5Z"/>',
  calendar:'<rect x="4" y="5" width="16" height="17" rx="2"/><path d="M8 2v6m8-6v6M4 10h16"/>',
  file:'<path d="M5 2h10l4 4v16H5zM15 2v5h4M8 11h8m-8 4h8m-8 4h6"/>',
  back:'<path d="M20 12H4m6-6-6 6 6 6"/>',
  copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 4V3H3v13h1"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  external:'<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
  close:'<path d="m5 5 14 14M19 5 5 19"/>'
};
export const icon = (name,cls='') => `<svg class="icon ${cls}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.file}</svg>`;
export const arrow = ()=>icon('arrow');
const shortBenefitTitle = b=>({'take-a-smile':'薇微一酵 延平總店','colorbowl':'彩碗 Colorbowl'}[b.id]||b.title);
const shortNewsTitle = p=>p.id==='dismissal-rules-update'?'解聘與考核辦法修正':p.title;
export function renderHome(data,now=new Date()) {
  const p=data.posts.find(p=>p.id===data.site.featuredPost)||data.posts[0];
  const event=data.events.filter(ev=>!eventState(ev,now).archive).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const benefits=data.benefits.filter(b=>!benefitState(b,now).archive).slice(0,2);
  const headline=p.id==='offline-rights-draft'?'教師離線權：<br>先看四個重點':e(p.title);
  const eventLabel=event?eventState(event,now).label:'';
  return `<div class="home"><article class="lead home-lead" data-tone="news"><h1 class="sr-only">近期重點與會員資訊</h1><h2>${headline}</h2><p class="lead-meta">${displayDate(p.date).slice(5)} ${e(p.statusLabel)}</p><p class="lead-summary">${e(p.summary)}</p><p class="lead-relevance">${e(p.relevance)}</p><a class="button" href="#/read/${e(p.id)}">閱讀重點 ${icon('chevron')}</a></article>
  <section class="home-section home-welfare" data-tone="welfare" aria-labelledby="welfare-title"><div class="section-heading"><h2 id="welfare-title"><a href="#/welfare">福利優惠</a></h2></div><div class="benefit-preview">${benefits.map(b=>`<a class="benefit-preview-row" href="#/benefit/${e(b.id)}" aria-label="${e(b.title)}：${e(b.highlight)}"><h3>${b.id==='take-a-smile'?'<span class="merchant-part">薇微一酵</span> <span class="merchant-part">延平總店</span>':e(shortBenefitTitle(b))}</h3><div><p class="offer">${e(b.highlight)}</p><p class="validity">${e(benefitState(b,now).label.replace('契約期限至 ','契約至'))}</p></div></a>`).join('')}</div></section>
  <section class="home-section home-events" data-tone="events" aria-labelledby="events-title"><div class="section-heading"><h2 id="events-title"><a href="#/events">活動</a></h2></div>${event?`<article class="home-activity"><div class="date-block"><strong>${displayDate(event.date).slice(5)}</strong><span>（${['日','一','二','三','四','五','六'][new Date(event.date+'T12:00:00+08:00').getUTCDay()]}）</span></div><div><h3><a href="#/event/${e(event.id)}">${e(event.title)}</a></h3><p class="state">${e(eventLabel.startsWith('報名截止')?'報名已截止':eventLabel)}</p><div class="activity-actions"><a href="#/event/${e(event.id)}">查看活動 ${icon('chevron')}</a><a href="#/pdf/${e(event.id)}">原檔 PDF ${icon('chevron')}</a></div></div></article>`:'<p class="home-empty">目前沒有待參加的活動。<a href="#/archive?kind=event">查看歷史活動</a></p>'}</section></div>`;
}
const link = (url,label) => safeUrl(url)?`<a href="${e(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${e(label)} ${icon('external')}</a>`:'';
export const sources = list => list?.length?`<section class="sources"><h2>原始來源</h2><ul>${list.map(s=>`<li>${link(s.url,s.label)}</li>`).join('')}</ul><p class="fine">連結開啟外部網站；資料以來源最新公告為準。</p></section>`:'';
export const footer = ()=>`<footer class="page-footer"><p>由福豐國中分會聯絡人整理</p><p>本站為會員資訊導讀，非工會官方網站。</p><div><a href="#/about">關於本站</a><a href="#/archive">歷史資訊</a><a href="#/news">新聞與權益</a></div></footer>`;
const copyButton = ()=>`<button type="button" class="text-button" data-copy>${icon('copy')} 複製連結</button>`;
const top = (back='#/',label='首頁')=>`<div class="page-tools"><a href="${back}" class="back-link">${icon('back')} ${e(label)}</a>${copyButton()}</div>`;
const heading = (title,description='')=>`<header class="page-heading"><h1>${e(title)}</h1>${description?`<p>${e(description)}</p>`:''}</header>`;
const empty = (title='沒有符合的資訊',body='試試其他關鍵字，或清除搜尋條件。')=>`<div class="empty-state"><h2>${e(title)}</h2><p>${e(body)}</p></div>`;
const dateLine = (date,label='來源公告')=>`<p class="metadata">${label} <time datetime="${e(date)}">${displayDate(date)}</time></p>`;
const postRow = p=>`<article class="list-row" data-tone="${p.type==='document'?'neutral':'news'}"><div><h2><a href="#/read/${e(p.id)}">${e(p.title)}</a></h2>${dateLine(p.date)}<p>${e(p.summary)}</p><p class="state">${e(p.statusLabel)}</p></div><a class="row-arrow" href="#/read/${e(p.id)}" aria-label="閱讀：${e(p.title)}">${icon('chevron')}</a></article>`;
export function homeMore(data,now=new Date()) {
  const list=data.posts.filter(p=>p.id!==data.site.featuredPost&&p.type!=='document'&&!archivedPost(p,now)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,1);
  return `<section class="home-section home-news" data-tone="news" aria-labelledby="news-title"><div class="section-heading"><h2 id="news-title"><a href="#/news">新聞</a></h2></div>${list.map(p=>`<a class="home-news-row" href="#/read/${e(p.id)}"><div><h3>${e(shortNewsTitle(p))}</h3><p>${displayDate(p.date).slice(5)} ｜ ${e(p.statusLabel)}</p></div>${icon('chevron')}</a>`).join('')}</section>${footer()}`;
}
const sections = list => (list||[]).map(s=>`<section class="article-section"><h2>${e(s.heading)}</h2><p>${e(s.text)}</p></section>`).join('');
export function renderPost(data,id) {
  const p=data.posts.find(p=>p.id===id); if(!p)return renderNotFound();
  return `<article class="page article">${top(p.type==='document'?'#/documents':'#/news',p.type==='document'?'公文整理':'新聞與權益')}${heading(p.title)}${dateLine(p.date)}<p class="state">${e(p.statusLabel)}</p><p class="article-intro">${e(p.summary)}</p>${p.documentNumber?`<dl class="facts"><div><dt>發文字號</dt><dd>${e(p.documentNumber)}</dd></div></dl>`:''}<section class="relevance"><h2>與我有關</h2><p>${e(p.relevance)}</p><h2>需要做什麼</h2><p>${e(p.action)}</p></section>${sections(p.sections)}${p.relatedEvent?`<a class="button secondary" href="#/event/${e(p.relatedEvent)}">活動資料與原檔 PDF ${arrow()}</a>`:''}${sources(p.sources)}${footer()}</article>`;
}
export function renderNews(data,{documents=false,now=new Date()}={}) {
  const list=data.posts.filter(p=>documents?p.type==='document':p.type!=='document'&&!archivedPost(p,now)).sort((a,b)=>b.date.localeCompare(a.date));
  return `<div class="page">${top()}${heading(documents?'公文整理':'新聞與權益',documents?'查詢公文重點、文號與相關活動。':'把長訊息整理成重點、與自己的關係，以及下一步。')}<div class="info-list">${list.map(postRow).join('')||empty()}</div><p class="page-end-link"><a href="#/archive">查看歷史資訊 ${arrow()}</a></p>${footer()}</div>`;
}
function welfareRows(data,category,query,now) {
  const list=data.benefits.filter(b=>!benefitState(b,now).archive&&(category==='全部'||b.category===category)&&textMatch(b,query));
  return {count:list.length,html:list.length?list.map(b=>`<article class="list-row benefit-row" data-tone="welfare"><div><h2><a href="#/benefit/${e(b.id)}">${e(b.title)}</a></h2><p class="benefit-highlight">${e(b.highlight)}</p><p>${e(b.summary)}</p><div class="row-meta"><span>${e(b.category)}</span><span class="state">${benefitState(b,now).label}</span><span>公告 ${displayDate(b.date)}</span></div></div><a class="row-arrow" href="#/benefit/${e(b.id)}" aria-label="查看優惠：${e(b.title)}">${icon('chevron')}</a></article>`).join(''):empty()};
}
export const filterWelfare = (data,category,query,now=new Date())=>welfareRows(data,category,query,now);
export function renderWelfare(data,params=new URLSearchParams(),now=new Date()) {
  const q=params.get('q')||'',category=params.get('category')||'全部';
  const categories=['全部',...new Set(data.benefits.map(b=>b.category))];
  const result=welfareRows(data,category,q,now);
  return `<div class="page">${top()}${heading('會員福利','會員卡怎麼用、優惠有哪些，在這裡查。')}<p class="notice">消費或申請前，請留意各項福利的適用資格、使用方式及期限。</p><form id="welfare-search" class="local-search" role="search"><label for="local-search">搜尋福利</label><div><input id="local-search" type="search" value="${e(q)}" placeholder="店家、折扣或關鍵字" maxlength="120"><button type="submit" class="button">搜尋</button></div></form><nav class="filters" aria-label="福利分類">${categories.map(c=>`<a href="#/welfare?category=${encodeURIComponent(c)}&q=${encodeURIComponent(q)}" data-category="${e(c)}" ${c===category?'aria-current="true"':''}>${e(c)}</a>`).join('')}</nav><p id="result-count" class="result-count" role="status">${result.count} 筆福利</p><div id="filter-results" class="info-list">${result.html}</div><section class="official-directory"><h2>更多工會福利</h2><p>會員卡正反面分別為桃教產與全教產，可查詢兩個工會的特約資訊。</p>${data.site.officialWelfare.map(s=>link(s.url,s.label)).join('')}</section>${footer()}</div>`;
}
function renderClaimPeriods(benefit,now) {
  if(!benefit.claimPeriods?.length)return '';
  return '<section class="article-section"><h2>搭乘與申請期間</h2>'+benefit.claimPeriods.map(p=>{
    const state=claimState(p,now);
    const exact=p.applicationOpen?'（'+p.applicationOpen.slice(11,16)+'起，截止日'+p.applicationClose.slice(11,16)+'止）':'';
    return `<div class="step"><h3>${e(p.label)}</h3><p class="state">${state.label}</p><dl class="facts"><div><dt>搭乘期間</dt><dd>${displayDate(p.rideFrom)}–${displayDate(p.rideThrough)}</dd></div><div><dt>申請期間</dt><dd>${displayDate(p.applicationFrom)}–${displayDate(p.applicationThrough)}${e(exact)}</dd></div></dl></div>`;
  }).join('')+'</section>';
}
export function renderBenefit(data,id,now=new Date()) {
  const b=data.benefits.find(b=>b.id===id);if(!b)return renderNotFound();
  const application=b.claimPeriods?.find(p=>claimState(p,now).open&&safeUrl(p.applicationUrl));
  return `<article class="page article">${top('#/welfare','會員福利')}${heading(b.title)}${dateLine(b.date)}<p class="state">${benefitState(b,now).label}</p><p class="offer-line">${e(b.highlight)}</p><p class="article-intro">${e(b.summary)}</p>${application?`<div class="action-group"><a class="button" href="${e(safeUrl(application.applicationUrl))}" target="_blank" rel="noopener noreferrer">前往當期申請表 ${icon('external')}</a></div>`:''}<dl class="facts"><div><dt>優惠類別</dt><dd>${e(b.category)}</dd></div><div><dt>適用對象</dt><dd>${e(b.eligibility)}</dd></div><div><dt>怎麼使用</dt><dd>${e(b.how)}</dd></div></dl><section class="article-section"><h2>使用前請留意</h2><ul>${b.conditions.map(c=>`<li>${e(c)}</li>`).join('')}</ul></section>${renderClaimPeriods(b,now)}${sections(b.sections)}${sources(b.sources)}${footer()}</article>`;
}
const eventRow = (event,now)=>`<article class="list-row event-row" data-tone="events"><div class="event-date"><span>${e(event.date.slice(5,7))}月</span><strong>${e(event.date.slice(8))}</strong></div><div><h2><a href="#/event/${e(event.id)}">${e(event.title)}</a></h2><p class="state">${eventState(event,now).label}</p><p>${e(event.location)}</p><p class="muted">${e(event.summary)}</p><a class="inline-action" href="#/pdf/${e(event.id)}">閱讀原檔 PDF ${icon('file')}</a></div></article>`;
export function renderEvents(data,now=new Date()) {
  const list=data.events.filter(e=>!eventState(e,now).archive).sort((a,b)=>a.date.localeCompare(b.date));
  return `<div class="page">${top()}${heading('活動資訊','先確認狀態與資格，再查看完整活動計畫。')}<div class="info-list">${list.map(e=>eventRow(e,now)).join('')||empty('目前沒有待參加的活動','新活動整理後會出現在這裡，已結束的活動可到歷史區查詢。')}</div><p class="page-end-link"><a href="#/archive?kind=event">歷史活動與原檔 ${arrow()}</a></p>${footer()}</div>`;
}
export function renderEvent(data,id,now=new Date()) {
  const ev=data.events.find(e=>e.id===id);if(!ev)return renderNotFound();const state=eventState(ev,now);
  return `<article class="page article">${top(state.archive?'#/archive?kind=event':'#/events',state.archive?'歷史活動':'活動資訊')}${heading(ev.title)}<p class="state">${state.label}</p><p class="article-intro">${e(ev.summary)}</p><dl class="facts"><div><dt>活動日期</dt><dd>${displayDate(ev.date)}</dd></div><div><dt>時間</dt><dd>${e(ev.timeLabel)}</dd></div><div><dt>地點</dt><dd>${e(ev.location)}<br><span class="muted">${e(ev.address)}</span></dd></div><div><dt>參加對象</dt><dd>${e(ev.eligibility)}</dd></div><div><dt>費用</dt><dd>${e(ev.fee)}</dd></div><div><dt>原報名期間</dt><dd>${displayDate(ev.registrationOpen.slice(0,10))} ${ev.registrationOpen.slice(11,16)} 至<br>${displayDate(ev.registrationClose.slice(0,10))} ${ev.registrationClose.slice(11,16)}</dd></div></dl>${ev.notice?`<p class="notice">${e(ev.notice)}</p>`:''}<div class="action-group"><a class="button" href="#/pdf/${e(ev.id)}">閱讀原檔 PDF ${icon('file')}</a>${state.canRegister&&safeUrl(ev.registrationUrl)?`<a class="button secondary" href="${e(safeUrl(ev.registrationUrl))}" target="_blank" rel="noopener noreferrer">前往報名 ${icon('external')}</a>`:''}</div><section class="article-section"><h2>${state.archive?'活動紀錄':'參加前要知道'}</h2>${ev.steps.map(s=>`<div class="step"><h3>${e(s.title)}</h3><p>${e(s.text)}</p>${s.deadline?`<p class="deadline">${now>=new Date(s.deadline)?'此期限已過':'期限'}：${displayDate(s.deadline.slice(0,10))} ${s.deadline.slice(11,16)}</p>`:''}</div>`).join('')}</section><section class="article-section"><h2>資訊更新紀錄</h2><ul>${ev.history.map(h=>`<li><time>${displayDate(h.date)}</time> ${e(h.text)}</li>`).join('')}</ul></section>${dateLine(ev.updatedAt,'來源更新')}${sources(ev.sources)}${footer()}</article>`;
}
export function renderPdf(data,id) {
  const ev=data.events.find(e=>e.id===id);if(!ev)return renderNotFound();
  return `<div class="page pdf-page">${top('#/event/'+e(ev.id),'活動資訊')}${heading(ev.pdfTitle,'原始 PDF 逐頁呈現，可上下滑動閱讀。')}<div class="pdf-toolbar"><div class="zoom-controls"><button type="button" class="text-button" data-zoom="out" disabled aria-label="縮小文件">−</button><output id="zoom-label">適合寬度</output><button type="button" class="text-button" data-zoom="in" disabled aria-label="放大文件">＋</button><button type="button" class="text-button" data-zoom="fit" disabled>適合寬度</button></div><a class="text-button" href="files/${e(ev.pdf)}" download>${icon('download')} 下載原檔</a></div><p class="fine">需要瀏覽器原生閱讀器？<a href="files/${e(ev.pdf)}" target="_blank" rel="noopener">另開原始 PDF</a>。</p><p id="pdf-status" class="pdf-status" role="status">正在載入文件…</p><div id="pdf-pages" class="pdf-pages" aria-label="活動計畫逐頁預覽" aria-busy="true"></div><div id="pdf-error" class="notice" hidden><p>文件預覽暫時無法載入。你可以重新載入，或直接下載原檔閱讀。</p><button type="button" class="button secondary" data-retry-pdf>重試預覽</button></div>${footer()}</div>`;
}
export function renderArchive(data,params=new URLSearchParams(),now=new Date()) {
  const kind=params.get('kind')||'all';
  const events=data.events.filter(e=>eventState(e,now).archive);
  const posts=data.posts.filter(p=>archivedPost(p,now));
  const benefits=data.benefits.filter(b=>benefitState(b,now).archive);
  let html='';if(kind==='all'||kind==='event')html+=events.map(e=>eventRow(e,now)).join('');
  if(kind==='all'||kind==='post')html+=posts.sort((a,b)=>b.date.localeCompare(a.date)).map(postRow).join('');
  if(kind==='all'||kind==='benefit')html+=benefits.map(b=>`<article class="list-row" data-tone="welfare"><div><h2><a href="#/benefit/${e(b.id)}">${e(b.title)}</a></h2><p>${e(b.highlight)}</p><p class="kind-label">福利優惠</p><p class="state">${e(benefitState(b,now).label)}</p></div></article>`).join('');
  return `<div class="page">${top()}${heading('歷史資訊','已結束的活動與有明確時效的過往公告，仍可回來查。')}<nav class="filters" aria-label="歷史資訊分類">${[['all','全部'],['event','活動'],['post','公告'],['benefit','優惠']].map(([k,n])=>`<a href="#/archive?kind=${k}" ${kind===k?'aria-current="true"':''}>${n}</a>`).join('')}</nav><div class="info-list">${html||empty('這個分類目前沒有歷史資料','可以切換其他分類，或查看最新資訊。')}</div>${footer()}</div>`;
}
export function renderSearch(data,params=new URLSearchParams(),now=new Date()) {
  const q=(params.get('q')||'').trim();
  const groups=[['訊息與公文',data.posts,'read'],['福利優惠',data.benefits,'benefit'],['活動資訊',data.events,'event']].map(([name,list,route])=>({name,route,list:q?list.filter(item=>textMatch(item,q)):[]}));
  const count=groups.reduce((n,g)=>n+g.list.length,0);
  return `<div class="page">${top()}${heading('搜尋結果',q?`「${q}」找到 ${count} 筆資訊（含歷史資料）`:'請在上方輸入店家、活動或關鍵字。')}${!q?empty('想找什麼？','例如：會員卡、電影、離線權、高鐵。'):!count?empty():groups.filter(g=>g.list.length).map(g=>`<section class="search-group" data-tone="${g.route==='benefit'?'welfare':g.route==='event'?'events':'news'}"><h2>${g.name}</h2>${g.list.map(item=>`<article class="list-row"><div><h3><a href="#/${g.route}/${e(item.id)}">${e(item.title)}</a></h3><p>${e(item.summary)}</p><p class="state">${g.route==='event'?eventState(item,now).label:g.route==='benefit'?benefitState(item,now).label:e(item.statusLabel)}</p>${dateLine(item.date)}</div><a class="row-arrow" href="#/${g.route}/${e(item.id)}" aria-label="查看：${e(item.title)}">${icon('chevron')}</a></article>`).join('')}</section>`).join('')}${footer()}</div>`;
}
export function renderAbout(data) {
  return `<article class="page article">${top()}${heading('關於本站')}<p class="article-intro">這是提供福豐國中分會會員快速閱讀、查詢資訊的整理站，由分會聯絡人維護，並非工會官方網站。</p><section class="article-section"><h2>資訊從哪裡來</h2><p>依聯絡人收到的工會訊息、公文及活動文件整理。每則保留來源日期與原始連結；同一活動的提醒合併更新，避免重複洗版。</p></section><section class="article-section"><h2>如何看資訊狀態</h2><ul><li>參考草案：供各校研議，不代表各校已實施。</li><li>契約期限：特約合作截止日；個別方案仍依其適用條件辦理。</li><li>報名截止：活動可能還沒開始，但不代表仍可報名。</li><li>歷史資訊：已結束活動及有明確時效的過往公告，保留查詢。</li></ul></section><section class="article-section"><h2>PDF 與公文</h2><p>活動計畫以原始 PDF 提供逐頁預覽及下載；公文整理為網頁摘要，不公開具名受文者、收文條碼等個別資料。</p></section><section class="article-section"><h2>更正與聯絡</h2><p>若發現資訊需補充或更正，請透過既有的分會聯絡管道通知聯絡人。本站不另行公開私人電話或收集會員名單。</p><p>瀏覽、搜尋與分類在裝置上進行，本站沒有登入、追蹤分析或會員資料庫；外部來源網站依各自政策提供服務。</p></section>${dateLine(data.site.updatedAt,'本站內容整理日期')}${sources([{label:'桃園市教育產業工會',url:'https://www.teu.org.tw/'}])}${footer()}</article>`;
}
export const renderNotFound = ()=>`<div class="page">${top()}${heading('找不到這則資訊','連結可能不完整，或內容已調整。')}<a class="button" href="#/">回首頁 ${arrow()}</a>${footer()}</div>`;


export function renderMore() {
  const entries=[['公文整理','查詢公文重點、文號與相關活動。','documents','file'],['歷史資訊','找回已結束的活動、公告與優惠。','archive','calendar'],['關於本站','資訊來源、網站說明與更正方式。','about','file']];
  return `<div class="page more-page">${top()}${heading('更多資訊','公文、歷史紀錄與網站說明。')}<nav class="more-links" aria-label="其他資訊">${entries.map(([title,description,route,glyph])=>`<a href="#/${route}"><div><h2>${e(title)}</h2><p>${e(description)}</p></div>${icon('chevron')}</a>`).join('')}</nav>${footer()}</div>`;
}
