// ── ACCOUNTS SUB ───────────────────────────────────────────────────────────
function renderAccSub(){
  const b=document.getElementById('sub-acc-body');
  if(!D.accounts.length){b.innerHTML='<div class="empty"><div class="empty-ic">🏦</div><div class="empty-ttl">Nessun conto</div><div class="empty-sub">Aggiungi il tuo primo conto</div></div>';return;}
  b.innerHTML='<div class="set-list" style="margin:14px">'+D.accounts.map(a=>`
    <div class="item-row" onclick="openAccSh('${a.id}')">
      <div class="item-ic" style="background:${a.color}22">${a.emoji}</div>
      <div class="item-tx"><div class="item-nm">${a.name}</div><div class="item-sb">Saldo iniziale: ${fmt(a.initialBalance||0)}</div></div>
      <div class="item-val" style="color:${a.color}">${fmt(accBal(a.id))}</div>
    </div>`).join('')+'</div>';
}

let accEditId=null,accEmSel=ACC_EMOJIS[0],accClSel=ACC_COLORS[0];
function openAccSh(id=null){
  accEditId=id;
  const acc=id?D.accounts.find(a=>a.id===id):null;
  document.getElementById('sh-acc-ttl').textContent=id?'Modifica conto':'Nuovo conto';
  document.getElementById('acc-del-btn').style.display=id?'':'none';
  document.getElementById('acc-name').value=acc?acc.name:'';
  document.getElementById('acc-bal').value=acc?acc.initialBalance:'';
  document.getElementById('acc-sym').textContent=getSym();
  accEmSel=acc?acc.emoji:ACC_EMOJIS[0];
  accClSel=acc?acc.color:ACC_COLORS[0];
  document.getElementById('acc-ems').innerHTML=ACC_EMOJIS.map(e=>`<div class="em-opt${e===accEmSel?' sel':''}" onclick="selAccEm('${e}')">${e}</div>`).join('');
  document.getElementById('acc-cls').innerHTML=ACC_COLORS.map(c=>`<div class="cl-dot${c===accClSel?' sel':''}" style="background:${c}" onclick="selAccCl('${c}')"></div>`).join('');
  openOvl('ovl-acc');
}
function selAccEm(e){accEmSel=e;document.querySelectorAll('#acc-ems .em-opt').forEach(el=>el.classList.toggle('sel',el.textContent===e));}
function selAccCl(c){accClSel=c;document.querySelectorAll('#acc-cls .cl-dot').forEach(el=>el.classList.toggle('sel',el.style.background===c||el.style.background===hexToRgb(c)));}
function hexToRgb(hex){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`rgb(${r}, ${g}, ${b})`;}
function saveAcc(){
  const name=document.getElementById('acc-name').value.trim();
  if(!name){toast('⚠️ Inserisci un nome per il conto');return;}
  const bal=parseFloat(document.getElementById('acc-bal').value)||0;
  if(accEditId){
    const acc=D.accounts.find(a=>a.id===accEditId);
    if(acc)Object.assign(acc,{name,emoji:accEmSel,color:accClSel,initialBalance:bal});
  }else{
    D.accounts.push({id:uid(),name,emoji:accEmSel,color:accClSel,initialBalance:bal});
  }
  try{saveData();}catch(e){console.warn(e);}
  closeOvl('ovl-acc');
  try{renderDash();}catch(e){console.warn(e);}
  try{if(curSub==='sub-acc')renderAccSub();}catch(e){console.warn(e);}
  try{renderSettings();}catch(e){console.warn(e);}
  toast(accEditId?'✅ Conto aggiornato':'✅ Conto aggiunto');
}
function delAcc(){
  confirm2('Elimina conto','Le transazioni associate rimarranno ma il conto verrà rimosso.',()=>{
    D.accounts=D.accounts.filter(a=>a.id!==accEditId);
    saveData();closeOvl('ovl-acc');renderAccSub();renderSettings();
    toast('🗑️ Conto eliminato');
  });
}

