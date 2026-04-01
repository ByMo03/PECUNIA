// ── GROUPS TAB ─────────────────────────────────────────────────────────────
let grpTab='debts';
function setGrpTab(t){
  grpTab=t;
  document.querySelectorAll('.fchip[data-gt]').forEach(el=>el.classList.toggle('act',el.dataset.gt===t));
  renderGroups();
}
function renderGroups(){
  renderGrpSummary();
  const body=document.getElementById('grp-body');
  if(grpTab==='debts')renderDebts(body);
  else if(grpTab==='groups')renderGrpList(body,false);
  else renderGrpList(body,true);
}
function renderGrpSummary(){
  const el=document.getElementById('grp-summary-row');if(!el)return;
  const debts=D.debts||[];
  const open=debts.filter(d=>!d.settled||(d.amount-d.paid)>0.001);
  const iOwe=open.filter(d=>d.direction==='owe').reduce((s,d)=>s+(d.amount-(d.paid||0)),0);
  const owedMe=open.filter(d=>d.direction==='owed').reduce((s,d)=>s+(d.amount-(d.paid||0)),0);
  const grpOpen=(D.groups||[]).filter(g=>!g.archived).length;
  el.innerHTML=`<div class="grp-summary">
    <div class="grp-sum-card"><div class="grp-sum-lbl">Mi devono</div><div class="grp-sum-val pos">${fmt(owedMe)}</div></div>
    <div class="grp-sum-card"><div class="grp-sum-lbl">Devo</div><div class="grp-sum-val neg">${fmt(iOwe)}</div></div>
    <div class="grp-sum-card"><div class="grp-sum-lbl">Gruppi attivi</div><div class="grp-sum-val">${grpOpen}</div></div>
  </div>`;
}

