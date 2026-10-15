import data from './data.js';
import {taipeiDate,eventState,benefitState} from './logic.js';
import {renderHome,homeMore,renderPost,renderNews,renderWelfare,renderBenefit,renderEvents,renderEvent,renderPdf,renderArchive,renderSearch,renderAbout,renderNotFound,filterWelfare,renderMore} from './render.js';
const main = document.getElementById('main');
const menuButton=document.getElementById('menu-toggle'),menu=document.getElementById('site-menu'),search=document.getElementById('search');
document.querySelector('.skip-link').addEventListener('click',ev=>{ev.preventDefault();main.focus({preventScroll:true});main.scrollIntoView({block:'start',behavior:'instant'});});
let pdfCleanup=()=>{},toastTimer,resizeTimer,routeKey='';
function closeMenu(){menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','開啟導覽選單');}
menuButton.addEventListener('click',()=>{menu.hidden=!menu.hidden;menuButton.setAttribute('aria-expanded',String(!menu.hidden));menuButton.setAttribute('aria-label',menu.hidden?'開啟導覽選單':'關閉導覽選單');});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!menu.hidden){closeMenu();menuButton.focus();}});
document.getElementById('global-search').addEventListener('submit',ev=>{ev.preventDefault();location.hash='/search?q='+encodeURIComponent(search.value.trim());});
function currentRoute(){const hash=location.hash.startsWith('#/')?location.hash.slice(1):'/';const [pathname,query='']=hash.split('?');let pieces;try{pieces=pathname.split('/').filter(Boolean).map(decodeURIComponent);}catch{return {type:'not-found',id:'',params:new URLSearchParams()};}return {type:pieces[0]||'home',id:pieces[1]||'',params:new URLSearchParams(query)};}
function toast(message){clearTimeout(toastTimer);const el=document.getElementById('toast');el.textContent=message;el.classList.add('visible');toastTimer=setTimeout(()=>el.classList.remove('visible'),4000);}
async function copyLink(){try{await navigator.clipboard.writeText(location.href);toast('已複製，可貼到 LINE 分享。');}catch{const el=document.createElement('textarea');el.value=location.href;el.className='copy-fallback';document.body.append(el);el.select();const ok=document.execCommand('copy');el.remove();toast(ok?'已複製連結。':'請從瀏覽器網址列複製連結。');}}
document.addEventListener('click',ev=>{
  const copy=ev.target.closest('[data-copy]');if(copy){copyLink();return;}
  const category=ev.target.closest('[data-category]');if(category){ev.preventDefault();const q=document.getElementById('local-search')?.value.trim()||'';location.hash='/welfare?category='+encodeURIComponent(category.dataset.category)+'&q='+encodeURIComponent(q);return;}
  if(ev.target.closest('#site-menu a'))closeMenu();
});
document.addEventListener('input',ev=>{if(ev.target.id==='local-search'){const route=currentRoute();const r=filterWelfare(data,route.params.get('category')||'全部',ev.target.value);document.getElementById('filter-results').innerHTML=r.html;document.getElementById('result-count').textContent=r.count+' 筆福利';}});
document.addEventListener('submit',ev=>{if(ev.target.id==='welfare-search'){ev.preventDefault();const r=currentRoute();location.hash='/welfare?category='+encodeURIComponent(r.params.get('category')||'全部')+'&q='+encodeURIComponent(document.getElementById('local-search').value.trim());}});
function render(focus=false){
  pdfCleanup();pdfCleanup=()=>{};routeKey=location.hash;const r=currentRoute(),now=new Date();let html,title,nav='home';
  switch(r.type){
    case 'home':html=renderHome(data,now)+homeMore(data,now);title='重點首頁';break;
    case 'news':html=renderNews(data,{now});title='新聞與權益';nav='news';break;
    case 'read':html=renderPost(data,r.id);title=data.posts.find(p=>p.id===r.id)?.title||'找不到資訊';nav=data.posts.find(p=>p.id===r.id)?.type==='document'?'more':'news';break;
    case 'welfare':html=renderWelfare(data,r.params,now);title='會員福利';nav='welfare';break;
    case 'benefit':html=renderBenefit(data,r.id,now);title=data.benefits.find(b=>b.id===r.id)?.title||'找不到優惠';nav='welfare';break;
    case 'events':html=renderEvents(data,now);title='活動資訊';nav='events';break;
    case 'event':html=renderEvent(data,r.id,now);title=data.events.find(e=>e.id===r.id)?.title||'找不到活動';nav='events';break;
    case 'pdf':html=renderPdf(data,r.id);title='活動原檔 PDF';nav='events';break;
    case 'documents':html=renderNews(data,{documents:true,now});title='公文整理';nav='more';break;
    case 'archive':html=renderArchive(data,r.params,now);title='歷史資訊';nav='more';break;
    case 'search':html=renderSearch(data,r.params,now);title='搜尋結果';nav='';search.value=r.params.get('q')||'';break;
    case 'about':html=renderAbout(data);title='關於本站';nav='more';break;
    case 'more':html=renderMore();title='更多資訊';nav='more';break;
    default:html=renderNotFound();title='找不到資訊';
  }
  document.body.dataset.section=['welfare','events','news'].includes(nav)?nav:nav==='home'?'home':'neutral';
  const theme={welfare:'#176b57',events:'#a64f22',news:'#365ba4',home:'#365ba4'};
  document.querySelector('meta[name="theme-color"]').setAttribute('content',theme[nav]||'#24323b');
  main.innerHTML=html;document.title=title+'｜'+data.site.branch+' '+data.site.name;
  document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===nav)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  closeMenu();if(focus){window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});}
  if(r.type==='pdf'&&data.events.some(e=>e.id===r.id))loadPdf(data.events.find(e=>e.id===r.id));
}
window.addEventListener('hashchange',()=>render(true));
let timeSignature='';
function refreshDateState(){const now=new Date();const next=taipeiDate(now)+data.events.map(e=>eventState(e,now).label).join('|')+data.benefits.map(b=>benefitState(b,now).label).join('|');if(timeSignature&&next!==timeSignature&&currentRoute().type!=='pdf')render(false);timeSignature=next;}
refreshDateState();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshDateState();});
setInterval(refreshDateState,60000);
render();