// ── CATEGORIES SUB ─────────────────────────────────────────────────────────
function renderCatsSub(){
  const b=document.getElementById('sub-cats-body');
  const expCats=D.categories.expense;const incCats=D.categories.income;
  const catRow=(c,type)=>`<div class="item-row" onclick="openCatSh('${c.id}','${type}')">
    <div class="item-ic" style="background:${type==='expense'?'var(--exp-g)':'var(--inc-g)'}">${c.emoji}</div>
    <div class="item-tx"><div class="item-nm">${c.name}</div><div class="item-sb">${c.custom?'Personalizzata':'Predefinita'}</div></div>
    <div style="color:var(--tt);font-size:18px">›</div>
  </div>`;
  b.innerHTML=`
    <div style="padding:14px 14px 4px;font-size:11px;font-weight:700;color:var(--tt);text-transform:uppercase;letter-spacing:.8px">Spese</div>
    <div class="set-list" style="margin:0 14px 14px">${expCats.map(c=>catRow(c,'expense')).join('')}</div>
    <div style="padding:0 14px 4px;font-size:11px;font-weight:700;color:var(--tt);text-transform:uppercase;letter-spacing:.8px">Entrate</div>
    <div class="set-list" style="margin:0 14px">${incCats.map(c=>catRow(c,'income')).join('')}</div>`;
}

let catEditId=null,catType='expense',catEmSel=CAT_EMOJIS[0];
function openCatSh(id=null,type='expense'){
  catEditId=id;catType=type;
  const cat=id?(D.categories.expense.find(c=>c.id===id)||D.categories.income.find(c=>c.id===id)):null;
  document.getElementById('cat-name').value=cat?cat.name:'';
  catEmSel=cat?cat.emoji:CAT_EMOJIS[0];
  catType=id?(D.categories.expense.find(c=>c.id===id)?'expense':'income'):type;
  document.querySelectorAll('#ovl-cat .ty-btn').forEach(b=>b.classList.remove('act'));
  document.getElementById(catType==='expense'?'ct-exp':'ct-inc').classList.add('act');
  // Disable type toggle when editing existing
  document.querySelectorAll('#ovl-cat .ty-btn').forEach(b=>{b.style.opacity=id?'0.5':'1';b.style.pointerEvents=id?'none':'';});
  document.getElementById('cat-del-btn').style.display=id?'':'none';
  document.getElementById('cat-ems').innerHTML=CAT_EMOJIS.map(e=>`<div class="em-opt${e===catEmSel?' sel':''}" onclick="selCatEm('${e}')">${e}</div>`).join('');
  openOvl('ovl-cat');
}
function setCatT(t){catType=t;document.querySelectorAll('#ovl-cat .ty-btn').forEach(b=>b.classList.remove('act'));document.getElementById(t==='expense'?'ct-exp':'ct-inc').classList.add('act');}
function selCatEm(e){catEmSel=e;document.querySelectorAll('#cat-ems .em-opt').forEach(el=>el.classList.toggle('sel',el.textContent===e));}
function saveCat(){
  const name=document.getElementById('cat-name').value.trim();
  if(!name){toast('⚠️ Inserisci un nome');return;}
  if(catEditId){
    const list=D.categories[catType==='expense'?'expense':'income'];
    const c=list.find(x=>x.id===catEditId);
    if(c)Object.assign(c,{name,emoji:catEmSel});
  }else{
    D.categories[catType==='expense'?'expense':'income'].push({id:uid(),name,emoji:catEmSel,custom:true,type:catType});
  }
  saveData();closeOvl('ovl-cat');renderCatsSub();
  if(curScr==='dashboard')renderDash();
  toast(catEditId?'✅ Categoria aggiornata':'✅ Categoria aggiunta');
}
function delCat(){
  const list=D.categories[catType==='expense'?'expense':'income'];
  const cat=list.find(x=>x.id===catEditId);if(!cat)return;
  const count=D.transactions.filter(t=>t.categoryId===catEditId).length;
  confirm2(
    'Elimina categoria',
    `La categoria "${cat.name}" è usata in ${count} transazion${count===1?'e':'i'}. Le transazioni collegate verranno marcate come "Senza categoria".`,
    ()=>{
      D.categories[catType==='expense'?'expense':'income']=list.filter(x=>x.id!==catEditId);
      saveData();closeOvl('ovl-cat');renderCatsSub();
      toast('🗑️ Categoria eliminata');
    }
  );
}

