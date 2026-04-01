// ── TRANSACTIONS ───────────────────────────────────────────────────────────
let txFilter='all',txPrdOff=0;
function setTxF(f){txFilter=f;document.querySelectorAll('.fchip').forEach(el=>el.classList.toggle('act',el.dataset.f===f));renderTxList();}
function txPrev(){txPrdOff--;renderTxList();}
function txNext(){txPrdOff++;renderTxList();}
function togFutureRec(){
  D.settings.showFutureRec=!D.settings.showFutureRec;
  saveData();
  const chip=document.getElementById('fchip-future');
  if(chip)chip.classList.toggle('act',D.settings.showFutureRec);
  renderTxList();
}
function getFutureRec(start,end){
  const td=today();
  const futures=[];
  (D.recurring||[]).forEach(r=>{
    if(!r.active)return;
    let next=r.nextDate||r.startDate;
    const endStr=end.toISOString().split('T')[0];
    const startStr=start.toISOString().split('T')[0];
    let safety=0;
    while(next<=endStr&&safety<200){
      safety++;
      if(next>td&&next>=startStr){
        futures.push({
          id:'future_'+r.id+'_'+next,
          type:r.type,amount:r.amount,
          categoryId:r.categoryId,accountId:r.accountId,
          date:next,note:(r.title||r.note||'')+(r.title||r.note?' · ':'')+'Prevista',
          isFuture:true,createdAt:0,receipts:[]
        });
      }
      next=nextDateRec(next,r.frequency,r.dayOfMonth||null);
    }
  });
  return futures;
}

function renderTxList(){
  const{start,end}=getMo(txPrdOff);
  document.getElementById('tx-prd-lbl').textContent=moLbl({start,end});
  // Update future chip state
  const chip=document.getElementById('fchip-future');
  if(chip)chip.classList.toggle('act',!!D.settings.showFutureRec);
  let txs=D.transactions.filter(t=>{
    if(!inRng(t.date,start,end))return false;
    if(txFilter==='transfer'&&t.type!=='transfer-out')return false;
    if(txFilter==='expense'&&t.type!=='expense')return false;
    if(txFilter==='income'&&t.type!=='income')return false;
    if(txFilter==='all'&&t.type==='transfer-in')return false;
    return true;
  });
  // Add future recurring if toggle is on
  if(D.settings.showFutureRec){
    const futures=getFutureRec(start,end).filter(f=>{
      if(txFilter==='expense')return f.type==='expense';
      if(txFilter==='income')return f.type==='income';
      if(txFilter==='transfer')return false;
      return true;
    });
    txs=[...txs,...futures];
  }
  txs.sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0));
  const c=document.getElementById('tx-list');
  if(!txs.length){c.innerHTML='<div class="empty"><div class="empty-ic">🗂️</div><div class="empty-ttl">Nessuna transazione</div><div class="empty-sub">Non ci sono movimenti in questo periodo</div></div>';return;}
  const grps={};txs.forEach(t=>(grps[t.date]=grps[t.date]||[]).push(t));
  let html='';
  Object.keys(grps).sort((a,b)=>b.localeCompare(a)).forEach(date=>{
    const dl=pDate(date).toLocaleDateString('it-IT',{weekday:'long',day:'2-digit',month:'long'});
    html+=`<div class="tx-dh">${dl}</div><div class="card" style="margin:0 14px 10px;overflow:hidden;"><div class="tx-grp">`+grps[date].map(txHtml).join('')+'</div></div>';
  });
  c.innerHTML=html;
}