// ── DEBTS ──────────────────────────────────────────────────────────────────
let debtEditId=null,debtDir='owed';
function renderDebts(body){
  const debts=(D.debts||[]).filter(d=>(d.amount-(d.paid||0))>0.001);
  const fab=`<div style="margin:14px 14px 0"><button class="btn btn-p" onclick="openDebtSh()">+ Nuovo debito</button></div>`;
  if(!debts.length){body.innerHTML=fab+'<div class="empty"><div class="empty-ic">💸</div><div class="empty-ttl">Nessun debito aperto</div><div class="empty-sub">Aggiungi chi ti deve o chi devi</div></div>';return;}
  const owed=debts.filter(d=>d.direction==='owed');
  const owe=debts.filter(d=>d.direction==='owe');
  let html=fab;
  if(owed.length){
    html+=`<div class="tx-dh" style="margin-top:8px">Mi devono</div>`;
    html+=owed.map(d=>debtCard(d)).join('');
  }
  if(owe.length){
    html+=`<div class="tx-dh" style="margin-top:8px">Devo a</div>`;
    html+=owe.map(d=>debtCard(d)).join('');
  }
  body.innerHTML=html;
}
function debtCard(d){
  const rem=d.amount-(d.paid||0);
  const col=d.direction==='owed'?'var(--inc)':'var(--exp)';
  const pct=Math.round((d.paid||0)/d.amount*100);
  return`<div class="grp-card">
    <div class="grp-card-hdr" onclick="openDebtSh('${d.id}')">
      <div class="grp-card-ic" style="background:${d.direction==='owed'?'var(--inc-g)':'var(--exp-g)'}">${d.direction==='owed'?'📥':'📤'}</div>
      <div class="grp-card-info">
        <div class="grp-card-nm">${d.person}</div>
        <div class="grp-card-sub">${d.note||'Nessuna nota'}${d.paid>0?' · Saldato parzialmente ('+pct+'%)':''}</div>
      </div>
      <div class="grp-card-bal" style="color:${col}">${fmt(rem)}</div>
    </div>
    <div class="grp-card-body">
      <button class="btn btn-p" style="padding:9px" onclick="openSettleSh('${d.id}')">💳 Salda</button>
    </div>
  </div>`;
}
function openDebtSh(id=null){
  debtEditId=id;
  const d=id?D.debts.find(x=>x.id===id):null;
  debtDir=d?d.direction:'owed';
  document.getElementById('sh-debt-ttl').textContent=id?'Modifica debito':'Nuovo debito';
  document.getElementById('debt-del-btn').style.display=id?'':'none';
  document.getElementById('debt-person').value=d?d.person:'';
  document.getElementById('debt-amt').value=d?d.amount:'';
  document.getElementById('debt-note').value=d?d.note||'':'';
  document.getElementById('debt-date').value=d?d.date:today();
  document.getElementById('debt-sym').textContent=getSym();
  document.getElementById('debt-contacts-list').innerHTML='';
  document.querySelectorAll('#ovl-debt .ty-btn').forEach(b=>b.classList.remove('act'));
  document.getElementById(debtDir==='owe'?'dt-exp':'dt-inc').classList.add('act');
  openOvl('ovl-debt');
}
function setDebtDir(dir){
  debtDir=dir;
  document.querySelectorAll('#ovl-debt .ty-btn').forEach(b=>b.classList.remove('act'));
  document.getElementById(dir==='owe'?'dt-exp':'dt-inc').classList.add('act');
}
function saveDebt(){
  const person=document.getElementById('debt-person').value.trim();
  if(!person){toast('⚠️ Inserisci il nome');return;}
  const amt=parseFloat(document.getElementById('debt-amt').value);
  if(!amt||amt<=0){toast('⚠️ Inserisci un importo valido');return;}
  const note=document.getElementById('debt-note').value.trim();
  const date=document.getElementById('debt-date').value||today();
  getOrAddContact(person);
  if(!D.debts)D.debts=[];
  if(debtEditId){
    const d=D.debts.find(x=>x.id===debtEditId);
    if(d){
      const oldAmt=d.amount;
      Object.assign(d,{person,amount:amt,note,date,direction:debtDir});
      // If direction is 'owe' and amount changed, update linked tx
      if(debtDir==='owe'&&d.linkedTxId&&Math.abs(oldAmt-amt)>0.001){
        const tx=D.transactions.find(t=>t.id===d.linkedTxId);
        if(tx)tx.amount=amt;
      }
    }
    saveData();closeOvl('ovl-debt');renderGroups();
    toast('✅ Debito aggiornato');
  }else{
    const newDebtId=uid();
    const newDebt={id:newDebtId,person,amount:amt,paid:0,note,date,direction:debtDir,settlements:[],linkedTxId:null};
    D.debts.push(newDebt);
    saveData();closeOvl('ovl-debt');
    if(debtDir==='owe'){
      // I owe someone — open picker to register expense
      openGrpTxPicker('expense',amt,'Debito verso '+person,date,(txId)=>{
        const d2=D.debts.find(x=>x.id===newDebtId);
        if(d2)d2.linkedTxId=txId;
        saveData();renderGroups();
      });
    }else{
      renderGroups();
      toast('✅ Debito salvato');
    }
  }
}
function delDebt(){
  confirm2('Elimina debito','Il debito verrà rimosso definitivamente.',()=>{
    D.debts=D.debts.filter(x=>x.id!==debtEditId);
    saveData();closeOvl('ovl-debt');renderGroups();toast('🗑️ Debito eliminato');
  });
}
let settleDebtId=null;
function openSettleSh(id){
  settleDebtId=id;
  const d=D.debts.find(x=>x.id===id);if(!d)return;
  const rem=d.amount-(d.paid||0);
  document.getElementById('settle-remaining').textContent=fmt(rem);
  document.getElementById('settle-person').textContent=(d.direction==='owed'?'Da: ':'A: ')+d.person;
  document.getElementById('settle-amt').value=fmtN(rem).replace(',','.');
  document.getElementById('settle-sym').textContent=getSym();
  document.getElementById('settle-accs').innerHTML=D.accounts.map((a,i)=>`<div class="as-it${i===0?' sel':''}" onclick="selSettleAcc('${a.id}')"><span class="as-ic">${a.emoji}</span><span class="as-nm">${a.name}</span><span class="as-bl">${fmt(accBal(a.id))}</span></div>`).join('');
  openOvl('ovl-settle');
}
function selSettleAcc(id){document.querySelectorAll('#settle-accs .as-it').forEach(el=>el.classList.toggle('sel',el.getAttribute('onclick').includes("'"+id+"'")));}
function settleDebt(){
  const d=D.debts.find(x=>x.id===settleDebtId);if(!d)return;
  const amt=parseFloat(document.getElementById('settle-amt').value);
  if(!amt||amt<=0){toast('⚠️ Inserisci importo');return;}
  const accEl=document.querySelector('#settle-accs .as-it.sel');
  if(!accEl){toast('⚠️ Seleziona un conto');return;}
  const accId=accEl.getAttribute('onclick').match(/'([^']+)'/)[1];
  const rem=d.amount-(d.paid||0);
  const actual=Math.min(amt,rem);
  d.paid=(d.paid||0)+actual;
  if(!d.settlements)d.settlements=[];
  d.settlements.push({date:today(),amount:actual,accountId:accId});
  const doneMsg=d.paid>=d.amount-0.001?'✅ Debito saldato completamente!':'✅ Saldo parziale — Residuo: '+fmt(d.amount-d.paid);
  if(d.direction==='owed'){
    // Someone paid me — register income with Rimborso category
    const cat=D.categories.income.find(c=>c.id==='ci5')||D.categories.income[D.categories.income.length-1];
    D.transactions.push({id:uid(),type:'income',amount:actual,categoryId:cat.id,accountId:accId,date:today(),note:'Saldo da '+d.person,createdAt:Date.now(),receipts:[]});
    saveData();closeOvl('ovl-settle');renderGroups();
    toast(doneMsg);
  }else{
    // I owe someone — create expense tx, ask category
    saveData();closeOvl('ovl-settle');
    openGrpTxPicker('expense',actual,'Saldo a '+d.person,today(),(txId)=>{renderGroups();toast(doneMsg);});
  }
}