// ── RECURRING SUB ──────────────────────────────────────────────────────────
function renderRecSub(){
  const b=document.getElementById('sub-rec-body');
  const active=D.recurring.filter(r=>r.active);
  if(!active.length){b.innerHTML='<div class="empty"><div class="empty-ic">🔄</div><div class="empty-ttl">Nessuna ricorrente</div><div class="empty-sub">Aggiungi entrate o spese automatiche</div></div>';return;}
  b.innerHTML='<div class="set-list" style="margin:14px">'+active.map(r=>{
    const cat=getCat(r.categoryId,r.type);const acc=getAcc(r.accountId);
    const sign=r.type==='expense'?'-':'+';
    const col=r.type==='expense'?'var(--exp)':'var(--inc)';
    return`<div class="item-row" onclick="openRecSh('${r.id}')">
      <div class="item-ic" style="background:${r.type==='expense'?'var(--exp-g)':'var(--inc-g)'}">${cat.emoji}</div>
      <div class="item-tx"><div class="item-nm">${cat.name}</div><div class="item-sb">${freqLbl(r.frequency)} · ${acc.emoji} ${acc.name}</div></div>
      <div style="text-align:right"><div class="item-val" style="color:${col}">${sign}${fmt(r.amount)}</div></div>
    </div>`;
  }).join('')+'</div>';
}

let recEditId=null,recType='expense';
function openRecSh(id=null){
  recEditId=id;
  const r=id?D.recurring.find(x=>x.id===id):null;
  recType=r?r.type:'expense';
  recSelDay=r?r.dayOfMonth||null:null;
  document.getElementById('sh-rec-ttl').textContent=id?'Modifica ricorrente':'Nuova ricorrente';
  document.getElementById('rec-del-btn').style.display=id?'':'none';
  document.getElementById('rec-title').value=r?r.title||'':'';
  document.getElementById('rec-amt').value=r?r.amount:'';
  document.getElementById('rec-date').value=r?r.startDate:today();
  document.getElementById('rec-note').value=r?r.note||'':'';
  document.getElementById('rec-freq').value=r?r.frequency:'monthly';
  document.getElementById('rec-sym').textContent=getSym();
  document.querySelectorAll('#ovl-rec .ty-btn').forEach(b=>b.classList.remove('act'));
  document.getElementById(recType==='expense'?'rt-exp':'rt-inc').classList.add('act');
  renderRecCats(r?r.categoryId:null);renderRecAccs(r?r.accountId:null);
  updateRecDayPicker(r?r.dayOfMonth||null:null);
  openOvl('ovl-rec');
}
function setRecT(t){recType=t;document.querySelectorAll('#ovl-rec .ty-btn').forEach(b=>b.classList.remove('act'));document.getElementById(t==='expense'?'rt-exp':'rt-inc').classList.add('act');renderRecCats();}
function renderRecCats(selId=null){const cats=recType==='expense'?D.categories.expense:D.categories.income;document.getElementById('rec-cats').innerHTML=cats.map(c=>`<div class="cat-it${selId===c.id?' sel':''}" onclick="selRecCat('${c.id}')"><span class="ce">${c.emoji}</span><span class="cn">${c.name}</span></div>`).join('');}
function selRecCat(id){document.querySelectorAll('#rec-cats .cat-it').forEach(el=>el.classList.toggle('sel',el.getAttribute('onclick').includes("'"+id+"'")));}
function renderRecAccs(selId=null){const first=selId||(D.accounts[0]||{}).id;document.getElementById('rec-accs').innerHTML=D.accounts.map(a=>`<div class="as-it${first===a.id&&!selId||selId===a.id?' sel':''}" onclick="selRecAcc('${a.id}')"><span class="as-ic">${a.emoji}</span><span class="as-nm">${a.name}</span><span class="as-bl">${fmt(accBal(a.id))}</span></div>`).join('');}
function selRecAcc(id){document.querySelectorAll('#rec-accs .as-it').forEach(el=>el.classList.toggle('sel',el.getAttribute('onclick').includes("'"+id+"'")));}
function saveRec(){
  const amt=parseFloat(document.getElementById('rec-amt').value);
  if(!amt||amt<=0){toast('⚠️ Inserisci un importo');return;}
  const catEl=document.querySelector('#rec-cats .cat-it.sel');if(!catEl){toast('⚠️ Seleziona una categoria');return;}
  const accEl=document.querySelector('#rec-accs .as-it.sel');if(!accEl){toast('⚠️ Seleziona un conto');return;}
  const catId=catEl.getAttribute('onclick').match(/'([^']+)'/)[1];
  const accId=accEl.getAttribute('onclick').match(/'([^']+)'/)[1];
  const startDate=document.getElementById('rec-date').value||today();
  const freq=document.getElementById('rec-freq').value;
  const title=document.getElementById('rec-title').value.trim();
  const note=document.getElementById('rec-note').value.trim();
  const dayOfMonth=(freq==='monthly'||freq==='yearly')&&recSelDay?recSelDay:null;
  if(recEditId){
    const r=D.recurring.find(x=>x.id===recEditId);
    if(r)Object.assign(r,{type:recType,amount:amt,categoryId:catId,accountId:accId,startDate,frequency:freq,title,note,dayOfMonth});
  }else{
    let firstNext=startDate;
    if(dayOfMonth){
      const sd=new Date(startDate+'T00:00:00');
      const last=new Date(sd.getFullYear(),sd.getMonth()+1,0).getDate();
      sd.setDate(Math.min(dayOfMonth,last));
      firstNext=sd.toISOString().split('T')[0];
    }
    D.recurring.push({id:uid(),type:recType,amount:amt,categoryId:catId,accountId:accId,startDate,nextDate:firstNext,frequency:freq,title,note,dayOfMonth,active:true});
    processRec();
  }
  saveData();closeOvl('ovl-rec');renderRecSub();renderSettings();
  toast(recEditId?'✅ Ricorrente aggiornata':'✅ Ricorrente aggiunta');
}
function delRec(){
  confirm2('Elimina ricorrente','Non verranno generate nuove transazioni.',()=>{
    D.recurring=D.recurring.filter(r=>r.id!==recEditId);
    saveData();closeOvl('ovl-rec');renderRecSub();renderSettings();
    toast('🗑️ Ricorrente eliminata');
  });
}

