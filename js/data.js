// ── DATA ───────────────────────────────────────────────────────────────────
let D={};
function loadData(){try{const r=localStorage.getItem(SK);return r?JSON.parse(r):null;}catch{return null;}}
function saveData(){
  try{localStorage.setItem(SK,JSON.stringify(D));}catch(e){console.warn('localStorage non disponibile:',e);}
  try{driveSyncDebounced();}catch(e){console.warn('Drive sync error:',e);}
}
function migrateData(d){
  if((d.schemaVersion||1) < 2){
    if(!d.contacts)d.contacts=[];
    if(!d.debts)d.debts=[];
    if(!d.groups)d.groups=[];
  }
  if((d.schemaVersion||1) < 3){
    if(d.categories){
      ['expense','income'].forEach(type=>{
        if(d.categories[type])d.categories[type].forEach(c=>{if(c.custom===undefined)c.custom=false;});
      });
    }
    if(d.contacts)d.contacts.forEach(c=>{if(!c.phone)c.phone='';if(!c.notes)c.notes='';});
  }
  if((d.schemaVersion||1) < 4){
    if(!d.profile)d.profile={firstName:'',lastName:'',phone:'',profileBannerDismissed:false};
    if(d.groups)d.groups.forEach(g=>{if(!g.me)g.me=g.members[0]||'';});
    if(d.groups)d.groups.forEach(g=>{
      if(!g.settlements)g.settlements=[];
      if(g.expenses)g.expenses.forEach(e=>{
        if(e.settlements&&e.settlements.length){g.settlements.push(...e.settlements);e.settlements=[];}
      });
    });
  }
  if((d.schemaVersion||1) < 5){
    if(!d.tour)d.tour={completed:false,skipped:false};
  }
  if((d.schemaVersion||1) < 6){
    if(d.transactions)d.transactions.forEach(tx=>{
      if(tx.receipts)tx.receipts.forEach(r=>{
        if(r.dataUrl&&!r.pendingMigration)r.pendingMigration=true;
      });
    });
    d.receiptsMigrated=false;
  }
  if((d.schemaVersion||1) < 7){
    if(d.settings&&d.settings.showFutureRec===undefined)d.settings.showFutureRec=false;
    if(d.debts)d.debts.forEach(debt=>{if(debt.linkedTxId===undefined)debt.linkedTxId=null;});
  }
  if((d.schemaVersion||1) < 8){
    if(d.recurring)d.recurring.forEach(r=>{if(!r.title)r.title='';});
    if(d.settings){
      if(d.settings.showRecInStats===undefined)d.settings.showRecInStats=false;
      if(d.settings.pinEnabled===undefined)d.settings.pinEnabled=!!(d.settings.pin);
    }
  }
  if((d.schemaVersion||1) < 9){
    // Add account order array (stores account IDs in display order)
    if(!d.accountOrder)d.accountOrder=[];
  }
  d.schemaVersion=SCHEMA_VERSION;
  return d;
}
function initData(){
  const ex=loadData();
  if(ex){D=migrateData(ex);return;}
  D={version:1,schemaVersion:SCHEMA_VERSION,
    settings:{pin:'1234',currency:'EUR',budgetMonthly:null,budgetEnabled:false,showFutureRec:false,showRecInStats:false,pinEnabled:true},
    accounts:[
      {id:uid(),name:'Contanti',emoji:'💰',color:'#30d158',initialBalance:0},
      {id:uid(),name:'Bancomat',emoji:'💳',color:'#4f8ef7',initialBalance:0}
    ],
    categories:{expense:[...DEF_EXP_CATS],income:[...DEF_INC_CATS]},
    transactions:[],recurring:[],contacts:[],debts:[],groups:[],
    profile:{firstName:'',lastName:'',phone:'',profileBannerDismissed:false},
    tour:{completed:false,skipped:false},
    accountOrder:[],
    pendingDeletions:[]
  };
  saveData();
}
