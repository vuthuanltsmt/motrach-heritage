/**
 * Di sản Mộ Trạch — báo cáo XLSX v3.1.
 * Tạo tệp Open XML Spreadsheet trực tiếp trên trình duyệt, không dùng CDN,
 * không gửi dữ liệu tới bên thứ ba và không cần sửa Supabase/SQL.
 */
const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const ESC = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const A = index => { let x=index,out=''; do { out=String.fromCharCode(65+x%26)+out; x=Math.floor(x/26)-1; }while(x>=0); return out; };
const vietnameseDate = iso => { const [y,m,d] = iso.split('-');return `${d}/${m}/${y}`; };
const num = n => Math.max(0, Number(n)||0);
const excelDate = iso => Math.round((Date.parse(iso+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000);
function dateList(from,to){const result=[];for(let day=from;day<=to;){result.push(day);day=new Date(Date.parse(day+'T00:00:00Z')+86400000).toISOString().slice(0,10);}return result;}
function textCell(c,r,text,style=0){return `<c r="${c}${r}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${ESC(text)}</t></is></c>`;}
function numberCell(c,r,value,style=5){return `<c r="${c}${r}" s="${style}"><v>${num(value)}</v></c>`;}
function formulaCell(c,r,formula,cached,style=5){return `<c r="${c}${r}" s="${style}"><f>${ESC(formula)}</f><v>${num(cached)}</v></c>`;}
function row(index,cells,height){return `<row r="${index}"${height?` ht="${height}" customHeight="1"`:''}>${cells.join('')}</row>`;}
const merge = (a,b)=>`<mergeCell ref="${a}:${b}"/>`;
const font = (sz,bold,color)=>`<font>${bold?'<b/>':''}<sz val="${sz}"/><color rgb="FF${color}"/><name val="Aptos"/></font>`;
const FILL = rgb=>`<fill><patternFill patternType="solid"><fgColor rgb="FF${rgb}"/><bgColor indexed="64"/></patternFill></fill>`;
function styles(){return `<?xml version="1.0" encoding="UTF-8"?>
<styleSheet xmlns="${NS}"><numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts><fonts count="6">${font(11,false,'302822')}${font(18,true,'FFFFFF')}${font(12,true,'7D0808')}${font(11,true,'FFFFFF')}${font(10,false,'655E59')}${font(11,true,'821010')}</fonts><fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>${FILL('780808')}${FILL('F7F0E7')}${FILL('EFE5D8')}${FILL('E9F3E7')}</fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFE5D6CB"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="10">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="1" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1"/></xf>
<xf numFmtId="1" fontId="5" fillId="3" borderId="1" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="5" fillId="3" borderId="1" xfId="0"/>
</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;}
function sheetXml(rows, merges, columns, options={}) {
  const columnXml=columns.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('');
  const m=merges?.length?`<mergeCells count="${merges.length}">${merges.join('')}</mergeCells>`:'';
  const freeze=options.freeze?`<pane ySplit="${options.freeze}" topLeftCell="A${options.freeze+1}" activePane="bottomLeft" state="frozen"/>`:'';
  const filter=options.filter?`<autoFilter ref="${options.filter}"/>`:'';
  const drawing=options.drawing?'<drawing r:id="rId1"/>':'';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetViews><sheetView workbookViewId="0">${freeze}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="17"/><cols>${columnXml}</cols><sheetData>${rows.join('')}</sheetData>${m}${filter}<pageMargins left="0.28" right="0.28" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>${drawing}</worksheet>`;
}
function chartXml(sites, firstRow) {
  const rangeEnd=firstRow+sites.length-1;
  const strCache=sites.map((s,i)=>`<c:pt idx="${i}"><c:v>${ESC(s.title)}</c:v></c:pt>`).join('');
  const numCache=sites.map((s,i)=>`<c:pt idx="${i}"><c:v>${num(s.opens)}</c:v></c:pt>`).join('');
  const range=`'Tong quan'!$A$${firstRow}:$A$${rangeEnd}`,values=`'Tong quan'!$B$${firstRow}:$B$${rangeEnd}`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><c:lang val="vi-VN"/><c:chart><c:plotArea><c:layout/><c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/><c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:v>Lượt mở QR</c:v></c:tx><c:spPr><a:solidFill><a:srgbClr val="8A1515"/></a:solidFill></c:spPr><c:cat><c:strRef><c:f>${ESC(range)}</c:f><c:strCache><c:ptCount val="${sites.length}"/>${strCache}</c:strCache></c:strRef></c:cat><c:val><c:numRef><c:f>${ESC(values)}</c:f><c:numCache><c:formatCode>0</c:formatCode><c:ptCount val="${sites.length}"/>${numCache}</c:numCache></c:numRef></c:val></c:ser><c:gapWidth val="95"/><c:axId val="49000001"/><c:axId val="49000002"/></c:barChart><c:catAx><c:axId val="49000001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:axPos val="b"/><c:tickLblPos val="nextTo"/><c:crossAx val="49000002"/><c:crosses val="autoZero"/></c:catAx><c:valAx><c:axId val="49000002"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:axPos val="l"/><c:numFmt formatCode="0" sourceLinked="0"/><c:tickLblPos val="nextTo"/><c:crossAx val="49000001"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx></c:plotArea><c:plotVisOnly val="1"/></c:chart></c:chartSpace>`;
}
function drawingXml(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><xdr:oneCellAnchor><xdr:from><xdr:col>4</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>12</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="6700000" cy="3900000"/><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Biểu đồ QR theo di tích"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="6700000" cy="3900000"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>`;}
// ZIP method STORE, CRC32, central directory: no external library or remote script.
const encoder=new TextEncoder();
const crcTable=new Uint32Array(256);
for(let i=0;i<256;i++){let x=i;for(let j=0;j<8;j++)x=x&1?0xEDB88320^(x>>>1):x>>>1;crcTable[i]=x>>>0;}
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
function zipStore(entries){
  const out=[];const central=[];let offset=0;
  const u16=(dv,p,n)=>dv.setUint16(p,n,true),u32=(dv,p,n)=>dv.setUint32(p,n,true);
  for(const [name,body] of entries){
    const nb=encoder.encode(name),data=encoder.encode(body),crc=crc32(data);
    const header=new Uint8Array(30+nb.length),h=new DataView(header.buffer);
    u32(h,0,0x04034b50);u16(h,4,20);u16(h,6,0x800);u16(h,8,0);u32(h,14,crc);u32(h,18,data.length);u32(h,22,data.length);u16(h,26,nb.length);header.set(nb,30);
    out.push(header,data);
    const cd=new Uint8Array(46+nb.length),d=new DataView(cd.buffer);
    u32(d,0,0x02014b50);u16(d,4,20);u16(d,6,20);u16(d,8,0x800);u16(d,10,0);u32(d,16,crc);u32(d,20,data.length);u32(d,24,data.length);u16(d,28,nb.length);u32(d,42,offset);cd.set(nb,46);central.push(cd);
    offset+=header.length+data.length;
  }
  const cdSize=central.reduce((sum,a)=>sum+a.length,0);const eocd=new Uint8Array(22),dv=new DataView(eocd.buffer);
  u32(dv,0,0x06054b50);u16(dv,8,central.length);u16(dv,10,central.length);u32(dv,12,cdSize);u32(dv,16,offset);
  return new Blob([...out,...central,eocd],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
/** Build file from aggregated SQL rows, respecting selected site filter. */
export function buildQRWorkbook({from,to,reportRows,knownSites,selectedSite='all'}) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>to)throw new Error('Khoảng ngày không hợp lệ');
  const allSites=knownSites.map(s=>({slug:s.slug,title:String(s.title)}));
  if(!allSites.length)throw new Error('Danh sách di tích trống');
  const sites=selectedSite==='all'?allSites:allSites.filter(s=>s.slug===selectedSite);
  if(!sites.length)throw new Error('Không tìm thấy di tích được chọn');
  const dates=dateList(from,to);if(dates.length>366)throw new Error('Báo cáo tối đa 366 ngày');
  const data=new Map();for(const r of reportRows){const k=`${r.report_date}|${r.site_slug}`;data.set(k,num(r.opens));}
  const value=(day,site)=>data.get(`${day}|${site}`)||0;
  const dayTotals=dates.map(d=>sites.reduce((s,site)=>s+value(d,site.slug),0));
  const sum=arr=>arr.reduce((a,b)=>a+b,0);
  const totals=sites.map(s=>sum(dates.map(d=>value(d,s.slug))));
  const total=sum(totals),parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),part=k=>parts.find(p=>p.type===k).value,today=`${part('year')}-${part('month')}-${part('day')}`;
  const todayCount=dates.includes(today)?dayTotals[dates.indexOf(today)]:0;
  const busiest=dayTotals.length?Math.max(...dayTotals):0;
  const active=totals.filter(x=>x>0).length;
  const allTotals=allSites.map(s=>({title:s.title,opens:sum(dates.map(d=>value(d,s.slug)))})).sort((a,b)=>b.opens-a.opens||a.title.localeCompare(b.title,'vi'));
  const overallRows=[],overallMerge=[];
  overallRows.push(row(1,[textCell('A',1,'DI SẢN MỘ TRẠCH  |  THỐNG KÊ LƯỢT MỞ QR',1)],37));overallMerge.push(merge('A1','M1'));
  overallRows.push(row(2,[textCell('A',2,'BÁO CÁO THEO THỜI GIAN · DỮ LIỆU QR V2',2)],27));overallMerge.push(merge('A2','M2'));
  overallRows.push(row(4,[textCell('A',4,'Từ ngày',2),textCell('B',4,vietnameseDate(from)),textCell('D',4,'Đến ngày',2),textCell('E',4,vietnameseDate(to)),textCell('G',4,'Phạm vi',2),textCell('H',4,selectedSite==='all'?'Tất cả di tích':sites[0].title)]));
  overallRows.push(row(6,[textCell('A',6,'LƯỢT MỞ TRONG KỲ',3),textCell('D',6,'LƯỢT MỞ HÔM NAY',3),textCell('G',6,'DI TÍCH CÓ LƯỢT',3),textCell('J',6,'NGÀY CAO NHẤT',3)],29));
  for(const col of ['A','D','G','J']){const end={A:'C',D:'F',G:'I',J:'M'}[col];overallMerge.push(merge(col+'6',end+'6'));}
  overallRows.push(row(7,[numberCell('A',7,total,8),numberCell('D',7,todayCount,8),numberCell('G',7,active,8),numberCell('J',7,busiest,8)],30));
  overallRows.push(row(9,[textCell('A',9,'Ngày báo cáo',2),textCell('B',9,new Date().toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})),textCell('G',9,'Đơn vị',2),textCell('H',9,'Lượt mở QR; không phải số khách duy nhất')],24));
  overallRows.push(row(11,[textCell('A',11,'SO SÁNH LƯỢT MỞ THEO DI TÍCH',2)],27));overallMerge.push(merge('A11','D11'));
  overallRows.push(row(13,[textCell('A',13,'Di tích',3),textCell('B',13,'Lượt mở',3),textCell('C',13,'Tỷ trọng (%)',3)],23));
  allTotals.forEach((s,i)=>{const r=14+i;overallRows.push(row(r,[textCell('A',r,s.title,6),numberCell('B',r,s.opens,5),numberCell('C',r,total?100*s.opens/sum(allTotals.map(t=>t.opens)):0,5)],24));});
  const foot=14+allTotals.length;overallRows.push(row(foot,[textCell('A',foot,'TỔNG 4 DI TÍCH',9),formulaCell('B',foot,`SUM(B14:B${foot-1})`,sum(allTotals.map(s=>s.opens)),8)],24));
  const msgrow=Math.max(21,foot+3);overallRows.push(row(msgrow,[textCell('A',msgrow,'Số liệu là lượt mở URL QR được hệ thống ghi nhận; không đại diện số khách duy nhất.',7)]));overallMerge.push(merge(`A${msgrow}`,`M${msgrow}`));
  overallRows.push(row(msgrow+1,[textCell('A',msgrow+1,'Bảng so sánh bên trái luôn gồm cả 4 di tích; phần chỉ số và sheet Theo ngày tôn trọng bộ lọc đã chọn.',7)]));overallMerge.push(merge(`A${msgrow+1}`,`M${msgrow+1}`));
  const dailyRows=[],dailyMerge=[];
  dailyRows.push(row(1,[textCell('A',1,'CHI TIẾT LƯỢT MỞ QR THEO NGÀY',1)],36));dailyMerge.push(merge('A1',`${A(sites.length+1)}1`));
  dailyRows.push(row(2,[textCell('A',2,`${vietnameseDate(from)} – ${vietnameseDate(to)} | ${selectedSite==='all'?'Tất cả di tích':sites[0].title}`,2)]));dailyMerge.push(merge('A2',`${A(sites.length+1)}2`));
  const headings=['Ngày',...sites.map(s=>s.title),'Tổng lượt mở'];const hdr=5;
  dailyRows.push(row(hdr,headings.map((h,i)=>textCell(A(i),hdr,h,3)),37));
  dates.forEach((date,i)=>{const r=hdr+1+i,counts=sites.map(s=>value(date,s.slug));const c=[numberCell('A',r,excelDate(date),4),...counts.map((n,j)=>numberCell(A(j+1),r,n,5)),formulaCell(A(sites.length+1),r,`SUM(B${r}:${A(sites.length)}${r})`,sum(counts),5)];dailyRows.push(row(r,c,20));});
  const totalRow=hdr+dates.length+1;
  const c=[textCell('A',totalRow,'TỔNG',9)];for(let i=0;i<=sites.length;i++){const col=A(i+1);const n=i===sites.length?total:totals[i];c.push(formulaCell(col,totalRow,`SUM(${col}${hdr+1}:${col}${totalRow-1})`,n,8));}dailyRows.push(row(totalRow,c,27));
  const notes=[];notes.push(row(1,[textCell('A',1,'GHI CHÚ PHƯƠNG PHÁP THỐNG KÊ',1)],37));
  const details=[
    ['Nguồn dữ liệu','Supabase – tổng hợp lượt mở đường dẫn QR V2 theo ngày Việt Nam (UTC+7)'],
    ['Đơn vị','Lượt mở đường dẫn QR được ghi nhận, không phải lượt quét camera thực tế.'],
    ['Quy tắc đếm','Lượt mở trùng trong cùng phiên 30 phút có thể không được cộng thêm.'],
    ['Không suy diễn','Không sử dụng số lượt mở như số người tham quan hoặc số du khách duy nhất.'],
    ['Phạm vi',selectedSite==='all'?'Tất cả di tích':sites[0].title],
    ['Từ ngày',vietnameseDate(from)],['Đến ngày',vietnameseDate(to)],
    ['Thời gian','Các ngày được tổng hợp theo múi giờ Asia/Ho_Chi_Minh.'],
    ['Riêng tư','Báo cáo chỉ có số liệu tổng hợp; không chứa IP, mã phiên hoặc dữ liệu cá nhân.'],
    ['Liên kết','https://vuthuanltsmt.github.io/motrach-heritage/']
  ];
  details.forEach(([key,val],i)=>{const r=i+3;notes.push(row(r,[textCell('A',r,key,2),textCell('B',r,val,7)],i===4?30:38));});
  const files=[
    ['[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/><Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/></Types>`],
    ['_rels/.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets><sheet name="Tong quan" sheetId="1" r:id="rId1"/><sheet name="Theo ngay" sheetId="2" r:id="rId2"/><sheet name="Ghi chu" sheetId="3" r:id="rId3"/></sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`],
    ['xl/_rels/workbook.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml',styles()],
    ['xl/worksheets/sheet1.xml',sheetXml(overallRows,overallMerge,[39,15,18,17,20,16,18,24,18,19,17,17,17],{drawing:true})],
    ['xl/worksheets/sheet2.xml',sheetXml(dailyRows,dailyMerge,[17,...sites.map(()=>29),19],{freeze:5,filter:`A5:${A(sites.length+1)}${totalRow-1}`})],
    ['xl/worksheets/sheet3.xml',sheetXml(notes,[merge('A1','H1')],[24,72,15,15,15,15,15,15])],
    ['xl/worksheets/_rels/sheet1.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>`],
    ['xl/drawings/drawing1.xml',drawingXml()],
    ['xl/drawings/_rels/drawing1.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/></Relationships>`],
    ['xl/charts/chart1.xml',chartXml(allTotals,14)]
  ];
  return zipStore(files);
}
export function downloadQRWorkbook(opts){
  const blob=buildQRWorkbook(opts);
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`MoTrach_ThongKeQR_${opts.from}_${opts.to}.xlsx`;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
