// ── NAVIGATION ─────────────────────────────────────────────────────────────
let curScr='dashboard',curSub=null;
const SCR_ORDER=['dashboard','transactions','stats','groups','settings'];
function showScr(name){
  const prev=curScr;
  const prevIdx=SCR_ORDER.indexOf(prev);
  const nextIdx=SCR_ORDER.indexOf(name);
  const goRight=nextIdx>prevIdx;
  // Slide out current
  const prevEl=document.getElementById('scr-'+prev);
  if(prevEl&&prev!==name){
    prevEl.classList.remove('act');
    prevEl.classList.add(goRight?'slide-out-left':'slide-out-right');
    setTimeout(()=>prevEl.classList.remove('slide-out-left','slide-out-right'),320);
  }
  document.querySelectorAll('.scr').forEach(s=>{if(s.id!=='scr-'+name&&s.id!=='scr-'+prev)s.classList.remove('act');});
  const nextEl=document.getElementById('scr-'+name);
  if(nextEl){
    nextEl.classList.add('act');
    if(prev!==name){
      nextEl.classList.add(goRight?'slide-in-right':'slide-in-left');
      setTimeout(()=>nextEl.classList.remove('slide-in-left','slide-in-right'),320);
    }
  }
  curScr=name;
  document.querySelectorAll('.sub').forEach(s=>s.classList.remove('open'));curSub=null;
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('act'));
  const ni=document.getElementById('ni-'+name);if(ni)ni.classList.add('act');
  document.getElementById('hdr-back').style.display='none';
  const titles={dashboard:'PECUNIA',transactions:'Movimenti',stats:'Statistiche',groups:'Gruppi & Debiti',settings:'Impostazioni'};
  document.getElementById('hdr-title').textContent=titles[name]||'PECUNIA';
  document.getElementById('hdr-search').style.display=name==='transactions'?'block':'none';
  if(name==='dashboard')renderDash();
  if(name==='transactions')renderTxList();
  if(name==='stats'){stPrdOff=0;renderStats();}
  if(name==='settings')renderSettings();
  if(name==='groups'){grpTab='debts';renderGroups();}
}
function navigate(sub){
  const el=document.getElementById(sub);if(!el)return;
  document.getElementById('hdr-back').style.display='flex';
  curSub=sub;el.classList.add('open');
  if(sub==='sub-acc')renderAccSub();
  if(sub==='sub-cats')renderCatsSub();
  if(sub==='sub-rec')renderRecSub();
  if(sub==='sub-bgt')renderBgtSub();
  if(sub==='sub-curr')renderCurrSub();
  if(sub==='sub-pin')renderPinSub();
  if(sub==='sub-contacts')renderContactsSub();
  if(sub==='sub-profile')renderProfileSub();
  if(sub==='sub-guide')renderGuideSub();
  if(sub==='sub-grpdetail'){
    const g=D.groups.find(x=>x.id===grpDetailId);
    if(g)document.getElementById('sub-grpdetail-title').textContent=g.name;
    renderGrpDetail();
  }
}
function goBack(){
  if(curSub){document.getElementById(curSub).classList.remove('open');curSub=null;}
  document.getElementById('hdr-back').style.display='none';
  if(curScr==='settings')renderSettings();
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────
function renderDash(){
  // Profile banner
  const pb=document.getElementById('profile-banner');
  if(pb){
    const p=D.profile||{};
    pb.style.display=(!p.firstName&&!p.profileBannerDismissed)?'flex':'none';
  }
  document.getElementById('d-total').textContent=fmt(totalBal());
  const{inc,exp}=moTotals();
  document.getElementById('d-inc').textContent=fmt(inc);
  document.getElementById('d-exp').textContent=fmt(exp);
  const s=D.settings;const bSec=document.getElementById('d-bgt-sec');
  if(s.budgetEnabled&&s.budgetMonthly){
    bSec.style.display='';
    const pct=Math.min(100,(exp/s.budgetMonthly)*100);
    const fill=document.getElementById('d-bgt-fill');
    fill.style.width=pct+'%';
    fill.className='bgt-fill'+(pct>=100?' dng':pct>=80?' warn':'');
    document.getElementById('d-bgt-amts').textContent=fmt(exp)+' / '+fmt(s.budgetMonthly);
    // Savings
    const savCard=document.getElementById('d-sav-card');
    const saved=s.budgetMonthly-exp;
    if(saved>0){
      savCard.style.display='';
      const savPct=Math.min(100,(saved/s.budgetMonthly)*100);
      document.getElementById('d-sav-fill').style.width=savPct+'%';
      document.getElementById('d-sav-fill').className='sav-fill';
      document.getElementById('d-sav-amts').textContent='+'+fmt(saved);
      document.getElementById('d-sav-sub').textContent='Hai risparmiato il '+savPct.toFixed(0)+'% del tuo budget questo mese 🎉';
    }else if(saved<0){
      savCard.style.display='';
      const overPct=Math.min(100,(Math.abs(saved)/s.budgetMonthly)*100);
      document.getElementById('d-sav-fill').style.width=overPct+'%';
      document.getElementById('d-sav-fill').className='sav-fill dng';
      document.getElementById('d-sav-amts').textContent=fmt(saved);
      document.getElementById('d-sav-sub').textContent='Hai superato il budget di '+fmt(Math.abs(saved));
    }else savCard.style.display='none';
  }else bSec.style.display='none';
  // Accounts chips
  const ae=document.getElementById('d-accs');ae.innerHTML='';
  // Get ordered accounts (use accountOrder if set, else default order)
  const orderedAccs=getOrderedAccounts();
  orderedAccs.forEach(acc=>{
    const ch=document.createElement('div');ch.className='acc-chip';ch.dataset.accId=acc.id;
    ch.innerHTML='<div class="acc-chip-handle">☰</div><div class="acc-chip-ic">'+acc.emoji+'</div><div class="acc-chip-nm">'+acc.name+'</div><div class="acc-chip-bl" style="color:'+acc.color+'">'+fmt(accBal(acc.id))+'</div>';
    setupAccChipLongPress(ch,acc);
    ae.appendChild(ch);
  });
  const add=document.createElement('div');add.className='acc-chip';
  add.style.cssText='display:flex;align-items:center;justify-content:center;min-width:72px;border-style:dashed;color:var(--tt);font-size:28px;font-weight:300;';
  add.textContent='+';add.onclick=()=>openAccSh(null);ae.appendChild(add);
  // Recent
  const re=document.getElementById('d-recent');
  const recent=[...D.transactions].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id)).slice(0,5);
  if(!recent.length){re.innerHTML='<div class="empty"><div class="empty-ic">📭</div><div class="empty-ttl">Nessuna transazione</div><div class="empty-sub">Premi + per aggiungere</div></div>';return;}
  re.innerHTML='<div class="tx-grp">'+recent.map(txHtml).join('')+'</div>';
}

