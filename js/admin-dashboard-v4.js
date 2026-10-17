/**
 * Mộ Trạch Heritage · Dashboard V4
 * Additive page only; uses existing admin RPCs (SQL 001 and 004).
 * Do not merge website visits with QR opens into a purported unique visitor metric.
 */
import { supabase } from './supabase-client.js';
import { downloadOverviewWorkbook } from './dashboard-v4-xlsx.js';

const $ = id => document.getElementById(id);
const nf = new Intl.NumberFormat('vi-VN');
let isLoading = false;
let snapshot = null;
const PAGE_LABELS = {
  '/index.html':'Trang chủ', '/pages/heritage.html':'Danh sách di tích',
  '/pages/map.html':'Bản đồ', '/pages/map-tour.html':'Tuyến tham quan',
  '/pages/bai-viet.html':'Tin tức', '/pages/gioi-thieu.html':'Giới thiệu',
  '/pages/hoi-dap.html':'Hỏi đáp', '/pages/tim-kiem.html':'Tìm kiếm',
  '/pages/donate.html':'Ủng hộ', '/pages/lien-he.html':'Liên hệ'
};
function localToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone:'Asia/Ho_Chi_Minh', year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(part=>[part.type,part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}
function addDays(iso, days) {
  const ms = Date.parse(iso+'T00:00:00Z')+days*86400000;
  return new Date(ms).toISOString().slice(0,10);
}
function status(msg,kind='') {
  const el=$('v4Status');el.className='v4-status'+(kind?' '+kind:'');el.textContent=msg;
}
function show(id, value) {$(id).textContent=nf.format(Number(value)||0);}
function element(tag,content,css) {
  const e=document.createElement(tag);if(css)e.className=css;
  if(content !== undefined)e.textContent=String(content);
  return e;
}
function renderBars(series) {
  const holder=$('v4Chart');holder.replaceChildren();
  const max=Math.max(1,...series.flatMap(d=>[d.web,d.qr]));
  for (const day of series) {
    const col=element('div',undefined,'v4-day');
    const pair=element('div',undefined,'v4-pair');
    pair.tabIndex=0;
    pair.title=`Ngày ${day.day}: ${day.web} phiên website; ${day.qr} lượt mở QR`;
    pair.setAttribute('aria-label',pair.title);
    for (const [key,label] of [['web','web'],['qr','qr']]) {
      const bar=element('span',undefined,'v4-bar '+label);
      bar.style.height=`${Math.max(3,Math.round(155*day[key]/max))}px`;
      pair.append(bar);
    }
    col.append(pair,element('span',day.day.slice(0,5),'v4-date'));
    holder.append(col);
  }
}
function renderSites(rows) {
  const holder=$('v4SiteRanking');holder.replaceChildren();
  const data=new Map();
  for(const row of rows) {
    const key=String(row.site_slug||'');
    if(!key)continue;
    const item=data.get(key)||{slug:key,title:String(row.title_vi||key),opens:0};
    item.opens+=Number(row.opens)||0;data.set(key,item);
  }
  const sites=[...data.values()].sort((a,b)=>b.opens-a.opens||a.title.localeCompare(b.title,'vi'));
  const max=Math.max(1,...sites.map(s=>s.opens));
  if(!sites.length){holder.append(element('p','Chưa có dữ liệu QR.'));return;}
  for(const site of sites){
    const wrap=element('div',undefined,'v4-rank');
    const heading=element('div',undefined,'v4-rank-label');
    heading.append(element('span',site.title),element('strong',nf.format(site.opens)));
    const track=element('div',undefined,'v4-track');
    const progress=document.createElement('span');
    progress.style.width=(site.opens*100/max)+'%';track.append(progress);
    wrap.append(heading,track);holder.append(wrap);
  }
}
function renderPages(rows) {
  const holder=$('v4TopPages');holder.replaceChildren();
  if(!rows.length){holder.append(element('li','Chưa ghi nhận lượt xem trang.'));return;}
  for(const row of rows){
    const item=element('li');
    const name=String(row.path||'');
    const label=element('span',PAGE_LABELS[name]||name);
    label.title=name;
    item.append(label,element('strong',nf.format(Number(row.views)||0)));
    holder.append(item);
  }
}
async function refresh() {
  if(isLoading)return;
  isLoading=true;$('v4Reload').disabled=true;$('v4Export').disabled=true;
  status('Đang tải dữ liệu truy cập và QR từ Supabase...');
  try {
    const today=localToday();
    const from30=addDays(today,-29);
    const [w,q]=await Promise.all([
      supabase.rpc('get_admin_visit_summary'),
      supabase.rpc('get_qr_daily_report',{p_from:from30,p_to:today})
    ]);
    const errs=[];
    if(w.error)errs.push('website: '+w.error.message);
    if(q.error)errs.push('QR: '+q.error.message);
    if(errs.length)throw new Error(errs.join(' | '));
    const website=w.data||{};
    const qrRows=(q.data||[]).map(r=>({report_date:String(r.report_date).slice(0,10),site_slug:r.site_slug,title_vi:r.title_vi,opens:Math.max(0,Number(r.opens)||0)}));
    const from7=addDays(today,-6);
    const qr7=qrRows.filter(r=>r.report_date>=from7);
    const totalQr=arr=>arr.reduce((sum,r)=>sum+r.opens,0);
    const webDaily=Array.isArray(website.daily)?website.daily:[];
    if(webDaily.length!==7)throw new Error('Hàm thống kê website không trả đủ 7 ngày.');
    const qrByDate=new Map();for(const row of qr7)qrByDate.set(row.report_date,(qrByDate.get(row.report_date)||0)+row.opens);
    const series=Array.from({length:7},(_,i)=>{
      const iso=addDays(from7,i);
      return {iso,day:iso.slice(8,10)+'/'+iso.slice(5,7),web:Math.max(0,Number(webDaily[i].visits)||0),qr:qrByDate.get(iso)||0};
    });
    const sitesWithOpens=new Set(qrRows.filter(r=>r.opens>0).map(r=>r.site_slug)).size;
    show('v4WebToday',website.visits_today);show('v4Web7',website.visits_7days);
    show('v4WebAll',website.visits_total);show('v4PageViews',website.pageviews_total);
    show('v4QrToday',totalQr(qrRows.filter(r=>r.report_date===today)));
    show('v4Qr7',totalQr(qr7));show('v4Qr30',totalQr(qrRows));show('v4SitesActive',sitesWithOpens);
    renderBars(series);renderSites(qrRows);
    renderPages(Array.isArray(website.top_pages)?website.top_pages:[]);
    snapshot={today,from30,website,qrRows,series};
    $('v4Updated').textContent=`Dữ liệu theo giờ Việt Nam (UTC+7) · Cập nhật lúc ${new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date())}`;
    $('v4Export').disabled=false;
    status('Đã cập nhật báo cáo website và QR.','ok');
  }catch(error){
    console.error('Dashboard V4:',error);
    snapshot=null;
    status('Không tải được Dashboard V4: '+error.message+'. Kiểm tra quyền quản trị và các hàm SQL 001/004.','error');
  }finally{isLoading=false;$('v4Reload').disabled=false;}
}
async function boot() {
  try {
    const {data:{user},error}=await supabase.auth.getUser();
    if(error||!user){location.replace('login.html');return;}
    const {data:admin,error:adminError}=await supabase.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();
    if(adminError||!admin){status('Tài khoản không có quyền quản trị trang thống kê.','error');return;}
    $('v4Workspace').hidden=false;
    $('v4Reload').addEventListener('click',refresh);
    $('v4Export').addEventListener('click',()=>{
      if(!snapshot)return;
      try{downloadOverviewWorkbook(snapshot);status('Đã xuất báo cáo Excel V4 tổng hợp (3 trang tính).','ok');}
      catch(err){console.error(err);status('Xuất Excel chưa thành công: '+err.message,'error');}
    });
    await refresh();
  }catch(err){console.error(err);status('Không xác thực được quản trị: '+err.message,'error');}
}
boot();