// ── TX FORM ────────────────────────────────────────────────────────────────
let txEditId=null,txType='expense',txRecOn=false;
function openTxSh(){
  txEditId=null;txType='expense';txRecOn=false;
  document.getElementById('sh-tx-ttl').textContent='Nuova transazione';
  document.getElementById('tx-del-btn').style.display='none';
  document.getElementById('tx-amt').value='';
  document.getElementById('tx-note').value='';
  document.getElementById('tx-date').value=today();
  document.getElementById('tx-rec-sw').className='sw';
  document.getElementById('tx-rec-opts').style.display='none';
  document.getElementById('tx-rec-freq').value='monthly';
  document.querySelectorAll('.ty-btn').forEach(b=>b.classList.remove('act'));
  document.getElementById('ty-exp').classList.add('act');
  document.getElementById('tx-sym').textContent=getSym();
  renderTxCats();renderTxAccs();
  renderReceiptThumbs('tx',[]);
  openOvl('ovl-tx');
}
function openEditTx(id){
  const tx=D.transactions.find(t=>t.id===id);if(!tx)return;
  txEditId=id;txType=tx.type;txRecOn=false;
  document.getElementById('sh-tx-ttl').textContent='Modifica transazione';
  document.getElementById('tx-del-btn').style.display='';
  document.getElementById('tx-amt').value=tx.amount;
  document.getElementById('tx-note').value=tx.note||'';
  document.getElementById('tx-date').value=tx.date;
  document.getElementById('tx-rec-sw').className='sw';
  document.getElementById('tx-rec-opts').style.display='none';
  document.getElementById('tx-sym').textContent=getSym();
  document.querySelectorAll('.ty-btn').forEach(b=>b.classList.remove('act'));
  document.getElementById(txType==='expense'?'ty-exp':'ty-inc').classList.add('act');
  renderTxCats(tx.categoryId);renderTxAccs(tx.accountId);
  renderReceiptThumbs('tx', tx.receipts||[]);
  openOvl('ovl-tx');
}
function setTxType(t){
  txType=t;
  document.querySelectorAll('.ty-btn').forEach(b=>b.classList.remove('act'));
  document.getElementById(t==='expense'?'ty-exp':'ty-inc').classList.add('act');
  renderTxCats();
}
function togRecSw(){txRecOn=!txRecOn;document.getElementById('tx-rec-sw').className='sw'+(txRecOn?' on':'');document.getElementById('tx-rec-opts').style.display=txRecOn?'':'none';}
function renderTxCats(selId=null){
  const cats=txType==='expense'?D.categories.expense:D.categories.income;
  document.getElementById('tx-cats').innerHTML=cats.map(c=>`<div class="cat-it${selId===c.id?' sel':''}" onclick="selTxCat('${c.id}')"><span class="ce">${c.emoji}</span><span class="cn">${c.name}</span></div>`).join('');
}
function selTxCat(id){document.querySelectorAll('#tx-cats .cat-it').forEach(el=>el.classList.toggle('sel',el.getAttribute('onclick').includes("'"+id+"'")));}
function renderTxAccs(selId=null){
  const first=selId||(D.accounts[0]||{}).id;
  document.getElementById('tx-accs').innerHTML=D.accounts.map(a=>`<div class="as-it${first===a.id&&!selId||selId===a.id?' sel':''}" onclick="selTxAcc('${a.id}')"><span class="as-ic">${a.emoji}</span><span class="as-nm">${a.name}</span><span class="as-bl">${fmt(accBal(a.id))}</span></div>`).join('');
}
function selTxAcc(id){document.querySelectorAll('#tx-accs .as-it').forEach(el=>el.classList.toggle('sel',el.getAttribute('onclick').includes("'"+id+"'")));}
function saveTx(){
  const amt=parseFloat(document.getElementById('tx-amt').value);
  if(!amt||amt<=0){toast('⚠️ Inserisci un importo valido');return;}
  const catEl=document.querySelector('#tx-cats .cat-it.sel');
  if(!catEl){toast('⚠️ Seleziona una categoria');return;}
  const accEl=document.querySelector('#tx-accs .as-it.sel');
  if(!accEl){toast('⚠️ Seleziona un conto');return;}
  const catId=catEl.getAttribute('onclick').match(/'([^']+)'/)[1];
  const accId=accEl.getAttribute('onclick').match(/'([^']+)'/)[1];
  const date=document.getElementById('tx-date').value||today();
  const note=document.getElementById('tx-note').value.trim();
  const pendingRcpts=window._pendingReceipts||[];
  if(txEditId){
    const tx=D.transactions.find(t=>t.id===txEditId);
    if(tx){Object.assign(tx,{type:txType,amount:amt,categoryId:catId,accountId:accId,date,note,receipts:tx.receipts||[]});
      if(pendingRcpts.length)tx.receipts.push(...pendingRcpts);}
  }else{
    if(txRecOn){
      const freq=document.getElementById('tx-rec-freq').value;
      D.recurring.push({id:uid(),type:txType,amount:amt,categoryId:catId,accountId:accId,startDate:date,nextDate:date,frequency:freq,note,active:true});
      processRec();
    }else{
      D.transactions.push({id:uid(),type:txType,amount:amt,categoryId:catId,accountId:accId,date,note,receipts:pendingRcpts,createdAt:Date.now()});
    }
  }
  window._pendingReceipts=[];
  try{saveData();}catch(e){console.warn(e);}
  closeOvl('ovl-tx');
  if(curScr==='dashboard')renderDash();
  if(curScr==='transactions')renderTxList();
  toast(txEditId?'✅ Transazione aggiornata':'✅ Transazione salvata');
}
function delTx(){
  confirm2('Elimina transazione','Sei sicuro di voler eliminare questa transazione?',()=>{
    const tx=D.transactions.find(t=>t.id===txEditId);
    const fileIds=getTxReceiptFileIds(tx);
    D.transactions=D.transactions.filter(t=>t.id!==txEditId);
    saveData();closeOvl('ovl-tx');
    if(curScr==='dashboard')renderDash();
    if(curScr==='transactions')renderTxList();
    toast('🗑️ Transazione eliminata');
    if(fileIds.length>0)confirmDeleteReceiptsFromDrive(fileIds,()=>{saveData();driveSetStatus(driveConnected?'connected':'disconnected');});
  });
}