async function loadPdf(event){
  const key=routeKey,container=document.getElementById('pdf-pages'),status=document.getElementById('pdf-status'),error=document.getElementById('pdf-error');
  let alive=true,loadingTask,doc,observer,scale=1,generation=0,rendering=new Map(),activeTasks=new Set();
  const controls=new AbortController();
  pdfCleanup=()=>{alive=false;controls.abort();observer?.disconnect();clearTimeout(resizeTimer);activeTasks.forEach(t=>t.cancel());loadingTask?.destroy().catch(()=>{});};
  const valid=()=>alive&&routeKey===key;
  const showError=message=>{if(!valid())return;status.textContent=message||'文件載入失敗';error.hidden=false;container.setAttribute('aria-busy','false');};
  main.addEventListener('click',ev=>{if(ev.target.closest('[data-retry-pdf]'))render(false);},{signal:controls.signal});
  try{
    const pdfjs=await import('./assets/vendor/pdfjs/pdf.min.mjs');if(!valid())return;
    pdfjs.GlobalWorkerOptions.workerSrc=new URL('./assets/vendor/pdfjs/pdf.worker.min.mjs',import.meta.url).href;
    loadingTask=pdfjs.getDocument({url:new URL('./files/'+event.pdf,import.meta.url).href,cMapUrl:new URL('./assets/vendor/pdfjs/cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('./assets/vendor/pdfjs/standard_fonts/',import.meta.url).href,wasmUrl:new URL('./assets/vendor/pdfjs/wasm/',import.meta.url).href,isEvalSupported:false});
    doc=await loadingTask.promise;if(!valid())return;
    const draw=box=>{
      if(!valid()||box.dataset.done==='true')return Promise.resolve();
      if(rendering.has(box))return rendering.get(box);
      const revision=generation;
      const drawing=(async()=>{
      try{
        const page=await doc.getPage(Number(box.dataset.page));if(!valid()||revision!==generation)return;
        const base=page.getViewport({scale:1}),width=Math.max(240,container.clientWidth-24),viewport=page.getViewport({scale:width/base.width*scale}),ratio=Math.min(devicePixelRatio||1,2);
        box.style.width=viewport.width+'px';box.style.height=viewport.height+'px';box.style.setProperty('--scale-factor',String(viewport.scale));box.style.setProperty('--total-scale-factor',String(viewport.scale));
        const canvas=document.createElement('canvas');canvas.setAttribute('aria-label',`第 ${box.dataset.page} 頁`);canvas.width=Math.floor(viewport.width*ratio);canvas.height=Math.floor(viewport.height*ratio);canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';box.replaceChildren(canvas);
        const task=page.render({canvasContext:canvas.getContext('2d'),viewport,transform:ratio===1?null:[ratio,0,0,ratio,0,0]});activeTasks.add(task);await task.promise;activeTasks.delete(task);if(!valid()||revision!==generation)return;
        const text=document.createElement('div');text.className='textLayer';box.append(text);await new pdfjs.TextLayer({textContentSource:page.streamTextContent(),container:text,viewport}).render();
        box.dataset.done='true';box.classList.add('rendered');
      }catch(err){if(valid()&&revision===generation&&err.name!=='RenderingCancelledException')showError('部分頁面無法預覽，仍可下載原檔閱讀。');}finally{rendering.delete(box);}
      })();
      rendering.set(box,drawing);
      return drawing;
    };
    const mount=async()=>{
      const revision=++generation;
      observer?.disconnect();activeTasks.forEach(t=>t.cancel());activeTasks.clear();rendering.clear();container.replaceChildren();
      for(let i=1;i<=doc.numPages;i++){const figure=document.createElement('figure');figure.className='pdf-figure';const box=document.createElement('div');box.className='pdf-sheet';box.dataset.page=String(i);box.style.height=Math.round(Math.max(240,container.clientWidth-24)*1.414*scale)+'px';box.setAttribute('role','group');box.setAttribute('aria-label',`第 ${i} 頁，共 ${doc.numPages} 頁`);const caption=document.createElement('figcaption');caption.textContent=`第 ${i} 頁 / 共 ${doc.numPages} 頁`;figure.append(box,caption);container.append(figure);}
      observer=new IntersectionObserver(entries=>entries.filter(e=>e.isIntersecting).forEach(e=>draw(e.target)),{rootMargin:'700px'});container.querySelectorAll('.pdf-sheet').forEach(el=>observer.observe(el));
      await draw(container.querySelector('.pdf-sheet'));if(valid()&&revision===generation){status.textContent=`共 ${doc.numPages} 頁，向下滑動閱讀`;container.setAttribute('aria-busy','false');}
    };
    const enableZoom=()=>{if(!valid())return;main.querySelectorAll('[data-zoom]').forEach(b=>{b.disabled=(b.dataset.zoom==='in'&&scale>=2)||(b.dataset.zoom==='out'&&scale<=.75);});};
    await mount();if(!valid())return;enableZoom();
    main.addEventListener('click',async ev=>{const button=ev.target.closest('[data-zoom]');if(!button)return;const next=button.dataset.zoom==='fit'?1:Math.max(.75,Math.min(2,scale+(button.dataset.zoom==='in'?.25:-.25)));if(next===scale)return;scale=next;document.getElementById('zoom-label').textContent=scale===1?'適合寬度':Math.round(scale*100)+'%';status.textContent='正在調整文件大小…';main.querySelectorAll('[data-zoom]').forEach(b=>b.disabled=true);await mount();enableZoom();},{signal:controls.signal});
    let width=container.clientWidth;window.addEventListener('resize',()=>{if(Math.abs(container.clientWidth-width)<2)return;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{width=container.clientWidth;if(valid())mount();},180);},{signal:controls.signal});
  }catch(err){if(valid())showError('文件預覽暫時無法載入');}
}