// ── GROUPS ─────────────────────────────────────────────────────────────────
let grpEditId=null,grpMembers=[],grpEmojis=['🍽️','🏖️','🎉','✈️','🏠','🎮','🎓','💼','🏋️','🎵'],grpEmIdx=0;
function renderGrpList(body,archived){
  const groups=(D.groups||[]).filter(g=>!!g.archived===archived);
  const fab=archived?'':` <div style="margin:14px 14px 0"><button class="btn btn-p" onclick="openGrpSh()">+ Nuovo gruppo</button></div>`;
  if(!groups.length){body.innerHTML=fab+`<div class="empty"><div class="empty-ic">${archived?'📦':'👥'}</div><div class="empty-ttl">${archived?'Nessun gruppo archiviato':'Nessun gruppo attivo'}</div><div class="empty-sub">${archived?'':'Crea un gruppo per dividere le spese'}</div></div>`;return;}
  body.innerHTML=fab+groups.map(g=>grpCard(g)).join('');
}
function grpCard(g){
  const balances=calcGrpBalances(g);
  const myKey=getMyName();
  const myBal=balances[myKey]||0;
  const balCls=myBal>0.001?'pos':myBal<-0.001?'neg':'zero';
  const balLbl=myBal>0.001?'+'+fmt(myBal):fmt(myBal);
  const expenses=g.expenses||[];
  return`<div class="grp-card">
    <div class="grp-card-hdr" onclick="openGrpDetail('${g.id}')">
      <div class="grp-card-ic" style="background:var(--sf2)">${g.emoji||'👥'}</div>
      <div class="grp-card-info">
        <div class="grp-card-nm">${g.name}</div>
        <div class="grp-card-sub">${g.members.length} persone · ${expenses.length} spese · ${g.archived?'Archiviato':'Attivo'}</div>
      </div>
      <div class="grp-card-bal ${balCls}">${balLbl}</div>
    </div>
  </div>`;
}
function calcGrpBalances(g){
  const bal={};
  (g.members||[]).forEach(m=>bal[m]=0);
  (g.expenses||[]).forEach(exp=>{
    const payer=exp.paidBy;
    const splits=exp.splits||{};
    const totalSplit=Object.values(splits).reduce((a,b)=>a+Number(b),0);
    // Each non-payer owes their share to the payer
    // Payer credit = totalSplit - payerShare
    Object.entries(splits).forEach(([person,share])=>{
      if(person===payer)return;
      bal[payer]=(bal[payer]||0)+Number(share);
      bal[person]=(bal[person]||0)-Number(share);
    });
  });
  // Apply group-level settlements only (unified, no double-counting)
  (g.settlements||[]).forEach(s=>{
    bal[s.from]=(bal[s.from]||0)+s.amount;
    bal[s.to]=(bal[s.to]||0)-s.amount;
  });
  // Round all balances to 2 decimals
  Object.keys(bal).forEach(k=>bal[k]=Math.round(bal[k]*100)/100);
  return bal;
}
function calcSettlements(g,algo){
  const bal=calcGrpBalances(g);
  const creditors=Object.entries(bal).filter(([,v])=>v>0.001).sort((a,b)=>b[1]-a[1]);
  const debtors=Object.entries(bal).filter(([,v])=>v<-0.001).sort((a,b)=>a[1]-b[1]);
  const txs=[];
  if(algo==='minimal'){
    const cr=creditors.map(([n,v])=>({n,v}));
    const de=debtors.map(([n,v])=>({n,v:Math.abs(v)}));
    let i=0,j=0;
    while(i<cr.length&&j<de.length){
      const amt=Math.min(cr[i].v,de[j].v);
      if(amt>0.001)txs.push({from:de[j].n,to:cr[i].n,amount:Math.round(amt*100)/100});
      cr[i].v-=amt;de[j].v-=amt;
      if(cr[i].v<0.001)i++;
      if(de[j].v<0.001)j++;
    }
  }else{
    // direct: each debtor pays each creditor proportionally
    debtors.forEach(([debtor,dval])=>{
      creditors.forEach(([cred,cval])=>{
        const total=creditors.reduce((s,[,v])=>s+v,0);
        if(total>0){const amt=Math.abs(dval)*(cval/total);if(amt>0.001)txs.push({from:debtor,to:cred,amount:Math.round(amt*100)/100});}
      });
    });
  }
  return txs;
}
function getMyName(){
  const p=D.profile||{};
  const full=(p.firstName+' '+p.lastName).trim();
  return full||'Io';
}
function openGrpSh(id=null){
  grpEditId=id;
  const g=id?D.groups.find(x=>x.id===id):null;
  grpMembers=g?[...g.members]:[getMyName()];
  const selEm=g?g.emoji:GRP_EMOJIS[0];
  document.getElementById('sh-grp-ttl').textContent=id?'Modifica gruppo':'Nuovo gruppo';
  document.getElementById('grp-del-btn').style.display=id?'':'none';
  document.getElementById('grp-arc-btn').style.display=id&&!g.archived?'':'none';
  document.getElementById('grp-name').value=g?g.name:'';
  document.getElementById('grp-member-inp').value='';
  document.getElementById('grp-contacts-list').innerHTML='';
  renderGrpMemberChips();
  renderGrpEmGrid(selEm);
  openOvl('ovl-grp');
}
function addGrpMember(){
  const inp=document.getElementById('grp-member-inp');
  const name=inp.value.trim();if(!name)return;
  if(grpMembers.includes(name)){toast('⚠️ Già aggiunto');return;}
  getOrAddContact(name);
  grpMembers.push(name);
  inp.value='';
  document.getElementById('grp-contacts-list').innerHTML='';
  renderGrpMemberChips();
}
function removeGrpMember(name){grpMembers=grpMembers.filter(m=>m!==name);renderGrpMemberChips();}
function renderGrpMemberChips(){
  document.getElementById('grp-members-list').innerHTML=grpMembers.map(m=>`<div class="person-chip sel"><span class="person-chip-nm">${m}</span><span class="person-chip-del" onclick="removeGrpMember('${m}')">×</span></div>`).join('');
}
function saveGrp(){
  const name=document.getElementById('grp-name').value.trim();
  if(!name){toast('⚠️ Inserisci un nome');return;}
  if(grpMembers.length<2){toast('⚠️ Aggiungi almeno 2 persone');return;}
  if(!D.groups)D.groups=[];
  if(grpEditId){
    const g=D.groups.find(x=>x.id===grpEditId);
    if(g)Object.assign(g,{name,emoji:getSelGrpEm(),members:grpMembers,me:getMyName()});
  }else{
    D.groups.push({id:uid(),name,emoji:getSelGrpEm(),members:grpMembers,me:getMyName().trim(),expenses:[],settlements:[],archived:false,createdAt:Date.now()});
  }
  saveData();closeOvl('ovl-grp');renderGroups();
  toast(grpEditId?'✅ Gruppo aggiornato':'✅ Gruppo creato');
}
function delGrp(){
  confirm2('Elimina gruppo','Il gruppo e tutte le spese verranno eliminati.',()=>{
    D.groups=D.groups.filter(x=>x.id!==grpEditId);
    saveData();closeOvl('ovl-grp');renderGroups();toast('🗑️ Gruppo eliminato');
  });
}
function archiveGrp(){
  const g=D.groups.find(x=>x.id===grpEditId);
  if(g){g.archived=true;saveData();closeOvl('ovl-grp');renderGroups();toast('📦 Gruppo archiviato');}
}

