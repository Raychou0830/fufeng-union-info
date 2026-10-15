export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const taipeiDate = (now=new Date()) => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export const displayDate = date => String(date || '').replaceAll('-','.');
export function eventState(event,now=new Date()) {
  const today = taipeiDate(now);
  if (event.date < today) return {label:'活動已結束',archive:true,canRegister:false};
  if (event.registrationClose && now >= new Date(event.registrationClose)) return {label:event.date===today?'今日活動・報名截止':'報名截止・活動將至',archive:false,canRegister:false};
  if (event.registrationOpen && now < new Date(event.registrationOpen)) return {label:'報名尚未開始',archive:false,canRegister:false};
  if (event.registrationOpen && event.registrationClose) return {label:'報名中',archive:false,canRegister:true};
  return {label:'報名資訊請見原公告',archive:false,canRegister:false};
}
export function benefitState(benefit,now=new Date()) {
  if (benefit.applicationsClosed===true) return {label:'申請已截止',archive:true};
  if (benefit.expiresAt && benefit.expiresAt < taipeiDate(now)) return {label:'優惠已到期',archive:true};
  if (benefit.claimPeriods?.length) {
    const periods=benefit.claimPeriods,today=taipeiDate(now);
    const open=periods.find(p=>claimState(p,now).open);
    if(open)return {label:open.label+'申請中'+(today===open.applicationThrough?'・今日'+(open.applicationClose?.slice(11,16)||'')+'截止':''),archive:false};
    const riding=periods.find(p=>p.rideFrom<=today&&today<=p.rideThrough);
    if(riding)return {label:riding.label+'搭乘累計中',archive:false};
    const next=periods.find(p=>today<p.applicationFrom);
    return {label:next?'下次申請 '+displayDate(next.applicationFrom):'本期申請已截止',archive:false};
  }
  if (benefit.verifiedAt && benefit.expiresAt) return {label:(benefit.validityLabel||'效期至 ')+displayDate(benefit.expiresAt),archive:false};
  return {label:'效期待確認',archive:false};
}
export function claimState(period,now=new Date()) {
  const today=taipeiDate(now);
  const started=period.applicationOpen?now>=new Date(period.applicationOpen):today>=period.applicationFrom;
  const ended=period.applicationClose?now>new Date(period.applicationClose):today>period.applicationThrough;
  return {open:started&&!ended,label:ended?'申請已截止':started?'申請期間':'尚未開放申請'};
}
export const archivedPost = (post,now=new Date()) => Boolean(post.archiveAfter && post.archiveAfter < taipeiDate(now));
export const textMatch = (item,query) => JSON.stringify(item).normalize('NFKC').toLocaleLowerCase().includes(query.trim().normalize('NFKC').toLocaleLowerCase());
export function safeUrl(value) { try { const u = new URL(value); return ['https:','http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } }
