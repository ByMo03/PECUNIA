// ── IMPORT CSV ────────────────────────────────────────────────────────────
function doImportCSV(){
  document.getElementById('csv-import-inp').click();
}
function processImportCSV(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const text=e.target.result;
      const lines=text.split('\n').filter(l=>l.trim());
      if(lines.length<2){toast('⚠️ File CSV vuoto o non valido');return;}
      // Skip header row
      const rows=lines.slice(1).map(line=>{
        const cols=[];let cur='',inQ=false;
        for(let i=0;i<line.length;i++){
          const ch=line[i];
          if(ch==='"'){inQ=!inQ;}
          else if(ch===','&&!inQ){cols.push(cur.trim());cur='';}
          else cur+=ch;
        }
        cols.push(cur.trim());
        return cols;
      }).filter(r=>r.length>=5);
      let imported=0,skipped=0;
      rows.forEach(cols=>{
        const [date,tipo,catName,accName,amtRaw,note]=cols;
        const amount=parseFloat(amtRaw.replace(',','.'));
        if(!date||isNaN(amount)||amount<=0)return;
        const type=tipo&&tipo.toLowerCase().includes('entrata')?'income':'expense';
        // Find category
        const catList=type==='income'?D.categories.income:D.categories.expense;
        const cat=catList.find(c=>c.name.toLowerCase()===catName.toLowerCase())||catList[catList.length-1];
        // Find account
        const acc=D.accounts.find(a=>a.name.toLowerCase()===accName.toLowerCase())||D.accounts[0];
        if(!acc)return;
        // Check duplicate
        const isDup=D.transactions.some(t=>
          t.date===date&&t.type===type&&
          Math.abs(Number(t.amount)-amount)<0.001&&
          t.categoryId===cat.id
        );
        if(isDup){skipped++;return;}
        D.transactions.push({
          id:uid(),type,amount,categoryId:cat.id,
          accountId:acc.id,date:date.trim(),
          note:note||'',receipts:[],createdAt:Date.now()
        });
        imported++;
      });
      saveData();
      input.value='';
      toast(`✅ Importate ${imported} transazioni, ${skipped} duplicate saltate`);
      if(curScr==='dashboard')renderDash();
      if(curScr==='transactions')renderTxList();
    }catch(err){
      toast('❌ Errore importazione: '+err.message);
      console.error(err);
    }
  };
  reader.readAsText(file,'UTF-8');
}