// ── FAB MENU ───────────────────────────────────────────────────────────────
function togFabMenu(){
  const menu=document.getElementById('fab-menu');
  const bg=document.getElementById('fab-bg');
  const fab=document.getElementById('fab');
  const isOpen=menu.classList.contains('open');
  if(isOpen){closeFabMenu();}else{menu.classList.add('open');bg.classList.add('open');fab.classList.add('rot');}
}
function closeFabMenu(){
  document.getElementById('fab-menu').classList.remove('open');
  document.getElementById('fab-bg').classList.remove('open');
  document.getElementById('fab').classList.remove('rot');
}
function openTxShType(type){openTxSh();setTxType(type);}

// ── TRANSFER ───────────────────────────────────────────────────────────────
let trEditGroupId=null;
function openTrSh(groupId=null){
  trEditGroupId=groupId;
  document.getElementById('sh-tr-ttl').textContent=groupId?'Modifica trasferimento':'Trasferimento';
  document.getElementById('tr-del-btn').style.display=groupId?'':'none';
  document.getElementById('tr-sym').textContent=getSym();
  document.getElementById('tr-note').value='';
  document.getElementById('tr-date').value=today();
  document.getElementById('tr-amt').value='';
  if(groupId){
    const txOut=D.transactions.find(t=>t.transferGroupId===groupId&&t.type==='transfer-out');
    if(txOut){
      document.getElementById('tr-amt').value=txOut.amount;
      document.getElementById('tr-date').value=txOut.date;
      document.getElementById('tr-note').value=txOut.note||'';
    }
  }
  renderTrAccs('from',groupId);
  renderTrAccs('to',groupId);
  openOvl('ovl-tr');
}
function openEditTr(groupId){
  // Close any open overlays first
  document.querySelectorAll('.ovl.open').forEach(o=>o.classList.remove('open'));
  setTimeout(()=>openTrSh(groupId),60);
}
function renderTrAccs(side,groupId){
  const id='tr-'+side;
  let selId=null;
  if(groupId){
    const txOut=D.transactions.find(t=>t.transferGroupId===groupId&&t.type==='transfer-out');
    if(txOut){selId=side==='from'?txOut.accountId:txOut.toAccountId;}
  }else{
    selId=side==='from'?(D.accounts[0]||{}).id:(D.accounts[1]||D.accounts[0]||{}).id;
  }
  document.getElementById(id).innerHTML=D.accounts.map(a=>`
    <div class="as-it${selId===a.id?' sel':''}" onclick="selTrAcc('${side}','${a.id}')">
      <span class="as-ic">${a.emoji}</span>
      <span class="as-nm">${a.name}</span>
      <span class="as-bl">${fmt(accBal(a.id))}</span>
    </div>`).join('');
}
function selTrAcc(side,id){
  document.querySelectorAll(`#tr-${side} .as-it`).forEach(el=>el.classList.toggle('sel',el.getAttribute('onclick').includes("'"+id+"'")));
}
function saveTr(){
  const amt=parseFloat(document.getElementById('tr-amt').value);
  if(!amt||amt<=0){toast('⚠️ Inserisci un importo valido');return;}
  const fromEl=document.querySelector('#tr-from .as-it.sel');
  const toEl=document.querySelector('#tr-to .as-it.sel');
  if(!fromEl){toast('⚠️ Seleziona il conto di partenza');return;}
  if(!toEl){toast('⚠️ Seleziona il conto di destinazione');return;}
  const fromId=fromEl.getAttribute('onclick').match(/'([^']+)'/)[1].replace('from','').replace(/^,/,'');
  const toId=toEl.getAttribute('onclick').match(/'([^']+)'/)[1].replace('to','').replace(/^,/,'');
  // extract IDs properly
  const fromMatch=fromEl.getAttribute('onclick').match(/selTrAcc\('from','([^']+)'\)/);
  const toMatch=toEl.getAttribute('onclick').match(/selTrAcc\('to','([^']+)'\)/);
  if(!fromMatch||!toMatch){toast('⚠️ Errore nella selezione');return;}
  const fId=fromMatch[1],tId=toMatch[1];
  if(fId===tId){toast('⚠️ I conti devono essere diversi');return;}
  const date=document.getElementById('tr-date').value||today();
  const note=document.getElementById('tr-note').value.trim();
  if(trEditGroupId){
    // update existing
    D.transactions=D.transactions.filter(t=>t.transferGroupId!==trEditGroupId);
  }
  const gid=trEditGroupId||uid();
  D.transactions.push({id:uid(),type:'transfer-out',amount:amt,accountId:fId,toAccountId:tId,transferGroupId:gid,date,note,createdAt:Date.now()});
  D.transactions.push({id:uid(),type:'transfer-in',amount:amt,accountId:tId,fromAccountId:fId,transferGroupId:gid,date,note,createdAt:Date.now()});
  saveData();closeOvl('ovl-tr');
  if(curScr==='dashboard')renderDash();
  if(curScr==='transactions')renderTxList();
  toast(trEditGroupId?'✅ Trasferimento aggiornato':'✅ Trasferimento eseguito');
  trEditGroupId=null;
}
function delTr(){
  confirm2('Elimina trasferimento','Verranno rimosse entrambe le voci collegate.',()=>{
    D.transactions=D.transactions.filter(t=>t.transferGroupId!==trEditGroupId);
    saveData();closeOvl('ovl-tr');
    if(curScr==='dashboard')renderDash();
    if(curScr==='transactions')renderTxList();
    toast('🗑️ Trasferimento eliminato');
    trEditGroupId=null;
  });
}

