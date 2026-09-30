import { supabase } from "./supabase-client.js";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const resultMeta = document.getElementById("resultMeta");
const filterButtons = document.querySelectorAll(".filter-btn");

let allDocuments = [];
let activeFilter = "all";
let debounceTimer = null;

function escapeHtml(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function stripHtml(value){const template=document.createElement("template");template.innerHTML=String(value??"");return (template.content.textContent||"").replace(/\s+/g," ").trim();}
function normalizeText(value){return String(value??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();}
function tokenize(value){return normalizeText(value).split(" ").filter(Boolean);}
function formatDate(value){if(!value)return"";const date=new Date(value);if(Number.isNaN(date.getTime()))return"";return new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"}).format(date);}

function levenshtein(a,b){
  if(a===b)return 0;if(!a.length)return b.length;if(!b.length)return a.length;
  const prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){const current=[i];for(let j=1;j<=b.length;j++){const cost=a[i-1]===b[j-1]?0:1;current[j]=Math.min(current[j-1]+1,prev[j]+1,prev[j-1]+cost);}for(let j=0;j<current.length;j++)prev[j]=current[j];}
  return prev[b.length];
}
function fuzzyTokenMatch(q,c){if(!q||!c)return false;if(c.includes(q)||q.includes(c))return true;if(q.length<4)return false;const max=q.length>=8?2:1;return Math.abs(q.length-c.length)<=max&&levenshtein(q,c)<=max;}
function getCandidateWords(text){return [...new Set(tokenize(text))].slice(0,1400);}
function makeDoc(d){const title=normalizeText(d.title),secondary=normalizeText(d.secondary),body=normalizeText(d.body);return {...d,_title:title,_secondary:secondary,_body:body,_words:getCandidateWords(`${title} ${secondary} ${body}`)};}

function calculateScore(doc,query){
  const nq=normalizeText(query),tokens=tokenize(query);if(!nq||!tokens.length)return 0;let score=0,matched=0;
  if(doc._title===nq)score+=180;else if(doc._title.includes(nq))score+=110;
  if(doc._secondary.includes(nq))score+=55;if(doc._body.includes(nq))score+=45;
  for(const token of tokens){
    let ok=false;
    if(doc._title.includes(token)){score+=34;ok=true;}
    if(doc._secondary.includes(token)){score+=18;ok=true;}
    if(doc._body.includes(token)){score+=10;ok=true;}
    if(!ok&&doc._words.some(w=>fuzzyTokenMatch(token,w))){score+=6;ok=true;}
    if(ok)matched++;
  }
  if(!matched)return 0;const coverage=matched/tokens.length;if(coverage===1)score+=45;else if(coverage>=.6)score+=15;else score-=10;return score;
}

function highlightText(value,query){
  let safe=escapeHtml(value);const terms=String(query??"").trim().split(/\s+/).filter(t=>t.length>=2).sort((a,b)=>b.length-a.length);
  for(const term of terms){const e=term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");safe=safe.replace(new RegExp(`(${e})`,"gi"),"<mark>$1</mark>");}
  return safe;
}

function makeSnippet(doc,query){
  const source=stripHtml(doc.body);if(!source)return"";
  const ns=normalizeText(source),tokens=tokenize(query);let idx=-1;
  for(const token of tokens){const i=ns.indexOf(token);if(i>=0&&(idx===-1||i<idx))idx=i;}
  if(idx<0){const short=source.length>220?source.slice(0,220)+"...":source;return highlightText(short,query);}
  const start=Math.max(0,idx-75),end=Math.min(source.length,idx+175);let s=source.slice(start,end);if(start>0)s="..."+s;if(end<source.length)s+="...";return highlightText(s,query);
}

function renderResults(query){
  const nq=normalizeText(query);
  if(!nq){resultMeta.textContent="";searchResults.innerHTML='<div class="state-box"><div class="state-icon">🔎</div>Nhập từ khóa để bắt đầu tìm kiếm.</div>';return;}
  const results=allDocuments.filter(i=>activeFilter==="all"||i.kind===activeFilter).map(i=>({...i,score:calculateScore(i,query)})).filter(i=>i.score>0).sort((a,b)=>b.score-a.score||String(b.date||"").localeCompare(String(a.date||"")));
  resultMeta.textContent=results.length?`Tìm thấy ${results.length} kết quả cho “${query}”.`:`Không tìm thấy kết quả phù hợp cho “${query}”.`;
  if(!results.length){searchResults.innerHTML='<div class="state-box"><div class="state-icon">🧐</div><strong>Chưa tìm thấy nội dung phù hợp.</strong><br><br>Thử từ khóa ngắn hơn, bỏ bớt từ hoặc tìm không dấu.</div>';return;}
  searchResults.innerHTML=results.map(item=>{
    const type=item.kind==="heritage"?"🏛️ Di tích":"📰 Bài viết";
    const date=item.date?`<span class="result-date">📅 ${formatDate(item.date)}</span>`:"";
    const extra=item.secondary?`<div class="result-extra">${highlightText(item.secondary,query)}</div>`:"";
    return `<article class="result-card"><div class="result-top"><span class="result-type">${type}</span>${date}</div><h2 class="result-title"><a href="${escapeHtml(item.url)}">${highlightText(item.title,query)}</a></h2>${extra}<p class="result-context">${makeSnippet(item,query)}</p><a class="result-link" href="${escapeHtml(item.url)}">${item.kind==="heritage"?"Xem di tích →":"Đọc bài →"}</a></article>`;
  }).join("");
}

function syncUrl(query){const url=new URL(window.location.href);if(query.trim())url.searchParams.set("q",query.trim());else url.searchParams.delete("q");history.replaceState(null,"",url);}
function runSearch(){const q=searchInput.value.trim();syncUrl(q);renderResults(q);}

async function loadHeritage(){
  const r=await fetch("../data/heritage.json");if(!r.ok)throw new Error("Không tải được dữ liệu di tích.");const data=await r.json();
  return (Array.isArray(data)?data:[]).map(item=>makeDoc({kind:"heritage",id:item.id,title:item.name||"",secondary:[item.subtitle,item.type,item.location].filter(Boolean).join(" · "),body:[item.description,item.history].filter(Boolean).join(" "),date:"",url:"detail.html?id="+encodeURIComponent(item.id)}));
}

async function loadPosts(){
  const {data,error}=await supabase.from("posts").select("id,title,slug,excerpt,content,published_at,created_at").eq("status","published");
  if(error)throw error;
  return (data||[]).map(post=>makeDoc({kind:"post",id:post.id,title:post.title||"",secondary:post.excerpt||"",body:[post.excerpt,stripHtml(post.content)].filter(Boolean).join(" "),date:post.published_at||post.created_at||"",url:"post.html?slug="+encodeURIComponent(post.slug)}));
}

async function initializeSearch(){
  resultMeta.textContent="Đang tải dữ liệu tìm kiếm...";
  try{
    const [heritage,posts]=await Promise.all([loadHeritage(),loadPosts()]);
    allDocuments=[...heritage,...posts];
    const params=new URLSearchParams(window.location.search),initial=params.get("q")||"";searchInput.value=initial;
    resultMeta.textContent=`Đã lập chỉ mục ${allDocuments.length} nội dung.`;
    if(initial)renderResults(initial);
  }catch(error){
    console.error("Lỗi khởi tạo tìm kiếm:",error);
    resultMeta.textContent="";
    searchResults.innerHTML='<div class="state-box"><div class="state-icon">⚠️</div>Không thể tải dữ liệu tìm kiếm lúc này.</div>';
  }
}

searchForm.addEventListener("submit",e=>{e.preventDefault();runSearch();});
searchInput.addEventListener("input",()=>{clearTimeout(debounceTimer);debounceTimer=setTimeout(runSearch,260);});
filterButtons.forEach(button=>button.addEventListener("click",()=>{activeFilter=button.dataset.filter;filterButtons.forEach(b=>b.classList.remove("active"));button.classList.add("active");runSearch();}));
initializeSearch();