// ── BUDGET SUB ─────────────────────────────────────────────────────────────
function renderBgtSub(){
  const b=document.getElementById('sub-bgt-body');
  const s=D.settings;
  b.innerHTML=`<div class="fs">
    <div style="font-size:13px;color:var(--ts);line-height:1.5">Imposta un limite di spesa mensile. Riceverai un avviso visivo quando ti avvicini al limite.</div>
    <div class="fg" style="flex-direction:row;align-items:center;gap:12px;padding:14px;background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);">
      <div style="flex:1"><div style="font-size:14px;font-weight:700">Budget attivo</div><div style="font-size:11px;color:var(--tt)">Mostra barra di avanzamento</div></div>
      <div class="sw ${s.budgetEnabled?'on':''}" id="bgt-sw" onclick="togBgt()"><div class="sw-k"></div></div>
    </div>
    <div class="fg"><div class="flbl">Importo mensile</div>
      <div class="ai-wrap"><span class="ai-sym">${getSym()}</span><input type="number" class="fi ai" id="bgt-amt" placeholder="0,00" step="0.01" inputmode="decimal" value="${s.budgetMonthly||''}"></div>
    </div>
    <button class="btn btn-p" onclick="saveBgt()">Salva budget</button>
    ${s.budgetMonthly?`<button class="btn btn-d" onclick="clearBgt()">Rimuovi budget</button>`:''}
  </div>`;
}
function togBgt(){
  D.settings.budgetEnabled=!D.settings.budgetEnabled;saveData();
  document.getElementById('bgt-sw').className='sw'+(D.settings.budgetEnabled?' on':'');
}
function saveBgt(){
  const amt=parseFloat(document.getElementById('bgt-amt').value);
  if(amt&&amt>0)D.settings.budgetMonthly=amt;
  saveData();renderSettings();toast('✅ Budget salvato');
}
function clearBgt(){D.settings.budgetMonthly=null;D.settings.budgetEnabled=false;saveData();renderBgtSub();renderSettings();toast('🗑️ Budget rimosso');}

