// ── STATS ──────────────────────────────────────────────────────────────────
let stPrd='week',stPrdOff=0,stAccFilter='',chPie=null,chBar=null,chLine=null,chCmp=null,cmpType='bar';
function setStPrd(p){stPrd=p;stPrdOff=0;document.querySelectorAll('.prd-btn').forEach(b=>b.classList.toggle('act',b.dataset.p===p));renderStats();}
function setStAcc(v){stAccFilter=v;renderStats();}
function stPrev(){stPrdOff--;renderStats();}
function stNext(){stPrdOff++;renderStats();}
function getPrdRange(){
  if(stPrd==='week')return getWk(stPrdOff);
  if(stPrd==='month')return getMo(stPrdOff);
  return getYr(stPrdOff);
}
function getPrdLbl(r){
  if(stPrd==='week')return wkLbl(r);
  if(stPrd==='month')return moLbl(r);
  return yrLbl(r);
}
function renderStats(){
  // update account dropdown
  const sel=document.getElementById('st-acc-sel');
  if(sel){
    const cur=stAccFilter;
    sel.innerHTML='<option value="">Tutti i conti</option>'+D.accounts.map(a=>`<option value="${a.id}">${a.emoji} ${a.name}</option>`).join('');
    sel.value=cur;
  }
  const{start,end}=getPrdRange();
  document.getElementById('st-prd-lbl').textContent=getPrdLbl({start,end});
  const{inc,exp}=prdTotalsFiltered(start,end,stAccFilter);
  const net=inc-exp;
  const chip=document.getElementById('st-chip-rec');
  if(chip)chip.classList.toggle('act',!!D.settings.showRecInStats);
  let totalInc=inc,totalExp=exp;
  if(D.settings.showRecInStats){
    const recT=getRecTotalsForPeriod(start,end,stAccFilter);
    totalInc+=recT.inc;totalExp+=recT.exp;
  }
  const net2=totalInc-totalExp;
  animateCounter('st-inc',totalInc,false);
  animateCounter('st-exp',totalExp,false);
  const netEl=document.getElementById('st-net');
  netEl.style.color=net2>=0?'var(--inc)':net2<0?'var(--exp)':'';
  animateCounter('st-net',Math.abs(net2),false);
  renderPie(start,end,stAccFilter);renderBar(start,end,stAccFilter);renderLine(start,end,stAccFilter);
  renderComparison(start,end,stAccFilter);renderTopCats(start,end,stAccFilter);
}
function renderPie(start,end,accId){
  const byCat=expByCat(start,end,accId);
  const total=Object.values(byCat).reduce((a,b)=>a+b,0);
  const entries=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const labels=entries.map(([id])=>getCat(id,'expense').emoji+' '+getCat(id,'expense').name);
  const vals=entries.map(([,v])=>v);
  const colors=entries.map((_,i)=>CH_COLORS[i%CH_COLORS.length]);
  if(chPie){chPie.destroy();chPie=null;}
  const ctx=document.getElementById('ch-pie').getContext('2d');
  if(!vals.length){ctx.clearRect(0,0,300,200);document.getElementById('pie-leg').innerHTML='<div style="text-align:center;color:var(--tt);font-size:12px;padding:10px">Nessuna spesa</div>';return;}
  chPie=new Chart(ctx,{type:'doughnut',animation:{animateRotate:true,duration:700,easing:'easeOutQuart'},data:{labels,datasets:[{data:vals,backgroundColor:colors,borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:i=>' '+fmt(i.raw)+' ('+((i.raw/total)*100).toFixed(1)+'%)'}}},cutout:'65%'}});
  document.getElementById('pie-leg').innerHTML=entries.map(([id,v],i)=>{
    const cat=getCat(id,'expense');
    return`<div class="leg-it"><div class="leg-left"><div class="leg-dot" style="background:${colors[i]}"></div><div class="leg-lbl">${cat.emoji} ${cat.name}</div></div><span class="leg-pct">${((v/total)*100).toFixed(1)}%</span><span class="leg-val">${fmt(v)}</span></div>`;
  }).join('');
}
function renderBar(start,end){
  if(chBar){chBar.destroy();chBar=null;}
  let labels=[],incData=[],expData=[];
  if(stPrd==='week'){
    for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);const ds=d.toISOString().split('T')[0];labels.push(d.toLocaleDateString('it-IT',{weekday:'short'}));const r=prdTotals(new Date(ds+'T00:00:00'),new Date(ds+'T00:00:00'));incData.push(r.inc);expData.push(r.exp);}
  }else if(stPrd==='month'){
    const mo=start.getMonth(),yr=start.getFullYear(),weeks=[];let cur=new Date(start);
    while(cur<=end){const ws=new Date(cur);const we=new Date(cur);we.setDate(cur.getDate()+6);if(we>end)we.setTime(end.getTime());weeks.push({s:new Date(ws),e:new Date(we)});cur.setDate(cur.getDate()+7);}
    weeks.forEach((w,i)=>{labels.push('Sett.'+(i+1));const r=prdTotalsFiltered(w.s,w.e,accId);incData.push(r.inc);expData.push(r.exp);});
  }else{
    for(let m=0;m<12;m++){const ms=new Date(start.getFullYear(),m,1),me=new Date(start.getFullYear(),m+1,0);labels.push(ms.toLocaleDateString('it-IT',{month:'short'}));const r=prdTotalsFiltered(ms,me,accId);incData.push(r.inc);expData.push(r.exp);}
  }
  const ctx=document.getElementById('ch-bar').getContext('2d');
  chBar=new Chart(ctx,{type:'bar',animation:{duration:600,easing:'easeOutQuart'},data:{labels,datasets:[{label:'Entrate',data:incData,backgroundColor:'rgba(48,209,88,.5)',borderColor:'#30d158',borderWidth:1.5,borderRadius:4},{label:'Uscite',data:expData,backgroundColor:'rgba(255,69,58,.5)',borderColor:'#ff453a',borderWidth:1.5,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#98989d',font:{size:11,family:'Figtree'},boxWidth:10}}},scales:{x:{ticks:{color:'#636366',font:{size:10,family:'Figtree'}},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'#636366',font:{size:10,family:'Figtree'},callback:v=>getSym()+fmtN(v)},grid:{color:'rgba(255,255,255,.07)'}}}}});
}
function renderLine(start,end,accId){
  if(chLine){chLine.destroy();chLine=null;}
  let labels=[],balData=[];
  const sortedTx=[...D.transactions].sort((a,b)=>a.date.localeCompare(b.date));
  let runBal;
  if(accId){
    const acc=D.accounts.find(a=>a.id===accId);
    runBal=Number((acc&&acc.initialBalance)||0);
  }else{
    runBal=D.accounts.reduce((s,a)=>s+Number(a.initialBalance||0),0);
  }
  sortedTx.forEach(t=>{
    if(pDate(t.date)<start){
      if(accId&&t.accountId!==accId)return;
      if(t.type==='income'||t.type==='transfer-in')runBal+=Number(t.amount);
      else runBal-=Number(t.amount);
    }
  });
  if(stPrd==='week'){
    for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);const ds=d.toISOString().split('T')[0];labels.push(d.toLocaleDateString('it-IT',{weekday:'short'}));sortedTx.filter(t=>t.date===ds).forEach(t=>{runBal+=t.type==='income'?Number(t.amount):-Number(t.amount);});balData.push(runBal);}
  }else if(stPrd==='month'){
    const daysInMonth=end.getDate();
    for(let i=1;i<=daysInMonth;i++){const ds=`${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;sortedTx.filter(t=>t.date===ds&&(!accId||t.accountId===accId)).forEach(t=>{if(t.type==='income'||t.type==='transfer-in')runBal+=Number(t.amount);else runBal-=Number(t.amount);});if(i%3===0||i===daysInMonth){labels.push(String(i));balData.push(runBal);}else{labels.push('');}}
  }else{
    for(let m=0;m<12;m++){const ms=new Date(start.getFullYear(),m,1),me=new Date(start.getFullYear(),m+1,0);sortedTx.filter(t=>inRng(t.date,ms,me)&&(!accId||t.accountId===accId)).forEach(t=>{if(t.type==='income'||t.type==='transfer-in')runBal+=Number(t.amount);else runBal-=Number(t.amount);});labels.push(ms.toLocaleDateString('it-IT',{month:'short'}));balData.push(runBal);}
  }
  const ctx=document.getElementById('ch-line').getContext('2d');
  const grad=ctx.createLinearGradient(0,0,0,190);grad.addColorStop(0,'rgba(79,142,247,.3)');grad.addColorStop(1,'rgba(79,142,247,0)');
  chLine=new Chart(ctx,{type:'line',animation:{duration:700,easing:'easeOutQuart'},data:{labels,datasets:[{label:'Saldo',data:balData,borderColor:'#4f8ef7',backgroundColor:grad,borderWidth:2,pointRadius:0,pointHoverRadius:4,fill:true,tension:.4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#636366',font:{size:10,family:'Figtree'},maxRotation:0},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'#636366',font:{size:10,family:'Figtree'},callback:v=>getSym()+fmtN(v)},grid:{color:'rgba(255,255,255,.07)'}}}}});
}

// ── COMPARISON CHART ────────────────────────────────────────────────────────
function setCmpType(t){
  cmpType=t;
  document.getElementById('cmp-bar-btn').classList.toggle('act',t==='bar');
  document.getElementById('cmp-line-btn').classList.toggle('act',t==='line');
  const{start,end}=getPrdRange();
  renderComparison(start,end,stAccFilter);
}

function getPrevRange(start,end){
  if(stPrd==='week'){const d=7;const ps=new Date(start);ps.setDate(ps.getDate()-d);const pe=new Date(end);pe.setDate(pe.getDate()-d);return{start:ps,end:pe};}
  if(stPrd==='month'){const ps=new Date(start.getFullYear(),start.getMonth()-1,1);const pe=new Date(start.getFullYear(),start.getMonth(),0);return{start:ps,end:pe};}
  const ps=new Date(start.getFullYear()-1,0,1);const pe=new Date(start.getFullYear()-1,11,31);return{start:ps,end:pe};
}

function renderComparison(start,end,accId){
  if(chCmp){chCmp.destroy();chCmp=null;}
  const prev=getPrevRange(start,end);
  let labels=[],curInc=[],curExp=[],prvInc=[],prvExp=[];
  if(stPrd==='week'){
    for(let i=0;i<7;i++){
      const dc=new Date(start);dc.setDate(start.getDate()+i);
      const dp=new Date(prev.start);dp.setDate(prev.start.getDate()+i);
      labels.push(dc.toLocaleDateString('it-IT',{weekday:'short'}));
      const rc=prdTotalsFiltered(new Date(dc.toISOString().split('T')[0]+'T00:00:00'),new Date(dc.toISOString().split('T')[0]+'T00:00:00'),accId);
      const rp=prdTotalsFiltered(new Date(dp.toISOString().split('T')[0]+'T00:00:00'),new Date(dp.toISOString().split('T')[0]+'T00:00:00'),accId);
      curInc.push(rc.inc);curExp.push(rc.exp);prvInc.push(rp.inc);prvExp.push(rp.exp);
    }
  }else if(stPrd==='month'){
    const weeks=Math.ceil(end.getDate()/7);
    for(let i=0;i<weeks;i++){
      const ws=new Date(start.getFullYear(),start.getMonth(),i*7+1);
      const we=new Date(start.getFullYear(),start.getMonth(),Math.min((i+1)*7,end.getDate()));
      const pws=new Date(prev.start.getFullYear(),prev.start.getMonth(),i*7+1);
      const pwe=new Date(prev.start.getFullYear(),prev.start.getMonth(),Math.min((i+1)*7,prev.end.getDate()));
      labels.push('Sett.'+(i+1));
      const rc=prdTotalsFiltered(ws,we,accId);const rp=prdTotalsFiltered(pws,pwe,accId);
      curInc.push(rc.inc);curExp.push(rc.exp);prvInc.push(rp.inc);prvExp.push(rp.exp);
    }
  }else{
    for(let m=0;m<12;m++){
      const cms=new Date(start.getFullYear(),m,1),cme=new Date(start.getFullYear(),m+1,0);
      const pms=new Date(prev.start.getFullYear(),m,1),pme=new Date(prev.start.getFullYear(),m+1,0);
      labels.push(cms.toLocaleDateString('it-IT',{month:'short'}));
      const rc=prdTotalsFiltered(cms,cme,accId);const rp=prdTotalsFiltered(pms,pme,accId);
      curInc.push(rc.inc);curExp.push(rc.exp);prvInc.push(rp.inc);prvExp.push(rp.exp);
    }
  }
  const curLbl=getPrdLbl({start,end});const prvLbl=getPrdLbl(prev);
  const ctx=document.getElementById('ch-cmp').getContext('2d');
  if(cmpType==='bar'){
    chCmp=new Chart(ctx,{type:'bar',animation:{duration:600,easing:'easeOutQuart'},data:{labels,datasets:[
      {label:curLbl+' Uscite',data:curExp,backgroundColor:'rgba(255,69,58,.6)',borderColor:'#ff453a',borderWidth:1.5,borderRadius:3},
      {label:prvLbl+' Uscite',data:prvExp,backgroundColor:'rgba(255,69,58,.25)',borderColor:'rgba(255,69,58,.5)',borderWidth:1,borderRadius:3},
      {label:curLbl+' Entrate',data:curInc,backgroundColor:'rgba(48,209,88,.6)',borderColor:'#30d158',borderWidth:1.5,borderRadius:3},
      {label:prvLbl+' Entrate',data:prvInc,backgroundColor:'rgba(48,209,88,.25)',borderColor:'rgba(48,209,88,.5)',borderWidth:1,borderRadius:3},
    ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#636366',font:{size:10,family:'Figtree'}},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'#636366',font:{size:10,family:'Figtree'},callback:v=>getSym()+fmtN(v)},grid:{color:'rgba(255,255,255,.07)'}}}}});
  }else{
    chCmp=new Chart(ctx,{type:'line',animation:{duration:700,easing:'easeOutQuart'},data:{labels,datasets:[
      {label:curLbl+' Uscite',data:curExp,borderColor:'#ff453a',backgroundColor:'transparent',borderWidth:2,pointRadius:2,tension:.4},
      {label:prvLbl+' Uscite',data:prvExp,borderColor:'rgba(255,69,58,.4)',backgroundColor:'transparent',borderWidth:1.5,pointRadius:1,borderDash:[4,3],tension:.4},
      {label:curLbl+' Entrate',data:curInc,borderColor:'#30d158',backgroundColor:'transparent',borderWidth:2,pointRadius:2,tension:.4},
      {label:prvLbl+' Entrate',data:prvInc,borderColor:'rgba(48,209,88,.4)',backgroundColor:'transparent',borderWidth:1.5,pointRadius:1,borderDash:[4,3],tension:.4},
    ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#636366',font:{size:10,family:'Figtree'}},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'#636366',font:{size:10,family:'Figtree'},callback:v=>getSym()+fmtN(v)},grid:{color:'rgba(255,255,255,.07)'}}}}});
  }
  // Legend
  const leg=document.getElementById('cmp-legend');
  leg.innerHTML=`<span style="color:#ff453a">▬</span> ${curLbl} &nbsp; <span style="color:rgba(255,69,58,.5)">╌</span> ${prvLbl} &nbsp; <span style="color:#30d158">▬</span> Entrate &nbsp; <span style="color:#ff453a">▬</span> Uscite`;
}

// ── TOP CATEGORIES ──────────────────────────────────────────────────────────
function renderTopCats(start,end,accId){
  // Called from renderStats passing params, or from onchange with no params
  if(!start){
    const r=getPrdRange();start=r.start;end=r.end;accId=stAccFilter;
  }
  const n=parseInt(document.getElementById('top-n-sel')?.value||5)||999;
  const byCat=expByCat(start,end,accId);
  const total=Object.values(byCat).reduce((a,b)=>a+b,0);
  const sorted=Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,n||999);
  const list=document.getElementById('top-cats-list');
  if(!list)return;
  if(!sorted.length){list.innerHTML='<div style="text-align:center;color:var(--tt);font-size:12px;padding:12px">Nessuna spesa nel periodo</div>';return;}
  list.innerHTML=sorted.map(([id,v],i)=>{
    const cat=getCat(id,'expense');
    const pct=total>0?((v/total)*100).toFixed(1):0;
    const barW=total>0?((v/sorted[0][1])*100).toFixed(1):0;
    return`<div class="top-cat-row">
      <div class="top-cat-rank">${i+1}</div>
      <div class="top-cat-ic">${cat.emoji}</div>
      <div class="top-cat-info">
        <div class="top-cat-nm">${cat.name}</div>
        <div class="top-cat-bar-wrap"><div class="top-cat-bar" style="width:${barW}%"></div></div>
      </div>
      <div class="top-cat-pct">${pct}%</div>
      <div class="top-cat-val">${fmt(v)}</div>
    </div>`;
  }).join('');
}

// ── STATS RECURRING ───────────────────────────────────────────────────────
function togStRec(){
  D.settings.showRecInStats=!D.settings.showRecInStats;saveData();
  const chip=document.getElementById('st-chip-rec');
  if(chip)chip.classList.toggle('act',!!D.settings.showRecInStats);
  renderStats();
}
function getRecTotalsForPeriod(start,end,accId){
  let inc=0,exp=0;
  const startStr=start.toISOString().split('T')[0];
  const endStr=end.toISOString().split('T')[0];
  const td=today();
  (D.recurring||[]).forEach(r=>{
    if(!r.active)return;
    if(accId&&r.accountId!==accId)return;
    let next=r.nextDate||r.startDate;
    let safety=0;
    while(next<=endStr&&safety<200){
      safety++;
      if(next>=startStr&&next>td){r.type==='income'?inc+=Number(r.amount):exp+=Number(r.amount);}
      next=nextDateRec(next,r.frequency,r.dayOfMonth||null);
    }
  });
  return{inc,exp};
}
