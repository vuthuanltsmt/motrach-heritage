/** Mộ Trạch Dashboard V4. Offline XLSX: no CDN, no spreadsheet data sent externally. */
const NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const n=v=>Math.max(0,Number(v)||0);
const int=v=>Number.isFinite(n(v))?n(v):0;
const isoVN=v=>{const [y,m,d]=String(v).split('-');return `${d}/${m}/${y}`;};
const textCell=(ref,val,style=0)=>`<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${esc(val)}</t></is></c>`;
const valueCell=(ref,val,style=3)=>`<c r="${ref}" s="${style}"><v>${int(val)}</v></c>`;
const formulaCell=(ref,formula,cached,style=3)=>`<c r="${ref}" s="${style}"><f>${esc(formula)}</f><v>${int(cached)}</v></c>`;
const row=(i,cells)=>`<row r="${i}">${cells.join('')}</row>`;
const namedRows=(name,data)=>data.map(([label,value],idx)=>row(idx+4,[textCell('A'+(idx+4),label,4),typeof value==='number'?valueCell('B'+(idx+4),value):textCell('B'+(idx+4),value)])).join('');
function styleSheet(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${NS}">
<fonts count="4"><font><sz val="11"/><name val="Aptos"/><color rgb="FF3F332D"/></font><font><b/><sz val="19"/><name val="Aptos"/><color rgb="FFFFFFFF"/></font><font><b/><sz val="11"/><name val="Aptos"/><color rgb="FFFFFFFF"/></font><font><b/><sz val="11"/><name val="Aptos"/><color rgb="FF780C0C"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF800000"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF6EEE5"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0"/><xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0"/><xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="3" fillId="3" borderId="0" xfId="0"/><xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;}
function sheetXml(rows, widths, merges=[],freeze=0,filter='') {
  const cols=widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('');
  const joined=merges.length?`<mergeCells count="${merges.length}">${merges.map(m=>`<mergeCell ref="${m}"/>`).join('')}</mergeCells>`:'';
  const pane=freeze?`<pane ySplit="${freeze}" topLeftCell="A${freeze+1}" activePane="bottomLeft" state="frozen"/>`:'';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${NS}"><sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="19"/><cols>${cols}</cols><sheetData>${rows.join('')}</sheetData>${joined}${filter?`<autoFilter ref="${filter}"/>`:''}<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.3" footer="0.3"/></worksheet>`;
}
const encoder=new TextEncoder();
const crcTable=Array.from({length:256},(_,i)=>{let v=i;for(let j=0;j<8;j++)v=(v&1)?(0xedb88320^(v>>>1)):(v>>>1);return v>>>0;});
function crc32(bytes){let crc=0xffffffff;for(const b of bytes)crc=crcTable[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
function zipStore(entries){
  const files=[],directory=[];let offset=0;
  const u16=(v,p,x)=>v.setUint16(p,x,true),u32=(v,p,x)=>v.setUint32(p,x,true);
  for(const [name,xml] of entries){
    const nameBytes=encoder.encode(name),bytes=encoder.encode(xml),crc=crc32(bytes);
    const local=new Uint8Array(30+nameBytes.length),lh=new DataView(local.buffer);
    u32(lh,0,0x04034b50);u16(lh,4,20);u16(lh,6,0x800);u32(lh,14,crc);u32(lh,18,bytes.length);u32(lh,22,bytes.length);u16(lh,26,nameBytes.length);local.set(nameBytes,30);
    files.push(local,bytes);
    const record=new Uint8Array(46+nameBytes.length),ch=new DataView(record.buffer);
    u32(ch,0,0x02014b50);u16(ch,4,20);u16(ch,6,20);u16(ch,8,0x800);u32(ch,16,crc);u32(ch,20,bytes.length);u32(ch,24,bytes.length);u16(ch,28,nameBytes.length);u32(ch,42,offset);record.set(nameBytes,46);directory.push(record);
    offset+=local.length+bytes.length;
  }
  const dsize=directory.reduce((a,x)=>a+x.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);
  u32(ev,0,0x06054b50);u16(ev,8,directory.length);u16(ev,10,directory.length);u32(ev,12,dsize);u32(ev,16,offset);
  return new Blob([...files,...directory,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
export function buildOverviewWorkbook({today,from30,website,qrRows,series}){
  const totalQR=qrRows.reduce((a,r)=>a+n(r.opens),0);
  const from7=series[0].iso;
  const qr7=qrRows.filter(r=>r.report_date>=from7).reduce((a,r)=>a+n(r.opens),0);
  const qrToday=qrRows.filter(r=>r.report_date===today).reduce((a,r)=>a+n(r.opens),0);
  const bySite=new Map();for(const r of qrRows){const key=String(r.site_slug),x=bySite.get(key)||{title:String(r.title_vi||key),opens:0};x.opens+=n(r.opens);bySite.set(key,x);}
  const sites=[...bySite.values()].sort((a,b)=>b.opens-a.opens||a.title.localeCompare(b.title,'vi'));
  const pageRows=Array.isArray(website.top_pages)?website.top_pages:[];
  const summaryRows=[
    row(1,[textCell('A1','DI SẢN MỘ TRẠCH | DASHBOARD TỔNG HỢP V4',1)]),
    row(2,[textCell('A2','Số liệu thống kê website và lượt mở QR (hai thước đo độc lập)',4)]),
    row(3,[textCell('A3','Chỉ tiêu',2),textCell('B3','Giá trị',2)]),
    ...[
      ['Phiên website hôm nay',n(website.visits_today)],
      ['Phiên website 7 ngày',n(website.visits_7days)],
      ['Tổng phiên website từ khi kích hoạt',n(website.visits_total)],
      ['Tổng lượt xem trang',n(website.pageviews_total)],
      ['Lượt mở QR hôm nay',qrToday],['Lượt mở QR 7 ngày',qr7],
      ['Lượt mở QR 30 ngày',totalQR],
      ['Di tích có lượt mở QR trong 30 ngày',sites.filter(s=>s.opens>0).length]
    ].map(([k,v],i)=>row(i+4,[textCell('A'+(i+4),k,4),valueCell('B'+(i+4),v)])),
    row(13,[textCell('A13','QR THEO DI TÍCH — 30 NGÀY',2),textCell('B13','Lượt mở',2)]),
    ...sites.map((s,i)=>row(14+i,[textCell('A'+(14+i),s.title),valueCell('B'+(14+i),s.opens)])),
    row(20,[textCell('A20','TRANG XEM NHIỀU NHẤT (TỪ KHI KÍCH HOẠT)',2),textCell('B20','Lượt xem',2)]),
    ...pageRows.map((p,i)=>row(21+i,[textCell('A'+(21+i),String(p.path)),valueCell('B'+(21+i),p.views)]))
  ];
  const days=[row(1,[textCell('A1','SO SÁNH XU HƯỚNG TRONG 7 NGÀY',1)]),
    row(2,[textCell('A2','Phiên website và lượt mở QR không được cộng thành số khách.',4)]),
    row(4,[textCell('A4','Ngày',2),textCell('B4','Phiên website',2),textCell('C4','Lượt mở QR',2)])
  ];
  series.forEach((d,i)=>days.push(row(i+5,[textCell('A'+(i+5),isoVN(d.iso)),valueCell('B'+(i+5),d.web),valueCell('C'+(i+5),d.qr)])));
  days.push(row(12,[textCell('A12','TỔNG 7 NGÀY',4),formulaCell('B12','SUM(B5:B11)',series.reduce((a,r)=>a+r.web,0)),formulaCell('C12','SUM(C5:C11)',series.reduce((a,r)=>a+r.qr,0))]));
  const notes=[
    ['Phạm vi','Bảng điều khiển tổng hợp dự án Di sản Mộ Trạch Heritage'],
    ['Thống kê website','Nguồn: hàm get_admin_visit_summary() từ Supabase (SQL 001).'],
    ['Phiên website','Được ước tính từ định danh phiên, không phải người hoặc du khách duy nhất.'],
    ['Lượt xem trang','Số sự kiện xem trang được ghi nhận, có thể lớn hơn số phiên.'],
    ['Thống kê QR','Nguồn: hàm get_qr_daily_report() từ Supabase (SQL 004).'],
    ['Lượt mở QR','Lượt mở đường dẫn QR; không khẳng định số lần camera quét hay số khách.'],
    ['Chống trùng','Hệ thống QR V2 có quy tắc phiên 30 phút.'],
    ['Ngày áp dụng','Tính theo múi giờ Asia/Ho_Chi_Minh (UTC+7).'],
    ['Dữ liệu lịch sử','Chỉ ghi nhận từ thời điểm triển khai từng bộ theo dõi.'],
    ['Kỳ QR 30 ngày',`${isoVN(from30)} – ${isoVN(today)}`],
    ['Riêng tư','Báo cáo tổng hợp không có IP hoặc mã phiên.'],
    ['Trang chủ','https://vuthuanltsmt.github.io/motrach-heritage/']
  ];
  const noteRows=[row(1,[textCell('A1','GHI CHÚ VỀ DỮ LIỆU VÀ PHƯƠNG PHÁP',1)]),...notes.map(([k,v],i)=>row(i+3,[textCell('A'+(i+3),k,4),textCell('B'+(i+3),v)]))];
  const files=[
    ['[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`],
    ['_rels/.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Tong quan" sheetId="1" r:id="rId1"/><sheet name="7 ngay" sheetId="2" r:id="rId2"/><sheet name="Ghi chu" sheetId="3" r:id="rId3"/></sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`],
    ['xl/_rels/workbook.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml',styleSheet()],
    ['xl/worksheets/sheet1.xml',sheetXml(summaryRows,[64,25,18,18],['A1:D1','A2:D2'])],
    ['xl/worksheets/sheet2.xml',sheetXml(days,[19,23,23],['A1:C1','A2:C2'],4,'A4:C11')],
    ['xl/worksheets/sheet3.xml',sheetXml(noteRows,[26,86,15,15],['A1:D1'])]
  ];
  return zipStore(files);
}
export function downloadOverviewWorkbook(snapshot) {
  const blob=buildOverviewWorkbook(snapshot);
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;
  link.download=`MoTrach_DashboardV4_${snapshot.today}.xlsx`;
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