// ── CURRENCY SUB ───────────────────────────────────────────────────────────
function renderCurrSub(){
  const b=document.getElementById('sub-curr-body');
  b.innerHTML='<div class="set-list" style="margin:14px">'+CURRENCIES.map(c=>`
    <div class="item-row" onclick="setCurr('${c.code}')">
      <div class="item-ic" style="background:var(--wrn-g);font-size:14px;font-weight:700">${c.sym}</div>
      <div class="item-tx"><div class="item-nm">${c.name}</div><div class="item-sb">${c.code}</div></div>
      ${D.settings.currency===c.code?'<div style="color:var(--acc);font-size:20px">✓</div>':''}
    </div>`).join('')+'</div>';
}
function setCurr(code){D.settings.currency=code;saveData();renderCurrSub();renderSettings();toast('✅ Valuta aggiornata');}

// ── PIN SUB ────────────────────────────────────────────────────────────────
function renderPinSub(){
  const b=document.getElementById('sub-pin-body');
  const curLen=getPinLen();
  const ph4='••••';const ph6='••••••';
  b.innerHTML=`<div class="fs">
    <div style="font-size:13px;color:var(--ts);line-height:1.5">Modifica il PIN di accesso. Puoi scegliere tra 4 e 6 cifre.</div>
    <div class="fg"><div class="flbl">Lunghezza PIN</div>
      <div class="ty-tog">
        <div class="ty-btn${curLen===4?' act income':''}" onclick="setPinLen(4)">4 cifre</div>
        <div class="ty-btn${curLen===6?' act income':''}" onclick="setPinLen(6)">6 cifre</div>
      </div>
    </div>
    <div class="fg"><div class="flbl">PIN attuale</div><input type="password" class="fi" id="pin-old" placeholder="${curLen===4?ph4:ph6}" maxlength="${curLen}" inputmode="numeric" pattern="[0-9]*"></div>
    <div class="fg"><div class="flbl">Nuovo PIN</div><input type="password" class="fi" id="pin-new" placeholder="${curLen===4?ph4:ph6}" maxlength="${curLen}" inputmode="numeric" pattern="[0-9]*"></div>
    <div class="fg"><div class="flbl">Conferma PIN</div><input type="password" class="fi" id="pin-conf" placeholder="${curLen===4?ph4:ph6}" maxlength="${curLen}" inputmode="numeric" pattern="[0-9]*"></div>
    <button class="btn btn-p" onclick="savePin()">Aggiorna PIN</button>
    <div style="margin-top:10px;padding:12px 14px;background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r);display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:13px;font-weight:700">PIN attivo</div><div style="font-size:11px;color:var(--ts)">Disattiva per aprire senza PIN</div></div>
      <div class="sw${D.settings.pinEnabled!==false?' on':''}" id="pin-enabled-sw" onclick="togPinEnabled()" style="flex-shrink:0"></div>
    </div>
  </div>`;
}
function setPinLen(len){
  // Store desired length as pending — actual change happens when new PIN is saved
  document.querySelectorAll('#sub-pin-body .ty-btn').forEach((b,i)=>{
    b.classList.toggle('act',i===(len===4?0:1));
    b.classList.toggle('income',i===(len===4?0:1));
  });
  const ph=len===4?'••••':'••••••';
  ['pin-old','pin-new','pin-conf'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.placeholder=ph;el.maxLength=len;}
  });
  document.getElementById('pin-old').dataset.targetLen=len;
}
function savePin(){
  const oldEl=document.getElementById('pin-old');
  const nw=document.getElementById('pin-new').value;
  const cf=document.getElementById('pin-conf').value;
  const old=oldEl.value;
  const targetLen=parseInt(oldEl.dataset.targetLen)||getPinLen();
  if(old!==D.settings.pin){toast('⚠️ PIN attuale errato');return;}
  if((nw.length!==4&&nw.length!==6)||!/^\d+$/.test(nw)){toast('⚠️ Il PIN deve essere di 4 o 6 cifre');return;}
  if(nw!==cf){toast('⚠️ I PIN non coincidono');return;}
  D.settings.pin=nw;saveData();toast('✅ PIN aggiornato a '+nw.length+' cifre');goBack();
}

