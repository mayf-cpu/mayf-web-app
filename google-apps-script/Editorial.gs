/** @OnlyCurrentDoc
 * Bound to the MAYF Content Registry. Run installEditorialAutomation once.
 * Script properties: MAYF_WEBHOOK_URL (https://mayf.co.in/api/ingestion/webhook)
 * and MAYF_INGESTION_WEBHOOK_SECRET (same 32+ character secret as the Worker).
 * AI/API writes do not fire onEdit, so the five-minute poll is required too.
 */
function onOpen(){SpreadsheetApp.getUi().createMenu('MAYF Approval').addItem('Process approval queue','processEditorialQueue').addItem('Refresh grades and categories','refreshEditorialOptions').addItem('Install automation','installEditorialAutomation').addToUi();}
function editorialSheet_(){return SpreadsheetApp.getActive().getSheetByName('Content Registry');}
function editorialRead_(sheet,row){const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];const values=sheet.getRange(row,1,1,headers.length).getValues()[0];return Object.fromEntries(headers.map((key,i)=>[key,values[i] instanceof Date?values[i].toISOString():values[i]]));}
function editorialWrite_(sheet,row,patch){const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];Object.entries(patch).forEach(([key,value])=>{const col=headers.indexOf(key);if(col<0)throw new Error('Missing column '+key);const cell=sheet.getRange(row,col+1);cell.setNumberFormat('@');cell.setValue(typeof value==='string'&&/^[=+@]/.test(value)?"'"+value:value);});SpreadsheetApp.flush();}
function editorialIdentity_(row){const copy={...row};['status','firestore_id','import_status','import_error','last_imported_at','regeneration_status','regeneration_error','last_attempt_at'].forEach(key=>delete copy[key]);return JSON.stringify(copy);}
function editorialRequest_(action,payload){
 const props=PropertiesService.getScriptProperties();const url=props.getProperty('MAYF_WEBHOOK_URL')||'';const secret=props.getProperty('MAYF_INGESTION_WEBHOOK_SECRET')||'';
 if(url!=='https://mayf.co.in/api/ingestion/webhook'||secret.length<32)throw new Error('Configure the production webhook URL and matching secret in Script Properties.');
 const target=action==='regenerate'?url.replace(/webhook$/,'regenerate'):url;
 const response=UrlFetchApp.fetch(target,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+secret},payload:JSON.stringify(payload),muteHttpExceptions:true,followRedirects:false});
 let data;try{data=JSON.parse(response.getContentText());}catch{throw new Error('Website returned a non-JSON response ('+response.getResponseCode()+').');}
 if(response.getResponseCode()>=300||!data.success)throw new Error(data.error||data.results?.[0]?.import_error||'Website request failed.');return data;
}
function installEditorialAutomation(){
 const sheet=editorialSheet_();if(!sheet)throw new Error('Content Registry tab is missing.');
 PropertiesService.getScriptProperties().setProperty('MAYF_SPREADSHEET_ID',SpreadsheetApp.getActive().getId());
 ScriptApp.getProjectTriggers().filter(t=>['editorialOnEdit','processEditorialQueue'].includes(t.getHandlerFunction())).forEach(t=>ScriptApp.deleteTrigger(t));
 ScriptApp.newTrigger('editorialOnEdit').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
 ScriptApp.newTrigger('processEditorialQueue').timeBased().everyMinutes(5).create();
 refreshEditorialOptions();
 SpreadsheetApp.getUi().alert('Triggers installed. Confirm the matching webhook secret and server deployment before approving real rows.');
}
function editorialOnEdit(event){
 if(!event?.range||event.range.getSheet().getName()!=='Content Registry'||event.range.getLastRow()<2)return;
 const sheet=event.range.getSheet();const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];
 const changed=headers.slice(event.range.getColumn()-1,event.range.getLastColumn());
 const outputs=['status','firestore_id','import_status','import_error','last_imported_at','regeneration_status','regeneration_error','revision','last_attempt_at'];
 for(let r=Math.max(2,event.range.getRow());r<=event.range.getLastRow();r++){
  const row=editorialRead_(sheet,r);if(!row.title&&!row.content_id)continue;
  const patch={};if(!row.content_id)patch.content_id='MAYF-'+Utilities.getUuid();
  if(!row.approval_status||(!changed.includes('approval_status')&&changed.some(key=>!outputs.includes(key))))patch.approval_status='Pending';
  if(changed.some(key=>!outputs.includes(key))){patch.import_status='PENDING';patch.import_error='';patch.regeneration_status='';patch.regeneration_error='';}
  editorialWrite_(sheet,r,patch);
  if(changed.includes('category')){
   const options=sheet.getParent().getSheetByName('Options');const entries=options?options.getDataRange().getDisplayValues():[];
   const topics=entries.filter(values=>values[0]==='Subject / subcategory'&&values[1]===row.category&&values[2]!=='No saved subcategory').map(values=>values[2]);
   const col=headers.indexOf('subcategory');if(col>=0){const cell=sheet.getRange(r,col+1);if(topics.length)cell.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(topics,true).setAllowInvalid(false).build());else cell.clearDataValidations();}
  }
 }
 processEditorialQueue();
}
function processEditorialQueue(){
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
 try{
  const id=PropertiesService.getScriptProperties().getProperty('MAYF_SPREADSHEET_ID');
  const book=SpreadsheetApp.getActive();if(!book||(id&&book.getId()!==id))throw new Error('The bound approval spreadsheet is unavailable.');const sheet=book.getSheetByName('Content Registry');if(!sheet)return;
  const start=Date.now();let processed=0;const all=sheet.getDataRange().getValues();const headers=all[0];
  const count={};all.slice(1).forEach(values=>{const id=values[headers.indexOf('content_id')];if(id)count[id]=(count[id]||0)+1;});
  for(let r=2;r<=all.length&&processed<3&&Date.now()-start<200000;r++){
   let row=editorialRead_(sheet,r);if(!row.title&&!row.content_id)continue;
   if(!row.content_id){editorialWrite_(sheet,r,{content_id:'MAYF-'+Utilities.getUuid()});row=editorialRead_(sheet,r);}
   if(!row.approval_status){editorialWrite_(sheet,r,{approval_status:'Pending',import_status:'PENDING'});continue;}
   if(count[row.content_id]>1){editorialWrite_(sheet,r,{import_status:'FAILED',import_error:'Duplicate content_id. Use one unique ID per resource.'});continue;}
   const grades=[row.class,...Array.from({length:6},(_,i)=>row['grade_'+(i+1)])].filter(Boolean).flatMap(v=>String(v).split(',').map(s=>s.trim())).filter(Boolean);
   const snapshot=editorialIdentity_(row);const isCurrent=()=>editorialIdentity_(editorialRead_(sheet,r))===snapshot;
   if(row.approval_status==='Rejected'&&row.regeneration_status!=='FAILED'){
    processed++;const history=book.getSheetByName('Revision History')||book.insertSheet('Revision History');
    if(!history.getLastRow())history.appendRow(['recorded_at','content_id','revision','rejection_notes','original_row_json']);
    // JSON starts with { and cannot become a sheet formula.
    const safeText=value=>/^[=+@-]/.test(String(value))?"'"+String(value):String(value);
    history.appendRow([new Date().toISOString(),safeText(row.content_id),Number(row.revision)||1,safeText(row.rejection_notes||''),JSON.stringify(row)]);
    editorialWrite_(sheet,r,{regeneration_status:'GENERATING',regeneration_error:'',last_attempt_at:new Date().toISOString()});
    try{
     const result=editorialRequest_('regenerate',{row:{...row,class:[...new Set(grades)].join(', ')}});
     if(!isCurrent())throw new Error('Row changed during regeneration. Review the row and reject again.');
     const allowed=['title','short_description','description','topic','tags','seo_title','seo_description'];const patch={};
     allowed.forEach(key=>{if(typeof result.revision?.[key]!=='string')throw new Error('Incomplete AI revision.');patch[key]=result.revision[key];});
     editorialWrite_(sheet,r,{...patch,approval_status:'Pending',status:'Review',revision:(Number(row.revision)||1)+1,regeneration_status:'READY_FOR_REVIEW',regeneration_error:'',import_status:'PENDING',import_error:'',last_imported_at:''});
    }catch(error){editorialWrite_(sheet,r,{regeneration_status:'FAILED',regeneration_error:String(error.message||error)});}
   }else if(row.approval_status==='Approved'&&!['SUCCESS','FAILED'].includes(row.import_status)){
    if(row.import_status==='IMPORTING'&&Date.now()-Date.parse(row.last_attempt_at||'')<900000)continue;
    processed++;editorialWrite_(sheet,r,{import_status:'IMPORTING',import_error:'',last_attempt_at:new Date().toISOString()});
    try{
     if(!isCurrent())throw new Error('Row changed before import. Review and approve it again.');
     const result=editorialRequest_('import',{action:'import_approved',items:[{...row,class:[...new Set(grades)].join(', '),status:'Approved'}]}).results[0];
     if(!isCurrent())throw new Error('Row changed while importing. The website may hold the previously approved version; review it before reapproving.');
     editorialWrite_(sheet,r,{status:'Imported',firestore_id:result.firestore_id,import_status:'SUCCESS',import_error:'',last_imported_at:result.last_imported_at});
    }catch(error){editorialWrite_(sheet,r,{import_status:'FAILED',import_error:String(error.message||error)});}
   }
  }
 }finally{lock.releaseLock();}
}
function refreshEditorialOptions(){
 const response=UrlFetchApp.fetch('https://mayf.co.in/api/content-classification',{followRedirects:false});const settings=JSON.parse(response.getContentText()).settings;
 const sheet=editorialSheet_();if(!sheet)return;const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];
 const rule=values=>SpreadsheetApp.newDataValidation().requireValueInList(values,true).setAllowInvalid(false).build();
 const set=(key,values)=>{const col=headers.indexOf(key);if(col>=0&&values.length)sheet.getRange(2,col+1,Math.max(sheet.getMaxRows()-1,1),1).setDataValidation(rule(values));};
 set('approval_status',['Pending','Approved','Rejected']);set('category',Object.keys(settings.subjects));
 for(let i=1;i<=6;i++)set('grade_'+i,settings.grades);
 // Subcategories are checked against their selected subject on the next refresh/edit.
 const col=headers.indexOf('subcategory');const subjectCol=headers.indexOf('category');
 if(col>=0&&subjectCol>=0)for(let r=2;r<=sheet.getLastRow();r++){const subject=sheet.getRange(r,subjectCol+1).getDisplayValue();const topics=settings.subjects[subject]||[];const cell=sheet.getRange(r,col+1);if(topics.length)cell.setDataValidation(rule(topics));else cell.clearDataValidations();}
}