// ── CALCULATOR ─────────────────────────────────────────────────────────────
let calcTarget=null,calcExpr='',calcDisplay='0';
function openCalc(targetId){
  calcTarget=targetId;calcExpr='';calcDisplay='0';
  document.getElementById('calc-expr').textContent='';
  document.getElementById('calc-val').textContent='0';
  openOvl('ovl-calc');
}
function calcInput(ch){
  if(calcExpr==='Error')calcExpr='';
  // prevent double operators
  const ops=['÷','×','+','-'];
  const last=calcExpr.slice(-1);
  if(ops.includes(ch)&&ops.includes(last))calcExpr=calcExpr.slice(0,-1);
  calcExpr+=ch;
  calcDisplay=calcExpr;
  try{
    const preview=evalCalc(calcExpr);
    if(!isNaN(preview)&&isFinite(preview))calcDisplay=fmtN(preview);
  }catch(e){}
  document.getElementById('calc-expr').textContent=calcExpr;
  document.getElementById('calc-val').textContent=calcDisplay;
}
function calcDel(){
  if(calcExpr==='Error'){calcExpr='';calcDisplay='0';}
  else calcExpr=calcExpr.slice(0,-1);
  if(!calcExpr)calcDisplay='0';
  else{try{const v=evalCalc(calcExpr);if(!isNaN(v)&&isFinite(v))calcDisplay=fmtN(v);else calcDisplay=calcExpr;}catch(e){calcDisplay=calcExpr;}}
  document.getElementById('calc-expr').textContent=calcExpr;
  document.getElementById('calc-val').textContent=calcDisplay;
}
function calcClear(){
  calcExpr='';calcDisplay='0';
  document.getElementById('calc-expr').textContent='';
  document.getElementById('calc-val').textContent='0';
}
function evalCalc(expr){
  // Replace display symbols with JS operators, handle %
  let e=expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
  // Handle percentage: number% → number/100
  e=e.replace(/(\d+\.?\d*)%/g,'($1/100)');
  // eslint-disable-next-line no-new-func
  return Function('"use strict";return ('+e+')')();
}
function calcEquals(){
  try{
    const result=evalCalc(calcExpr);
    if(isNaN(result)||!isFinite(result)){calcExpr='Error';calcDisplay='Error';}
    else{
      const rounded=Math.round(result*100)/100;
      if(calcTarget){
        const el=document.getElementById(calcTarget);
        if(el){el.value=rounded;el.dispatchEvent(new Event('input'));}
      }
      closeOvl('ovl-calc');
      calcExpr='';calcDisplay='0';
      return;
    }
  }catch(e){calcExpr='Error';calcDisplay='Errore';}
  document.getElementById('calc-expr').textContent=calcExpr;
  document.getElementById('calc-val').textContent=calcDisplay;
}