// ── SETTINGS RENDER ────────────────────────────────────────────────────────
function renderSettings(){
  const ds=document.getElementById('s-drive');
  const da=document.getElementById('s-drive-arr');
  if(ds){
    if(driveConnected){ds.textContent='Connesso · Sincronizzazione automatica';if(da)da.style.color='var(--inc)';}
    else{ds.textContent='Non connesso — Tocca per connettere';if(da)da.style.color='';}
  }
  document.getElementById('s-accs').textContent=D.accounts.length+' conti';
  const sc=document.getElementById('s-contacts');if(sc)sc.textContent=(D.contacts||[]).length+' contatti';
  document.getElementById('s-recs').textContent=D.recurring.filter(r=>r.active).length+' attive';
  const c=CURRENCIES.find(x=>x.code===D.settings.currency)||CURRENCIES[0];
  document.getElementById('s-curr').textContent=c.sym+' '+c.code;
  document.getElementById('s-pin').textContent=D.settings.pin?'PIN attivo ('+getPinLen()+' cifre)':'PIN non impostato';
  const sp=document.getElementById('s-profile');
  if(sp){const p=D.profile||{};sp.textContent=(p.firstName||p.lastName)?(p.firstName+' '+p.lastName).trim():'Non compilata';}
  document.getElementById('s-bgt').textContent=D.settings.budgetEnabled&&D.settings.budgetMonthly?fmt(D.settings.budgetMonthly)+'/mese':'Non impostato';
}

