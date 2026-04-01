// ── SEARCH ─────────────────────────────────────────────────────────────────
let srchFilters={type:'all',accId:'',minAmt:'',maxAmt:'',dateFrom:'',dateTo:''};

function openSearch(){
  document.getElementById('search-panel').classList.add('open');
  // Build account chips
  const row=document.getElementById('srch-acc-chips');
  row.innerHTML=`<div class="srch-chip act" data-acc="" onclick="setSrchF('accId','')">Tutti</div>`+
    D.accounts.map(a=>`<div class="srch-chip" data-acc="${a.id}" onclick="setSrchF('accId','${a.id}')">${a.emoji} ${a.name}</div>`).join('');
  srchFilters={type:'all',accId:'',minAmt:'',maxAmt:'',dateFrom:'',dateTo:''};
  document.getElementById('srch-inp').value='';
  document.getElementById('srch-min').value='';
  document.getElementById('srch-max').value='';
  document.getElementById('srch-from').value='';
  document.getElementById('srch-to').value='';
  document.querySelectorAll('[data-sf]').forEach(el=>el.classList.toggle('act',el.dataset.sf==='all'));
  document.querySelectorAll('[data-acc]').forEach(el=>el.classList.toggle('act',el.dataset.acc===''));
  runSearch();
  setTimeout(()=>document.getElementById('srch-inp').focus(),200);
}

function closeSearch(){
  document.getElementById('search-panel').classList.remove('open');
}

function setSrchF(key,val){
  srchFilters[key]=val;
  if(key==='type') document.querySelectorAll('[data-sf]').forEach(el=>el.classList.toggle('act',el.dataset.sf===val));
  if(key==='accId') document.querySelectorAll('[data-acc]').forEach(el=>el.classList.toggle('act',el.dataset.acc===val));
  runSearch();
}

function runSearch(){
  const q=(document.getElementById('srch-inp').value||'').toLowerCase().trim();
  const min=parseFloat(document.getElementById('srch-min').value)||null;
  const max=parseFloat(document.getElementById('srch-max').value)||null;
  const from=document.getElementById('srch-from').value||null;
  const to=document.getElementById('srch-to').value||null;
  const f=srchFilters;
  let txs=D.transactions.filter(t=>{
    if(t.type==='transfer-in')return false;
    if(f.type==='expense'&&t.type!=='expense')return false;
    if(f.type==='income'&&t.type!=='income')return false;
    if(f.type==='transfer'&&t.type!=='transfer-out')return false;
    if(f.accId&&t.accountId!==f.accId)return false;
    if(min!==null&&Number(t.amount)<min)return false;
    if(max!==null&&Number(t.amount)>max)return false;
    if(from&&t.date<from)return false;
    if(to&&t.date>to)return false;
    if(q){
      const cat=getCat(t.categoryId,t.type);
      const acc=getAcc(t.accountId);
      const hay=(cat.name+' '+acc.name+' '+(t.note||'')+' '+t.amount).toLowerCase();
      if(!hay.includes(q))return false;
    }
    return true;
  }).sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0));

  const cnt=document.getElementById('srch-count');
  cnt.textContent=txs.length+' risultat'+(txs.length===1?'o':'i');
  const body=document.getElementById('srch-body');
  if(!txs.length){body.innerHTML='<div class="empty"><div class="empty-ic">🔍</div><div class="empty-ttl">Nessun risultato</div><div class="empty-sub">Prova a modificare i filtri</div></div>';return;}
  const grps={};txs.forEach(t=>(grps[t.date]=grps[t.date]||[]).push(t));
  let h='';
  Object.keys(grps).sort((a,b)=>b.localeCompare(a)).forEach(date=>{
    const dl=pDate(date).toLocaleDateString('it-IT',{weekday:'long',day:'2-digit',month:'long'});
    h+=`<div class="tx-dh">${dl}</div><div class="card" style="margin:0 14px 10px;overflow:hidden;"><div class="tx-grp">`+grps[date].map(txHtml).join('')+'</div></div>';
  });
  body.innerHTML=h;
}
