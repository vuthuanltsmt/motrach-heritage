import { supabase } from './supabase-client.js';
import { initQRAnalyticsV3 } from './qr-analytics-v3.js';
const $=id=>document.getElementById(id);
const root=new URL('../',import.meta.url);
const filenames={
 'lang-than':'qr-lang-than.png',
 'van-mieu-mo-trach':'qr-van-mieu.png',
 'dinh-lang-mo-trach':'qr-dinh-lang.png',
 'chua-dien-phuc':'qr-chua-dien-phuc.png'
};
const status=(txt,cls='')=>{$('status').textContent=txt;$('status').className='status '+cls;};
let busy=false;
const printablePath=slug=>new URL('qr/?site='+encodeURIComponent(slug),root).href;
function row(label,val){const box=document.createElement('div');box.className='stat';const text=document.createElement('span');text.textContent=label;const strong=document.createElement('strong');strong.textContent=String(val);box.append(text,strong);return box;}
function makeBtn(label,fn,primary=false){const b=document.createElement('button');b.type='button';b.textContent=label;if(primary)b.className='primary';b.onclick=fn;return b;}
function makeField(text,value){const label=document.createElement('label');label.className='field';label.textContent=text;const input=document.createElement('input');input.type='text';input.value=value||'';label.append(input);return {label,input};}
async function load(){
 const [{data:sites,error},{data:stats,error:statsError}]=await Promise.all([
  supabase.from('heritage_qr_sites').select('slug,title_vi,title_en,target_path,is_active,sort_order').order('sort_order'),
  supabase.rpc('get_qr_admin_stats')
 ]);
 if(error)throw error;
 if(statsError)console.warn('QR stats:',statsError);
 const statBySlug=new Map((stats||[]).map(x=>[x.site_slug,x]));
 $('summary').replaceChildren(row('Mã QR',sites.length),row('Đang bật',sites.filter(x=>x.is_active).length),row('Tổng lượt mở', (stats||[]).reduce((s,x)=>s+Number(x.total_opens||0),0)),row('Lượt mở hôm nay', (stats||[]).reduce((s,x)=>s+Number(x.today_opens||0),0)));
 const container=$('qrList');container.replaceChildren();
 for(const site of sites){
  const card=document.createElement('article');card.className='qr-item';
  const img=document.createElement('img');img.loading='lazy';img.alt='Mã QR '+site.title_vi;
  if(filenames[site.slug])img.src=new URL('images/qr/v2/'+filenames[site.slug],root).href;
  else img.alt='Chưa có ảnh QR cho mã này';
  const fields=document.createElement('div');
  const heading=document.createElement('h3');heading.textContent=site.title_vi;
  const url=document.createElement('a');url.href=printablePath(site.slug);url.target='_blank';url.rel='noopener';url.textContent=printablePath(site.slug);url.className='url';
  const vi=makeField('Tên hiển thị (VI)',site.title_vi);
  const en=makeField('Tên hiển thị (EN)',site.title_en);
  const target=makeField('Trang đích trong website',site.target_path);
  const badge=document.createElement('span');badge.className='badge'+(site.is_active?'':' off');badge.textContent=site.is_active?'Đang bật':'Đang ẩn';
  const numbers=document.createElement('p');const s=statBySlug.get(site.slug);
  numbers.textContent=`Lượt mở: ${s?.total_opens??0} · Hôm nay: ${s?.today_opens??0} · 7 ngày: ${s?.last7_opens??0}`;
  const actions=document.createElement('div');actions.className='row';
  const saveBtn=makeBtn('Lưu thay đổi',async()=>{
   if(busy)return;
   const path=target.input.value.trim();
   if(!/^pages\/(?:tram-[a-z0-9-]+|detail)\.html(?:\?id=[a-z0-9-]+)?$/.test(path)){
    status('Đường dẫn phải là pages/tram-....html hoặc pages/detail.html?id=...', 'error');return;
   }
   if(!vi.input.value.trim()){status('Vui lòng nhập tên tiếng Việt','error');return;}
   busy=true;saveBtn.disabled=true;
   const {data,error}=await supabase.from('heritage_qr_sites').update({title_vi:vi.input.value.trim(),title_en:en.input.value.trim(),target_path:path,updated_at:new Date().toISOString()}).eq('slug',site.slug).select('slug');
   busy=false;saveBtn.disabled=false;
   if(error||!data?.length){status('Không lưu được: '+(error?.message||'Không có quyền'),'error');return;}
await load();

status(
  'Đã kết nối Supabase. Bạn có thể kiểm tra và cập nhật QR.',
  'ok'
);

// V5.2A-5D: Khoi dong Analytics V3
// sau khi da xac thuc quyen admin.
initQRAnalyticsV3().catch(error => {
  console.error('QR Analytics V3:', error);
});

  },true);
  const toggle=makeBtn(site.is_active?'Ẩn QR':'Bật QR',async()=>{
   if(busy)return;busy=true;toggle.disabled=true;
   const {data,error}=await supabase.from('heritage_qr_sites').update({is_active:!site.is_active,updated_at:new Date().toISOString()}).eq('slug',site.slug).select('slug');
   busy=false;toggle.disabled=false;
   if(error||!data?.length){status('Không đổi được trạng thái: '+(error?.message||'Không có quyền'),'error');return;}
   await load();status('Trạng thái đã cập nhật.','ok');
  });
  const copy=makeBtn('Sao chép URL',async()=>{try{await navigator.clipboard.writeText(printablePath(site.slug));status('Đã sao chép URL QR.','ok');}catch{status('Sao chép thủ công từ đường dẫn phía trên.','error');}});
  const link=document.createElement('a');link.href=printablePath(site.slug);link.target='_blank';link.rel='noopener';link.className='button';link.textContent='Thử QR ↗';
  actions.append(saveBtn,toggle,copy,link);
  fields.append(heading,badge,numbers,url,vi.label,en.label,target.label,actions);card.append(img,fields);container.append(card);
 }
}
async function init(){
 try{
  const {data:{user},error}=await supabase.auth.getUser();
  if(error||!user){location.replace('login.html');return;}
  const {data:admin,error:err}=await supabase.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();
  if(err||!admin){location.replace('index.html');return;}
  $('qrWorkspace').hidden=false;$('refresh').onclick=()=>load().then(()=>status('Đã tải dữ liệu mới.','ok')).catch(e=>status(e.message,'error'));
await load();
status(
  'Đã kết nối Supabase. Bạn có thể kiểm tra và cập nhật QR.',
  'ok'
);

// V5.2A-5D - Khoi dong QR Analytics V3
initQRAnalyticsV3().catch(error => {
  console.error('QR Analytics V3:', error);
});

 }catch(e){console.error(e);status('Chưa tải được dữ liệu QR. Hãy chạy SQL 003 và kiểm tra quyền quản trị: '+e.message,'error');}
}
init();
