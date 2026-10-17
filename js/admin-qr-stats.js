import { supabase } from './supabase-client.js';

const $ = id => document.getElementById(id);
const formatInt = n => Number(n || 0).toLocaleString('vi-VN');
const svgNS = 'http://www.w3.org/2000/svg';
let reportRows = [];
let knownSites = [];
let lastRange = null;
let loading = false;

function status(message, type = '') {
  $('reportStatus').textContent = message;
  $('reportStatus').className = 'status ' + type;
}
function vnToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone:'Asia/Ho_Chi_Minh', year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(new Date());
  const part = key => parts.find(item => item.type === key).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
function offsetDay(iso, delta) {
  const [y,m,d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y,m-1,d + delta));
  return date.toISOString().slice(0,10);
}
function dateDiff(from, to) {
  return Math.round((Date.parse(to+'T00:00:00Z') - Date.parse(from+'T00:00:00Z')) / 86400000);
}
function fmtDay(iso) { const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}`; }
function listDates(start, end) {
  const dates = [];
  for(let date=start; date<=end; date=offsetDay(date,1)) dates.push(date);
  return dates;
}
function setPeriod(period) {
  const today = vnToday();
  const start = period === 'month' ? today.slice(0,8)+'01' : offsetDay(today, -(Number(period)-1));
  $('dateFrom').value = start;
  $('dateTo').value = today;
  document.querySelectorAll('[data-period]').forEach(btn => {
    btn.classList.toggle('active',btn.dataset.period === period);
  });
}
function node(tag, textValue, className) {
  const e = document.createElement(tag);
  if(textValue !== undefined) e.textContent = String(textValue);
  if(className) e.className = className;
  return e;
}
function svg(tag, attrs = {}, content) {
  const e = document.createElementNS(svgNS,tag);
  for(const [key,value] of Object.entries(attrs)) e.setAttribute(key,String(value));
  if(content !== undefined) e.textContent = String(content);
  return e;
}
function namesAndRows() {
  const selection = $('siteFilter').value;
  const activeSites = selection === 'all' ? knownSites : knownSites.filter(s => s.slug === selection);
  const eligible = new Set(activeSites.map(s => s.slug));
  return {activeSites, rows:reportRows.filter(r => eligible.has(r.site_slug))};
}
function renderKPIs(daily, sites, filteredRows) {
  const total = daily.reduce((sum,d)=>sum+d.count,0);
  const today = daily.find(d=>d.date===vnToday())?.count || 0;
  const sitesWithActivity = new Set(filteredRows.filter(r=>r.opens>0).map(r=>r.site_slug)).size;
  const busiest = daily.reduce((best,row)=>row.count>best.count?row:best,{date:'',count:0});
  const cards = [
    ['Lượt mở trong kỳ',formatInt(total),'Theo khoảng ngày đã chọn'],
    ['Lượt mở hôm nay',formatInt(today),'Ngày '+fmtDay(vnToday())],
    ['Di tích có lượt mở',formatInt(sitesWithActivity),'Trong '+formatInt(sites.length)+' di tích đang lọc'],
    ['Ngày cao nhất',formatInt(busiest.count),busiest.date ? fmtDay(busiest.date) : 'Chưa có dữ liệu']
  ];
  const wrap=$('kpiGrid'); wrap.replaceChildren();
  for(const [label,value,sub] of cards){
    const card=node('article',undefined,'kpi');
    card.append(node('div',label,'label'),node('strong',value),node('div',sub,'sub'));
    wrap.append(card);
  }
}
function renderChart(daily) {
  const holder=$('chartRegion');holder.replaceChildren();
  const values=daily.map(item=>item.count);
  if(!values.length){holder.append(node('div','Chưa có dữ liệu','chart-empty'));return;}
  const width=800,height=260,left=52,right=14,top=15,bottom=40;
  const plotWidth=width-left-right,plotHeight=height-top-bottom;
  const max=Math.max(1,...values);
  const ymax=max <= 4 ? 4 : Math.ceil(max/4)*4;
  const y=v=>top+plotHeight-(v/ymax)*plotHeight;
  const x=i=>left+(daily.length<2?plotWidth/2:(i/(daily.length-1))*plotWidth);
  const chart=svg('svg',{viewBox:`0 0 ${width} ${height}`,preserveAspectRatio:'none','aria-hidden':'true'});
  for(let i=0;i<=4;i++){
    const val=Math.round((ymax*i)/4),yy=y(val);
    chart.append(svg('line',{x1:left,y1:yy,x2:width-right,y2:yy,stroke:'#ecdfd7','stroke-width':1}));
    chart.append(svg('text',{x:left-9,y:yy+5,'text-anchor':'end','font-size':13,fill:'#7a6960'},val));
  }
  const coords=daily.map((d,i)=>[x(i),y(d.count)]);
  const polyline=coords.map(p=>p.join(',')).join(' ');
  const first=coords[0],last=coords[coords.length-1];
  chart.append(svg('polygon',{points:`${first[0]},${top+plotHeight} ${polyline} ${last[0]},${top+plotHeight}`,fill:'#f6dfd9',opacity:'.84'}));
  chart.append(svg('polyline',{points:polyline,fill:'none',stroke:'#922321','stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'}));
  const tickCount=Math.min(7,daily.length),displayed=new Set();
  for(let t=0;t<tickCount;t++){
    const i=tickCount===1?0:Math.round(t*(daily.length-1)/(tickCount-1));
    if(displayed.has(i))continue;displayed.add(i);
    chart.append(svg('text',{x:x(i),y:height-13,'text-anchor':'middle','font-size':12,fill:'#817269'},fmtDay(daily[i].date).slice(0,5)));
  }
  const step=daily.length>100?Math.ceil(daily.length/75):1;
  coords.forEach(([cx,cy],i)=>{
    if(i%step!==0 && i!==coords.length-1)return;
    const point=svg('circle',{cx,cy,r:daily.length>90?3:4,fill:'#8a1617'});
    point.append(svg('title',{},`${fmtDay(daily[i].date)}: ${formatInt(daily[i].count)} lượt mở`));
    chart.append(point);
  });
  holder.append(chart);
  holder.setAttribute('aria-label',`Biểu đồ ${daily.length} ngày. Cao nhất ${formatInt(max===1&&values.every(n=>n===0)?0:max)} lượt mở mỗi ngày.`);
}
function renderRanking() {
  // Always show the full-site comparison for the chosen date range.
  const totals=knownSites.map(site=>({ ...site,
    count:reportRows.filter(r=>r.site_slug===site.slug).reduce((a,r)=>a+r.opens,0)
  })).sort((a,b)=>b.count-a.count || a.title.localeCompare(b.title,'vi'));
  const max=Math.max(1,...totals.map(x=>x.count));
  const target=$('ranking');target.replaceChildren();
  for(const r of totals){
    const item=node('div',undefined,'rank-item');
    const caption=node('div',undefined,'rank-name');
    caption.append(node('span',r.title),node('strong',formatInt(r.count)));
    const progress=node('div',undefined,'rank-track');
    const fill=node('span');fill.style.width=`${r.count*100/max}%`;
    progress.append(fill);item.append(caption,progress);target.append(item);
  }
}
function renderTable(dates, sites, matrix) {
  const head=$('dailyHead'),body=$('dailyBody'),foot=$('dailyFoot');
  head.replaceChildren();body.replaceChildren();foot.replaceChildren();
  const headings=['Ngày',...sites.map(s=>s.title),'Tổng'];
  const headerRow=document.createElement('tr');
  headings.forEach(label=>headerRow.append(node('th',label)));
  head.append(headerRow);
  for(const date of [...dates].reverse()){
    const tr=document.createElement('tr');tr.append(node('td',fmtDay(date)));
    let rowTotal=0;
    for(const site of sites){
      const count=matrix.get(date+'|'+site.slug)||0;
      tr.append(node('td',formatInt(count)));rowTotal+=count;
    }
    tr.append(node('td',formatInt(rowTotal)));body.append(tr);
  }
  const sumRow=document.createElement('tr');sumRow.append(node('td','TỔNG'));
  let grand=0;
  for(const site of sites){
    const total=reportRows.filter(r=>r.site_slug===site.slug).reduce((acc,r)=>acc+r.opens,0);
    sumRow.append(node('td',formatInt(total)));grand+=total;
  }
  sumRow.append(node('td',formatInt(grand)));foot.append(sumRow);
  $('rowCount').textContent=`${dates.length} ngày • ${sites.length} di tích`;
}
function render() {
  if(!lastRange)return;
  const {activeSites,rows}=namesAndRows();
  const dates=listDates(lastRange.from,lastRange.to);
  const matrix=new Map(rows.map(r=>[r.report_date+'|'+r.site_slug,r.opens]));
  const daily=dates.map(date=>({date,count:activeSites.reduce((sum,s)=>sum+(matrix.get(date+'|'+s.slug)||0),0)}));
  renderKPIs(daily,activeSites,rows);
  renderChart(daily);
  renderRanking();
  renderTable(dates,activeSites,matrix);
  $('rangeLabel').textContent=`${fmtDay(lastRange.from)} – ${fmtDay(lastRange.to)}`;
}
function rebuildSiteOptions() {
  const select=$('siteFilter'),selected=select.value;
  select.replaceChildren();
  const all=node('option','Tất cả di tích');all.value='all';select.append(all);
  for(const site of knownSites){const option=node('option',site.title);option.value=site.slug;select.append(option);}
  select.value=selected==='all'||knownSites.some(s=>s.slug===selected)?selected:'all';
}
async function fetchReport() {
  if(loading)return;
  const from=$('dateFrom').value,to=$('dateTo').value;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>to||dateDiff(from,to)>365){
    status('Vui lòng chọn khoảng thời gian hợp lệ, tối đa 366 ngày.','error');return;
  }
  if(to>vnToday()) { status('Ngày kết thúc không được lớn hơn ngày hiện tại.','error');return; }
  loading=true;$('loadReport').disabled=true;$('downloadCsv').disabled=true;$('downloadXlsx').disabled=true;
  status('Đang tải thống kê QR…');
  try{
    const {data,error}=await supabase.rpc('get_qr_daily_report',{p_from:from,p_to:to});
    if(error)throw error;
    reportRows=(data||[]).map(r=>({...r,opens:Number(r.opens)||0}));
    const sites=new Map();
    for(const r of reportRows) if(!sites.has(r.site_slug))sites.set(r.site_slug,{slug:r.site_slug,title:r.title_vi});
    knownSites=[...sites.values()];lastRange={from,to};
    rebuildSiteOptions();render();
    status(`Đã cập nhật ${formatInt(reportRows.length)} dòng dữ liệu tổng hợp. Không trả về mã phiên hoặc dữ liệu cá nhân.`, 'ok');
  }catch(error){
    console.error('QR Analytics V3:',error);
    status('Không tải được thống kê. Kiểm tra SQL 004, quyền quản trị và kết nối Supabase. '+error.message,'error');
  }finally{loading=false;$('loadReport').disabled=false;$('downloadCsv').disabled=false;$('downloadXlsx').disabled=false;}
}
function csvField(value) {
  let val=String(value??'');
  // Avoid spreadsheet formula injection when a title has been edited in admin.
  if(/^[\s]*[=+\-@\t\r]/.test(val))val="'"+val;
  return '"'+val.replaceAll('"','""')+'"';
}
function exportCSV() {
  if(!lastRange || !reportRows.length){status('Chưa có dữ liệu để xuất.','error');return;}
  const {activeSites,rows}=namesAndRows();
  const dates=listDates(lastRange.from,lastRange.to);
  const matrix=new Map(rows.map(r=>[r.report_date+'|'+r.site_slug,r.opens]));
  const lines=[ 'sep=;',
    [ 'DI SẢN MỘ TRẠCH – THỐNG KÊ LƯỢT MỞ QR' ],
    ['Từ ngày',lastRange.from,'Đến ngày',lastRange.to],
    ['Đơn vị','Lượt mở đường dẫn QR (không phải khách duy nhất)'],
    [],
    ['Ngày',...activeSites.map(s=>s.title),'Tổng lượt mở']
  ];
  for(const date of dates){
    const counts=activeSites.map(site=>matrix.get(date+'|'+site.slug)||0);
    lines.push([date,...counts,counts.reduce((a,b)=>a+b,0)]);
  }
  const sums=activeSites.map(s=>rows.filter(r=>r.site_slug===s.slug).reduce((a,r)=>a+r.opens,0));
  lines.push(['TỔNG',...sums,sums.reduce((a,b)=>a+b,0)]);
  const content='\ufeff'+lines.map(line=>typeof line==='string'?line:line.map(csvField).join(';')).join('\r\n');
  const blob=new Blob([content],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download=`MoTrach_QR_${lastRange.from}_${lastRange.to}.csv`;
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  status('Đã xuất tệp CSV UTF-8. Bạn có thể mở trực tiếp bằng Microsoft Excel.', 'ok');
}
async function exportXLSX() {
  if(loading || !lastRange || !knownSites.length){status('Chưa có báo cáo để xuất Excel.','error');return;}
  const btn=$('downloadXlsx');btn.disabled=true;
  try {
    status('Đang tạo báo cáo Excel .xlsx trên máy của bạn…');
    const {downloadQRWorkbook}=await import('./qr-xlsx-export.js?v=31');
    downloadQRWorkbook({
      from:lastRange.from,to:lastRange.to,reportRows,knownSites,
      selectedSite:$('siteFilter').value
    });
    status('Đã tạo báo cáo .xlsx với ba trang: Tổng quan, Theo ngày, Ghi chú.','ok');
  } catch(error) {
    console.error('Xuất QR XLSX V3.1:',error);
    status('Không xuất được .xlsx: '+error.message+'; bạn vẫn có thể dùng CSV.','error');
  } finally {btn.disabled=false;}
}
async function init() {
  setPeriod('30');
  document.querySelectorAll('[data-period]').forEach(btn=>btn.addEventListener('click',()=>{setPeriod(btn.dataset.period);fetchReport();}));
  $('reportFilter').addEventListener('submit',event=>{
    event.preventDefault();document.querySelectorAll('[data-period]').forEach(btn=>btn.classList.remove('active'));fetchReport();
  });
  $('siteFilter').addEventListener('change',render);
  $('downloadCsv').addEventListener('click',exportCSV);
  $('downloadXlsx').addEventListener('click',exportXLSX);
  try{
    const {data:{user},error}=await supabase.auth.getUser();
    if(error||!user){location.replace('login.html');return;}
    const {data:admin,error:adminErr}=await supabase.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();
    if(adminErr||!admin){location.replace('index.html');return;}
    $('reportWorkspace').hidden=false;
    await fetchReport();
  }catch(error){console.error(error);status('Lỗi quyền truy cập hoặc kết nối: '+error.message,'error');}
}
init();
