// QR V2: mot duong dan trung gian, khong thay doi URL tren QR khi sua trang dich.
const root = new URL('../', import.meta.url);
const defaults = {
  'lang-than': {title:'Lăng Thần – Mộ cụ Vũ Hồn',path:'pages/tram-lang-than.html'},
  'van-mieu-mo-trach': {title:'Miếu Mộ Trạch',path:'pages/tram-van-mieu.html'},
  'dinh-lang-mo-trach': {title:'Đình làng Mộ Trạch',path:'pages/tram-dinh-lang.html'},
  'chua-dien-phuc': {title:'Chùa Diên Phúc',path:'pages/tram-chua-dien-phuc.html'}
};
const titleEl=document.getElementById('siteTitle');
const statusEl=document.getElementById('statusMessage');
const link=document.getElementById('openLink');
function limit(promise,ms){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Timeout')),ms))]);}
function validTarget(path){
  if(typeof path!=='string' || !/^pages\/(?:tram-[a-z0-9-]+|detail)\.html(?:\?id=[a-z0-9-]+)?$/.test(path)) return null;
  const url = new URL(path,root);
  if(url.origin!==root.origin||!url.pathname.startsWith(new URL('pages/',root).pathname)) return null;
  return url.href;
}
function visitorId(){
  try {
    const key='motrach-qr-visit';
    let v=sessionStorage.getItem(key);
    if(!v||!(/^[0-9a-f-]{36}$/i.test(v))){v=crypto.randomUUID();sessionStorage.setItem(key,v);}
    return v;
  } catch {return crypto.randomUUID();}
}
async function start(){
  const slug=new URLSearchParams(location.search).get('site')||'';
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!defaults[slug]){
    titleEl.textContent='Không tìm thấy mã QR';statusEl.textContent='Vui lòng mở danh sách di tích để tiếp tục.';
    link.href=new URL('pages/heritage.html',root).href;link.textContent='Xem danh sách di tích';link.hidden=false;return;
  }
  const fallback=defaults[slug];let target=fallback.path;let label=fallback.title;
  let dbWorking=false;
  let supabase;
  try {
    ({supabase}=await limit(import('./supabase-client.js'),2500));
    const {data,error}=await limit(supabase.from('heritage_qr_sites')
      .select('slug,title_vi,target_path,is_active').eq('slug',slug).maybeSingle(),2500);
    if(error) throw error;
    dbWorking=true;
    if(!data||!data.is_active){
      titleEl.textContent='Trạm QR đang tạm ngừng';statusEl.textContent='Vui lòng chọn một di tích khác.';
      link.href=new URL('pages/heritage.html',root).href;link.textContent='Xem danh sách di tích';link.hidden=false;return;
    }
    target=data.target_path;label=data.title_vi||fallback.title;
  }catch(error){console.warn('QR offline fallback:',error);}
  const destination=validTarget(target);
  if(!destination){titleEl.textContent='Đường dẫn di tích không hợp lệ';statusEl.textContent='Vui lòng thông báo người quản trị.';return;}
  titleEl.textContent=label;link.href=destination;link.textContent='Mở thông tin di tích →';link.hidden=false;
  statusEl.textContent='Đang chuyển đến trang giới thiệu di tích…';
  if(dbWorking){
    try {await limit(supabase.rpc('record_qr_open',{p_slug:slug,p_visit_id:visitorId()}),1600);}
    catch(e){console.warn('QR tracking unavailable:',e);}
  }
  location.replace(destination);
}
start();