// ── GROUP DETAIL SUB ───────────────────────────────────────────────────────
let grpDetailId=null,grpAlgo='minimal';
function openGrpDetail(id){
  grpDetailId=id;
  navigate('sub-grpdetail');
}
function renderGrpDetail(){
  const g=D.groups.find(x=>x.id===grpDetailId);
  if(!g){document.getElementById('sub-grpdetail-body').innerHTML='';return;}
  const b=document.getElementById('sub-grpdetail-body');
  const balances=calcGrpBalances(g);
  const settlements=calcSettlements(g,grpAlgo);
  // My summary
  const meKey=getMyName().trim();
  const myBal=balances[meKey]||0;
  const myBalHtml=`<div style="margin:10px 14px 0;background:${myBal>0.001?'var(--inc-g)':myBal<-0.001?'var(--exp-g)':'var(--sf2)'};border:1px solid ${myBal>0.001?'var(--inc)':myBal<-0.001?'var(--exp)':'var(--bd)'};border-radius:var(--r);padding:12px 14px;display:flex;align-items:center;gap:10px;">
    <div style="font-size:22px">${myBal>0.001?'📥':myBal<-0.001?'📤':'✅'}</div>
    <div style="flex:1"><div style="font-size:12px;color:var(--ts)">${myBal>0.001?'Ti devono in totale':myBal<-0.001?'Devi in totale':'Sei in pareggio'}</div>
    <div style="font-size:20px;font-weight:800;color:${myBal>0.001?'var(--inc)':myBal<-0.001?'var(--exp)':'var(--tt)'}">${myBal>0.001?'+':''}${fmt(myBal)}</div></div>
  </div>`;
  // Settle rows
  const settleHtml=settlements.length?`
    <div style="padding:10px 14px 4px;font-size:11px;font-weight:700;color:var(--tt);text-transform:uppercase;letter-spacing:.8px">Da saldare</div>
    <div style="margin:0 14px;">
      <div class="algo-tog">
        <div class="algo-btn ${grpAlgo==='minimal'?'act':''}" onclick="setGrpAlgo('minimal')">Minimo pagamenti</div>
        <div class="algo-btn ${grpAlgo==='direct'?'act':''}" onclick="setGrpAlgo('direct')">Pagamenti diretti</div>
      </div>
      ${settlements.map(s=>`<div class="settle-row"><span style="font-weight:700">${s.from}</span><span class="settle-arrow">→</span><span style="font-weight:700">${s.to}</span><span style="margin-left:auto;font-weight:800;color:var(--acc)">${fmt(s.amount)}</span><button class="settle-btn" onclick="openGrpSettle('${grpDetailId}','${s.from}','${s.to}',${s.amount})">Salda</button></div>`).join('')}
    </div>`:'<div style="padding:10px 14px;font-size:13px;color:var(--inc);font-weight:600">✅ Tutto in pareggio!</div>';
  // Balances
  const balHtml=`<div style="padding:10px 14px 4px;font-size:11px;font-weight:700;color:var(--tt);text-transform:uppercase;letter-spacing:.8px">Saldi</div>
    <div style="margin:0 14px;background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);overflow:hidden;padding:4px 10px;">
      ${Object.entries(balances).map(([n,v])=>`<div class="debt-dir-row"><span class="debt-dir-name">${n}</span><span class="debt-dir-amt ${v>0.001?'pos':v<-0.001?'neg':''}">${v>0.001?'+':''}${fmt(v)}</span></div>`).join('')}
    </div>`;
  // Expenses
  const settlementsLog=(g.settlements||[]);
  const histHtml=settlementsLog.length?`<div style="padding:10px 14px 4px;font-size:11px;font-weight:700;color:var(--tt);text-transform:uppercase;letter-spacing:.8px">Storico saldi</div>
    <div class="card" style="margin:0 14px">`+settlementsLog.map(s=>`<div class="txi"><div class="txi-ic income">💸</div><div class="txi-info"><div class="txi-cat">${s.from} → ${s.to}</div><div class="txi-meta">${s.date}</div></div><div class="txi-amt income">+${fmt(s.amount)}</div></div>`).join('')+'</div>':'';
  const expHtml=`<div style="padding:10px 14px 4px;font-size:11px;font-weight:700;color:var(--tt);text-transform:uppercase;letter-spacing:.8px">Spese</div>
    ${g.archived?'':'<div style="margin:0 14px 8px"><button class="btn btn-p" style="padding:9px" onclick="openGrpExpSh(null)">+ Aggiungi spesa</button></div>'}
    ${(g.expenses||[]).length?'<div class="card" style="margin:0 14px">'+g.expenses.map(e=>grpExpRow(e,g)).join('')+'</div>':'<div class="empty" style="padding:24px"><div class="empty-ic">🧾</div><div class="empty-ttl">Nessuna spesa</div></div>'}`;
  b.innerHTML=myBalHtml+settleHtml+balHtml+expHtml+histHtml;
}
function grpExpRow(e,g){
  const splits=e.splits||{};
  const total=Object.values(splits).reduce((a,b)=>a+b,0);
  return`<div class="exp-item" style="padding:10px 14px" onclick="openGrpExpSh('${e.id}')">
    <div class="exp-item-ic">🧾</div>
    <div class="exp-item-info"><div class="exp-item-nm">${e.desc}</div><div class="exp-item-sub">${e.paidBy} · ${e.date}</div></div>
    <div class="exp-item-amt">${fmt(total)}</div>
  </div>`;
}
function setGrpAlgo(algo){grpAlgo=algo;renderGrpDetail();}
let grpExpEditId=null,grpSplitMode='equal';
function openGrpExpSh(expId){
  grpExpEditId=expId;
  const g=D.groups.find(x=>x.id===grpDetailId);if(!g)return;
  const exp=expId?g.expenses.find(e=>e.id===expId):null;
  grpSplitMode=exp?exp.splitMode||'equal':'equal';
  document.getElementById('sh-grpexp-ttl').textContent=expId?'Modifica spesa':'Nuova spesa';
  document.getElementById('grpexp-del-btn').style.display=expId?'':'none';
  document.getElementById('grpexp-desc').value=exp?exp.desc:'';
  document.getElementById('grpexp-amt').value=exp?Object.values(exp.splits||{}).reduce((a,b)=>a+b,0):'';
  document.getElementById('grpexp-date').value=exp?exp.date:today();
  document.getElementById('grpexp-sym').textContent=getSym();
  // Payers
  document.getElementById('grpexp-payers').innerHTML=g.members.map((m,i)=>`<div class="as-it${(exp?exp.paidBy===m:i===0)?' sel':''}" onclick="selGrpPayer('${m}');updateEqualSplit()">${m}</div>`).join('');
  // Tx link
  const txSel=document.getElementById('grpexp-txlink');
  const recentTx=[...D.transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20);
  txSel.innerHTML='<option value="">Nessuna</option>'+recentTx.filter(t=>t.type==='expense').map(t=>{const cat=getCat(t.categoryId,t.type);return`<option value="${t.id}">${t.date} · ${cat.name} · ${fmt(t.amount)}</option>`;}).join('');
  if(exp&&exp.txId)txSel.value=exp.txId;
  // Split mode
  setSplitMode(grpSplitMode,exp);
  openOvl('ovl-grpexp');
}
function selGrpPayer(name){document.querySelectorAll('#grpexp-payers .as-it').forEach(el=>el.classList.toggle('sel',el.textContent.trim()===name.trim()));}
function getSplitExp(){
  if(!grpExpEditId||!grpDetailId)return null;
  const g=D.groups.find(x=>x.id===grpDetailId);
  return g?g.expenses.find(e=>e.id===grpExpEditId):null;
}
function setSplitMode(mode,exp){
  grpSplitMode=mode;
  document.getElementById('split-eq-btn').classList.toggle('act',mode==='equal');
  document.getElementById('split-cu-btn').classList.toggle('act',mode==='custom');
  const g=D.groups.find(x=>x.id===grpDetailId);if(!g)return;
  const splits=document.getElementById('grpexp-splits');
  // Always try to get current exp if not passed
  const curExp=exp||getSplitExp();
  if(mode==='equal'){
    const amt=parseFloat(document.getElementById('grpexp-amt').value)||0;
    const share=g.members.length>0?Math.floor((amt/g.members.length)*100)/100:0;
    splits.innerHTML=g.members.map(m=>`<div class="split-row"><span class="split-nm">${m}</span><span style="color:var(--ts);font-size:13px">${fmt(share)}</span></div>`).join('');
  }else{
    const prevSplits=curExp?curExp.splits:{};
    splits.innerHTML=g.members.map(m=>`<div class="split-row"><span class="split-nm">${m}</span><input class="split-inp" type="number" id="split-${m.replace(/\s/g,'_')}" value="${prevSplits[m]||''}" placeholder="0,00" step="0.01" inputmode="decimal"></div>`).join('');
  }
}
function updateEqualSplit(){if(grpSplitMode==='equal')setSplitMode('equal');}
function saveGrpExp(){
  const g=D.groups.find(x=>x.id===grpDetailId);if(!g)return;
  const desc=document.getElementById('grpexp-desc').value.trim();
  if(!desc){toast('⚠️ Inserisci descrizione');return;}
  const amt=parseFloat(document.getElementById('grpexp-amt').value);
  if(!amt||amt<=0){toast('⚠️ Inserisci importo');return;}
  const payerEl=document.querySelector('#grpexp-payers .as-it.sel');
  if(!payerEl){toast('⚠️ Seleziona chi ha pagato');return;}
  const paidBy=payerEl.textContent.trim();
  const date=document.getElementById('grpexp-date').value||today();
  const txId=document.getElementById('grpexp-txlink').value||null;
  let splits={};
  if(grpSplitMode==='equal'){
    // Distribute remainder to payer to avoid rounding gaps
    const payer=(payerEl?payerEl.textContent:g.members[0]).trim();
    const base=Math.floor((amt/g.members.length)*100)/100;
    const remainder=Math.round((amt-base*g.members.length)*100)/100;
    g.members.forEach(m=>splits[m]=base);
    if(splits[payer]!==undefined)splits[payer]=Math.round((splits[payer]+remainder)*100)/100;
  }else{
    let total=0;
    g.members.forEach(m=>{const key='split-'+m.replace(/\s/g,'_');const el=document.getElementById(key);const v=parseFloat(el?.value)||0;splits[m]=v;total+=v;});
    if(Math.abs(total-amt)>0.01){toast('⚠️ La somma delle quote ('+fmt(total)+') non corrisponde al totale ('+fmt(amt)+')');return;}
  }
  if(!g.expenses)g.expenses=[];
  if(grpExpEditId){
    const e=g.expenses.find(x=>x.id===grpExpEditId);
    if(e)Object.assign(e,{desc,paidBy,splits,date,txId,splitMode:grpSplitMode});
    saveData();closeOvl('ovl-grpexp');renderGrpDetail();
    toast('✅ Spesa aggiornata');
  }else{
    const expId=uid();
    g.expenses.push({id:expId,desc,paidBy,splits,date,txId:null,splitMode:grpSplitMode,settlements:[],linkedTxId:null});
    saveData();closeOvl('ovl-grpexp');
    const meKey=getMyName();
    if(paidBy===meKey){
      // I'm the payer — ask account + category for full amount
      openGrpTxPicker('expense',amt,'Spesa gruppo: '+desc+' ('+g.name+')',date,(newTxId)=>{
        const exp=g.expenses.find(e=>e.id===expId);
        if(exp)exp.linkedTxId=newTxId;
        saveData();renderGrpDetail();
      });
    }else{
      // I'm not the payer — no tx created here (group is just a tracker)
      renderGrpDetail();
      toast('✅ Spesa aggiunta');
    }
  }
}
function delGrpExp(){
  const g=D.groups.find(x=>x.id===grpDetailId);if(!g)return;
  const exp=g.expenses.find(e=>e.id===grpExpEditId);
  const hasLinked=exp&&exp.linkedTxId;
  const msg=hasLinked?'La spesa e la transazione collegata verranno eliminate.':'La spesa verrà rimossa dal gruppo.';
  confirm2('Elimina spesa',msg,()=>{
    if(hasLinked){
      D.transactions=D.transactions.filter(t=>t.id!==exp.linkedTxId);
    }
    g.expenses=g.expenses.filter(e=>e.id!==grpExpEditId);
    saveData();closeOvl('ovl-grpexp');renderGrpDetail();toast('🗑️ Spesa eliminata');
  });
}
let grpSettleData=null;
let grpTxData=null; // {type:'expense'|'income', amount, note, date, callback}
function openGrpTxPicker(type, amount, note, date, callback){
  grpTxData={type,amount,note,date,callback};
  const sym=getSym();
  document.getElementById('sh-grptx-ttl').textContent=type==='expense'?'Registra uscita':'Registra entrata';
  document.getElementById('grptx-info').innerHTML=`
    <div style="font-size:11px;color:var(--ts);margin-bottom:4px">${type==='expense'?'Spesa da registrare':'Entrata da registrare'}</div>
    <div style="font-size:20px;font-weight:800;color:${type==='expense'?'var(--exp)':'var(--inc)'}">${type==='expense'?'-':'+'}${fmt(amount)}</div>
    <div style="font-size:12px;color:var(--tt);margin-top:3px">${note}</div>`;
  // Accounts
  document.getElementById('grptx-accs').innerHTML=D.accounts.map((a,i)=>`<div class="as-it${i===0?' sel':''}" onclick="selGrpTxAcc('${a.id}')"><span class="as-ic">${a.emoji}</span><span class="as-nm">${a.name}</span><span class="as-bl">${fmt(accBal(a.id))}</span></div>`).join('');
  // Categories
  const cats=type==='expense'?D.categories.expense:D.categories.income;
  document.getElementById('grptx-cats').innerHTML=cats.map((c,i)=>`<div class="cat-it${i===0?' sel':''}" onclick="selGrpTxCat('${c.id}')"><span class="ce">${c.emoji}</span><span class="cn">${c.name}</span></div>`).join('');
  openOvl('ovl-grptx');
}
function selGrpTxAcc(id){document.querySelectorAll('#grptx-accs .as-it').forEach(el=>el.classList.toggle('sel',el.getAttribute('onclick').includes("'"+id+"'")));}
function selGrpTxCat(id){document.querySelectorAll('#grptx-cats .cat-it').forEach(el=>el.classList.toggle('sel',el.getAttribute('onclick').includes("'"+id+"'")));}
function confirmGrpTx(){
  if(!grpTxData)return;
  const accEl=document.querySelector('#grptx-accs .as-it.sel');
  const catEl=document.querySelector('#grptx-cats .cat-it.sel');
  if(!accEl){toast('⚠️ Seleziona un conto');return;}
  if(!catEl){toast('⚠️ Seleziona una categoria');return;}
  const accId=accEl.getAttribute('onclick').match(/'([^']+)'/)[1];
  const catId=catEl.getAttribute('onclick').match(/'([^']+)'/)[1];
  const{type,amount,note,date,callback}=grpTxData;
  const txId=uid();
  D.transactions.push({id:txId,type,amount,categoryId:catId,accountId:accId,date:date||today(),note,receipts:[],createdAt:Date.now()});
  saveData();
  closeOvl('ovl-grptx');
  if(callback)callback(txId);
  toast('✅ Transazione registrata');
}