// ── EXPORT ─────────────────────────────────────────────────────────────────
function doExportCSV(){
  const rows=[['Data','Tipo','Categoria','Conto','Importo','Note']];
  D.transactions.sort((a,b)=>b.date.localeCompare(a.date)).forEach(t=>{
    const cat=getCat(t.categoryId,t.type);const acc=getAcc(t.accountId);
    rows.push([t.date,t.type==='expense'?'Spesa':'Entrata',cat.name,acc.name,fmtN(t.amount),t.note||'']);
  });
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  dlFile('finanza_export_'+today()+'.csv','data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv));
  toast('✅ CSV esportato');
}
function doExportPDF(){
  const{inc,exp}=moTotals();const net=inc-exp;
  const rows=D.transactions.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,50).map(t=>{
    const cat=getCat(t.categoryId,t.type);const acc=getAcc(t.accountId);
    const sign=t.type==='expense'?'-':'+';const col=t.type==='expense'?'#ff453a':'#30d158';
    return`<tr><td>${t.date}</td><td>${cat.emoji} ${cat.name}</td><td>${acc.emoji} ${acc.name}</td><td style="color:${col};font-weight:700;text-align:right">${sign}${getSym()}${fmtN(t.amount)}</td><td style="color:#888">${t.note||''}</td></tr>`;
  }).join('');
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>PECUNIA – Report</title>
  <style>body{font-family:sans-serif;color:#111;padding:30px}h1{font-size:24px;margin-bottom:4px}
  .sub{color:#888;font-size:13px;margin-bottom:24px}.stats{display:flex;gap:20px;margin-bottom:24px}
  .stat{background:#f5f5f5;border-radius:10px;padding:14px 20px}
  .stat-lbl{font-size:11px;color:#888;text-transform:uppercase}
  .stat-val{font-size:20px;font-weight:800}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;padding:8px 10px;background:#f5f5f5;font-size:11px;text-transform:uppercase;color:#888}
  td{padding:8px 10px;border-bottom:1px solid #eee}
  </style></head><body>
  <h1>🪙 PECUNIA – Report</h1>
  <div class="sub">Generato il ${new Date().toLocaleDateString('it-IT',{day:'2-digit',month:'long',year:'numeric'})}</div>
  <div class="stats">
    <div class="stat"><div class="stat-lbl">Patrimonio netto</div><div class="stat-val">${fmt(totalBal())}</div></div>
    <div class="stat"><div class="stat-lbl">Entrate (mese)</div><div class="stat-val" style="color:#30d158">${fmt(inc)}</div></div>
    <div class="stat"><div class="stat-lbl">Uscite (mese)</div><div class="stat-val" style="color:#ff453a">${fmt(exp)}</div></div>
    <div class="stat"><div class="stat-lbl">Netto (mese)</div><div class="stat-val" style="color:${net>=0?'#30d158':'#ff453a'}">${net>=0?'+':''}${fmt(net)}</div></div>
  </div>
  <table><thead><tr><th>Data</th><th>Categoria</th><th>Conto</th><th style="text-align:right">Importo</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table>
  </body></html>`;
  const win=window.open('','_blank');
  if(win){win.document.write(html);win.document.close();setTimeout(()=>win.print(),500);}
  else toast('⚠️ Abilita i popup per esportare il PDF');
}
function dlFile(name,data){const a=document.createElement('a');a.href=data;a.download=name;a.click();}

// ── DELETE ALL ─────────────────────────────────────────────────────────────
function askDeleteAll(){
  const allFileIds=[];
  (D.transactions||[]).forEach(tx=>getTxReceiptFileIds(tx).forEach(id=>allFileIds.push(id)));
  const photoCount=allFileIds.length;
  const photoNote=photoCount>0?' Verranno eliminate anche '+photoCount+' foto da Drive.':'';
  confirm2(
    'Cancella tutti i dati',
    'Questa azione è irreversibile. Tutte le transazioni, i conti e le impostazioni verranno eliminati.'+photoNote,
    ()=>{
      if(photoCount>0){
        confirmDeleteReceiptsFromDrive(allFileIds,()=>{localStorage.removeItem(SK);location.reload();});
      }else{
        localStorage.removeItem(SK);location.reload();
      }
    }
  );
}

// ── PIN OPTIONAL ──────────────────────────────────────────────────────────
function togPinEnabled(){
  if(!D.settings.pin){toast('Imposta prima un PIN');return;}
  D.settings.pinEnabled=!D.settings.pinEnabled;
  const sw=document.getElementById('pin-enabled-sw');
  if(sw)sw.className='sw'+(D.settings.pinEnabled?' on':'');
  saveData();
  toast(D.settings.pinEnabled?'PIN attivato':'PIN disattivato');
}
function onbEnablePin(){
  document.getElementById('ovl-onboarding').style.display='none';
  D.settings.pinEnabled=true;saveData();
  showScr('settings');setTimeout(()=>navigate('sub-pin'),300);
}
function onbSkipPin(){
  document.getElementById('ovl-onboarding').style.display='none';
  D.settings.pinEnabled=false;saveData();
}
function showPinOnboarding(){
  if(D.settings.pinEnabled===undefined){
    document.getElementById('ovl-onboarding').style.display='flex';
    const tb=document.getElementById('onb-tour-box');if(tb)tb.style.display='none';
    const pb=document.getElementById('onb-pin-box');if(pb)pb.style.display='';
  }
}

// ── DAY PICKER ────────────────────────────────────────────────────────────
let recSelDay=null;
function updateRecDayPicker(selDay){
  const freq=document.getElementById('rec-freq').value;
  const sec=document.getElementById('rec-day-sec');
  if(freq==='monthly'||freq==='yearly'){
    sec.style.display='';
    renderRecDayGrid(selDay!==undefined?selDay:recSelDay);
  }else{
    sec.style.display='none';
    recSelDay=null;
  }
}
function renderRecDayGrid(selDay){
  recSelDay=(selDay!==undefined)?selDay:recSelDay;
  const grid=document.getElementById('rec-day-grid');if(!grid)return;
  let out='';
  for(let d=1;d<=31;d++){
    out+='<div class="day-cell'+(recSelDay===d?' sel':'')+'" onclick="selRecDay('+d+')">'+d+'</div>';
  }
  grid.innerHTML=out;
}
function selRecDay(d){recSelDay=(recSelDay===d)?null:d;renderRecDayGrid();}
