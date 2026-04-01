// ── UTILS ──────────────────────────────────────────────────────────────────
function uid(){return Math.random().toString(36).substr(2,9)+Date.now().toString(36);}
function today(){return new Date().toISOString().split('T')[0];}
function fmtN(n){return Number(n).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2});}
function fmt(n){return getSym()+fmtN(n);}
function getSym(){return(CURRENCIES.find(c=>c.code===D.settings.currency)||CURRENCIES[0]).sym;}
function pDate(s){return new Date(s+'T00:00:00');}
function inRng(ds,s,e){const d=pDate(ds);return d>=s&&d<=e;}
function getMo(off=0){const n=new Date();return{start:new Date(n.getFullYear(),n.getMonth()+off,1),end:new Date(n.getFullYear(),n.getMonth()+off+1,0)};}
function getWk(off=0){const n=new Date(),day=n.getDay(),mon=new Date(n);mon.setDate(n.getDate()-(day===0?6:day-1)+off*7);const sun=new Date(mon);sun.setDate(mon.getDate()+6);return{start:mon,end:sun};}
function getYr(off=0){const y=new Date().getFullYear()+off;return{start:new Date(y,0,1),end:new Date(y,11,31)};}
function wkLbl(r){return r.start.toLocaleDateString('it-IT',{day:'2-digit',month:'short'})+' – '+r.end.toLocaleDateString('it-IT',{day:'2-digit',month:'short'});}
function moLbl(r){return r.start.toLocaleDateString('it-IT',{month:'long',year:'numeric'});}
function yrLbl(r){return String(r.start.getFullYear());}
function getCat(id,type){const l=type==='expense'?D.categories.expense:D.categories.income;return l.find(c=>c.id===id)||{name:'Senza categoria',emoji:'❓'};}
function getAcc(id){return D.accounts.find(a=>a.id===id)||{name:'Conto eliminato',emoji:'❓',color:'#888'};}
function accBal(id){
  const acc=D.accounts.find(a=>a.id===id);if(!acc)return 0;
  let b=Number(acc.initialBalance)||0;
  D.transactions.forEach(t=>{
    if(t.accountId===id){
      if(t.type==='income'||t.type==='transfer-in')b+=Number(t.amount);
      else b-=Number(t.amount);
    }
  });
  return b;
}
function totalBal(){return D.accounts.reduce((s,a)=>s+accBal(a.id),0);}
function moTotals(){
  const{start,end}=getMo(0);let inc=0,exp=0;
  D.transactions.forEach(t=>{if(inRng(t.date,start,end)&&t.type!=='transfer-out'&&t.type!=='transfer-in'){t.type==='income'?inc+=Number(t.amount):exp+=Number(t.amount);}});
  // Include future recurring if toggle is on
  if(D.settings&&D.settings.showFutureRec){
    getFutureRec(start,end).forEach(f=>{f.type==='income'?inc+=Number(f.amount):exp+=Number(f.amount);});
  }
  return{inc,exp};
}
function prdTotals(s,e){
  let inc=0,exp=0;
  D.transactions.forEach(t=>{if(inRng(t.date,s,e)&&t.type!=='transfer-out'&&t.type!=='transfer-in'){t.type==='income'?inc+=Number(t.amount):exp+=Number(t.amount);}});
  return{inc,exp};
}
function prdTotalsFiltered(s,e,accId){
  let inc=0,exp=0;
  D.transactions.forEach(t=>{
    if(!inRng(t.date,s,e))return;
    if(t.type==='transfer-out'||t.type==='transfer-in')return;
    if(accId&&t.accountId!==accId)return;
    t.type==='income'?inc+=Number(t.amount):exp+=Number(t.amount);
  });
  return{inc,exp};
}
function expByCat(s,e,accId){
  const m={};
  D.transactions.forEach(t=>{
    if(t.type==='expense'&&inRng(t.date,s,e)&&(!accId||t.accountId===accId))
      m[t.categoryId]=(m[t.categoryId]||0)+Number(t.amount);
  });
  return m;
}
function freqLbl(f){return{daily:'Giornaliera',weekly:'Settimanale',monthly:'Mensile',yearly:'Annuale'}[f]||f;}
function nextDate(ds,freq){
  const d=new Date(ds+'T00:00:00');
  if(freq==='daily')d.setDate(d.getDate()+1);
  else if(freq==='weekly')d.setDate(d.getDate()+7);
  else if(freq==='monthly')d.setMonth(d.getMonth()+1);
  else if(freq==='yearly')d.setFullYear(d.getFullYear()+1);
  return d.toISOString().split('T')[0];
}
function toast(msg,dur=2400){
  const el=document.getElementById('toast');
  el.textContent=msg;el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),dur);
}

// ── INIT ───────────────────────────────────────────────────────────────────


function nextDateRec(ds,freq,dayOfMonth){
  const d=new Date(ds+'T00:00:00');
  if(freq==='daily'){d.setDate(d.getDate()+1);}
  else if(freq==='weekly'){d.setDate(d.getDate()+7);}
  else if(freq==='monthly'){
    d.setMonth(d.getMonth()+1);
    if(dayOfMonth){const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(dayOfMonth,last));}
  }else if(freq==='yearly'){
    d.setFullYear(d.getFullYear()+1);
    if(dayOfMonth){const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(dayOfMonth,last));}
  }
  return d.toISOString().split('T')[0];
}
function processRec(){
  if(!D.recurring||!D.recurring.length)return;
  const td=today();let changed=false;
  D.recurring.forEach(r=>{
    if(!r.active)return;
    let next=r.nextDate||r.startDate;
    while(next<=td){
      const title=r.title||r.note||'';
      D.transactions.push({id:uid(),type:r.type,amount:r.amount,categoryId:r.categoryId,accountId:r.accountId,date:next,note:title,recurringId:r.id,createdAt:Date.now()});
      next=nextDateRec(next,r.frequency,r.dayOfMonth||null);
      changed=true;
    }
    r.nextDate=next;
  });
  if(changed)saveData();
}