function txHtml(tx){
  if(tx.type==='transfer-in') return '';
  if(tx.isFuture){
    const cat=getCat(tx.categoryId,tx.type);const acc=getAcc(tx.accountId);
    const sign=tx.type==='expense'?'-':'+';
    const d=pDate(tx.date).toLocaleDateString('it-IT',{day:'2-digit',month:'short'});
    return`<div class="txi txi-future">
      <div class="txi-ic ${tx.type}" style="opacity:.6">${cat.emoji}</div>
      <div class="txi-info"><div class="txi-cat">${cat.name} <span style="font-size:10px;color:var(--tt)">🔄 Prevista</span></div>
      <div class="txi-meta"><span>${d}</span><span>·</span><span>${acc.emoji} ${acc.name}</span></div></div>
      <div class="txi-amt ${tx.type}">${sign}${fmt(tx.amount)}</div>
    </div>`;
  }
  if(tx.type==='transfer-out'){
    const fromAcc=getAcc(tx.accountId);const toAcc=getAcc(tx.toAccountId||'');
    const d=pDate(tx.date).toLocaleDateString('it-IT',{day:'2-digit',month:'short'});
    return`<div class="txi" onclick="openEditTr('${tx.transferGroupId}')">
      <div class="txi-ic transfer-out">⇄</div>
      <div class="txi-info"><div class="txi-cat">Trasferimento</div>
      <div class="txi-meta"><span>${d}</span><span>·</span><span>${fromAcc.emoji} ${fromAcc.name} → ${toAcc.emoji} ${toAcc.name}</span>${tx.note?`<span>·</span><span style="font-style:italic">${tx.note}</span>`:''}</div></div>
      <div class="txi-amt" style="color:var(--acc)">${fmt(tx.amount)}</div>
    </div>`;
  }
  const cat=getCat(tx.categoryId,tx.type);const acc=getAcc(tx.accountId);
  const sign=tx.type==='expense'?'-':'+';
  const d=pDate(tx.date).toLocaleDateString('it-IT',{day:'2-digit',month:'short'});
  const hasReceipts=tx.receipts&&tx.receipts.length>0;
  return`<div class="txi" onclick="openEditTx('${tx.id}')">
    <div class="txi-ic ${tx.type}">${cat.emoji}</div>
    <div class="txi-info"><div class="txi-cat">${cat.name}${hasReceipts?'<span class="txi-badge">📎</span>':''}</div>
    <div class="txi-meta"><span>${d}</span><span>·</span><span>${acc.emoji} ${acc.name}</span>${tx.note?`<span>·</span><span style="font-style:italic;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${tx.note}</span>`:''}</div></div>
    <div class="txi-amt ${tx.type}">${sign}${fmt(tx.amount)}</div>
  </div>`;
}

// ── AUTO-SCROLL CONFIG ───────────────────────────────────────────────────────
const ACC_SCROLL_ZONE=60;  // px from edge that triggers auto-scroll
const ACC_SCROLL_SPEED=8;  // px per frame
let accScrollTimer=null;

function startAutoScroll(container,clientX){
  stopAutoScroll();
  const rect=container.getBoundingClientRect();
  const distLeft=clientX-rect.left;
  const distRight=rect.right-clientX;
  let dir=0;
  if(distLeft<ACC_SCROLL_ZONE)dir=-1;
  else if(distRight<ACC_SCROLL_ZONE)dir=1;
  if(!dir)return;
  // Speed scales with proximity to edge
  const intensity=dir<0?(1-distLeft/ACC_SCROLL_ZONE):(1-distRight/ACC_SCROLL_ZONE);
  const speed=Math.round(ACC_SCROLL_SPEED*intensity*2);
  accScrollTimer=setInterval(()=>{container.scrollLeft+=dir*speed;},16);
}

function stopAutoScroll(){
  clearInterval(accScrollTimer);accScrollTimer=null;
}

function doReorder(fromId,toId){
  if(!fromId||!toId||fromId===toId)return;
  const ordered=getOrderedAccounts();
  const fromIdx=ordered.findIndex(a=>a.id===fromId);
  const toIdx=ordered.findIndex(a=>a.id===toId);
  if(fromIdx<0||toIdx<0)return;
  const moved=ordered.splice(fromIdx,1)[0];
  ordered.splice(toIdx,0,moved);
  D.accountOrder=ordered.map(a=>a.id);
  saveData();
  renderDash();
}

function setupAccChipLongPress(chip,acc){
  // ── Long press to enter reorder mode ──────────────────────────────────────
  let pressTimer=null;
  let pressStarted=false;

  const startPress=()=>{pressStarted=true;pressTimer=setTimeout(()=>enterReorderMode(),500);};
  const cancelPress=()=>{pressStarted=false;clearTimeout(pressTimer);};

  chip.addEventListener('touchstart',startPress,{passive:true});
  chip.addEventListener('touchend',cancelPress);
  chip.addEventListener('touchmove',cancelPress,{passive:true});
  chip.addEventListener('mousedown',startPress);
  chip.addEventListener('mouseup',cancelPress);
  chip.addEventListener('mouseleave',cancelPress);
  chip.addEventListener('click',()=>{if(!accReorderMode)navigate('sub-acc');});

  // ── Mouse drag (desktop) with auto-scroll ─────────────────────────────────
  chip.setAttribute('draggable','true');

  chip.addEventListener('dragstart',e=>{
    if(!accReorderMode){e.preventDefault();return;}
    dragSrcId=acc.id;
    chip.classList.add('dragging');
    e.dataTransfer.effectAllowed='move';
  });

  chip.addEventListener('drag',e=>{
    if(!accReorderMode||!dragSrcId)return;
    const ae=document.getElementById('d-accs');
    if(ae&&e.clientX>0)startAutoScroll(ae,e.clientX);
  });

  chip.addEventListener('dragend',()=>{
    chip.classList.remove('dragging');
    stopAutoScroll();
  });

  chip.addEventListener('dragover',e=>{
    if(!accReorderMode)return;
    e.preventDefault();e.dataTransfer.dropEffect='move';
    chip.classList.add('drag-over');
  });

  chip.addEventListener('dragleave',()=>chip.classList.remove('drag-over'));

  chip.addEventListener('drop',e=>{
    if(!accReorderMode||!dragSrcId)return;
    e.preventDefault();
    stopAutoScroll();
    chip.classList.remove('drag-over');
    doReorder(dragSrcId,acc.id);
  });

  // ── Touch drag (mobile) with auto-scroll ──────────────────────────────────
  let touchDragId=null;

  chip.addEventListener('touchstart',e=>{
    if(!accReorderMode)return;
    touchDragId=acc.id;
  },{passive:true});

  chip.addEventListener('touchmove',e=>{
    if(!accReorderMode||!touchDragId)return;
    e.preventDefault();
    const t=e.touches[0];
    // Auto-scroll
    const ae=document.getElementById('d-accs');
    if(ae)startAutoScroll(ae,t.clientX);
    // Highlight drop target
    const el=document.elementFromPoint(t.clientX,t.clientY);
    const target=el?el.closest('.acc-chip[data-acc-id]'):null;
    document.querySelectorAll('.acc-chip').forEach(c=>c.classList.remove('drag-over'));
    if(target&&target.dataset.accId!==touchDragId)target.classList.add('drag-over');
  },{passive:false});

  chip.addEventListener('touchend',e=>{
    if(!accReorderMode||!touchDragId)return;
    stopAutoScroll();
    const t=e.changedTouches[0];
    const el=document.elementFromPoint(t.clientX,t.clientY);
    const target=el?el.closest('.acc-chip[data-acc-id]'):null;
    document.querySelectorAll('.acc-chip').forEach(c=>c.classList.remove('drag-over'));
    if(target&&target.dataset.accId)doReorder(touchDragId,target.dataset.accId);
    touchDragId=null;
  });
}

function enterReorderMode(){
  accReorderMode=true;
  const ae=document.getElementById('d-accs');
  if(ae)ae.classList.add('reorder-mode');
  const btn=document.getElementById('d-acc-reorder-btn');
  if(btn)btn.style.display='';
  haptic('tap');
  toast('Trascina i conti per riordinarli');
}

function exitReorderMode(){
  accReorderMode=false;
  stopAutoScroll();
  const ae=document.getElementById('d-accs');
  if(ae)ae.classList.remove('reorder-mode');
  const btn=document.getElementById('d-acc-reorder-btn');
  if(btn)btn.style.display='none';
}

// Exit reorder when tapping outside acc-scroll
document.addEventListener('click',e=>{
  if(!accReorderMode)return;
  const ae=document.getElementById('d-accs');
  if(ae&&!ae.contains(e.target)){exitReorderMode();}
});

// ── ACCOUNT REORDER ───────────────────────────────────────────────────────────
let accReorderMode=false,dragSrcId=null;

function getOrderedAccounts(){
  const order=D.accountOrder||[];
  if(!order.length)return D.accounts;
  // Sort accounts by order array, append any new accounts at end
  const ordered=[];
  order.forEach(id=>{const a=D.accounts.find(x=>x.id===id);if(a)ordered.push(a);});
  D.accounts.forEach(a=>{if(!ordered.find(x=>x.id===a.id))ordered.push(a);});
  return ordered;
}