function openGrpSettle(grpId,from,to,amount){
  grpSettleData={grpId,from,to,amount};
  const meKey=getMyName().trim();
  const iAmInvolved=(from.trim()===meKey||to.trim()===meKey);
  const g=D.groups.find(x=>x.id===grpId);
  const gName=g?g.name:'';
  // Info box
  let infoExtra='';
  if(to.trim()===meKey) infoExtra=`<div style="font-size:12px;color:var(--inc);margin-top:6px;font-weight:600">💰 Verrà registrata un'entrata nel tuo conto</div>`;
  else if(from.trim()===meKey) infoExtra=`<div style="font-size:12px;color:var(--exp);margin-top:6px;font-weight:600">💸 Verrà registrata un'uscita dal tuo conto</div>`;
  else infoExtra='<div style="font-size:12px;color:var(--ts);margin-top:6px">ℹ️ Pagamento tra altri membri — nessuna transazione creata</div>';
  document.getElementById('grpsettle-info').innerHTML=`
    <div style="font-size:12px;color:var(--ts);margin-bottom:6px">Pagamento da registrare</div>
    <div style="font-size:16px;font-weight:800">${from} → ${to}</div>
    <div style="font-size:22px;font-weight:800;color:var(--acc);margin-top:4px">${fmt(amount)}</div>
    ${infoExtra}`;
  // Show account selector only when I'm involved
  const accSec=document.getElementById('grpsettle-acc-sec');
  if(accSec) accSec.style.display=iAmInvolved?'':'none';
  if(iAmInvolved){
    document.getElementById('grpsettle-accs').innerHTML=D.accounts.map((a,i)=>`<div class="as-it${i===0?' sel':''}" onclick="selGrpSettleAcc('${a.id}')"><span class="as-ic">${a.emoji}</span><span class="as-nm">${a.name}</span><span class="as-bl">${fmt(accBal(a.id))}</span></div>`).join('');
  }
  openOvl('ovl-grpsettle');
}
function selGrpSettleAcc(id){document.querySelectorAll('#grpsettle-accs .as-it').forEach(el=>el.classList.toggle('sel',el.getAttribute('onclick').includes("'"+id+"'")));}
function confirmGrpSettle(){
  if(!grpSettleData)return;
  const{grpId,from,to,amount}=grpSettleData;
  const g=D.groups.find(x=>x.id===grpId);if(!g)return;
  const meKey=getMyName().trim();
  const toMe=to.trim()===meKey;
  const fromMe=from.trim()===meKey;
  const iAmInvolved=toMe||fromMe;
  // Only require account selection when I'm involved
  let accId=null;
  if(iAmInvolved){
    const accEl=document.querySelector('#grpsettle-accs .as-it.sel');
    if(!accEl){toast('⚠️ Seleziona un conto');return;}
    accId=accEl.getAttribute('onclick').match(/'([^']+)'/)[1];
  }
  if(!g.settlements)g.settlements=[];
  g.settlements.push({from,to,amount,date:today(),accountId:accId||null});
  if(toMe){
    // Someone paid me — create income automatically with Rimborso category
    const cat=D.categories.income.find(c=>c.id==='ci5')||D.categories.income[D.categories.income.length-1];
    D.transactions.push({id:uid(),type:'income',amount,categoryId:cat.id,accountId:accId,date:today(),note:'Saldo da '+from+' ('+g.name+')',createdAt:Date.now(),receipts:[]});
    saveData();closeOvl('ovl-grpsettle');renderGrpDetail();
    toast('✅ Entrata registrata');
  }else if(fromMe){
    // I'm paying someone — ask account + category, create expense
    saveData();closeOvl('ovl-grpsettle');
    openGrpTxPicker('expense',amount,'Saldo a '+to+' ('+g.name+')',today(),(txId)=>{renderGrpDetail();});
  }else{
    // Payment between other members — just update group balances, no tx
    saveData();closeOvl('ovl-grpsettle');renderGrpDetail();
    toast('✅ Saldo registrato');
  }
}

// ── FIX GROUP EMOJI GRID ──────────────────────────────────────────────────
function renderGrpEmGrid(selEmoji){
  const grid=document.getElementById('grp-ems');if(!grid)return;
  grid.innerHTML=GRP_EMOJIS.map(e=>`<div class="em-opt${e===selEmoji?' sel':''}" onclick="selGrpEm('${e}')">${e}</div>`).join('');
}
function selGrpEm(e){
  document.querySelectorAll('#grp-ems .em-opt').forEach(el=>el.classList.toggle('sel',el.textContent===e));
}
function getSelGrpEm(){
  const sel=document.querySelector('#grp-ems .em-opt.sel');
  return sel?sel.textContent:'👥';
}
