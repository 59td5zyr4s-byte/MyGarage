const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORAGE_KEY='mygarage.v1';
let bikes=[], activeTab='home', selectedCompare=[], lastPage='garage';
const fields=['name','brand','year','status','price','cc','kw','hp','weight','speed','torque','consumption','tank','a2','type','notes'];
function load(){try{bikes=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{bikes=[]} renderAll()}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(bikes));renderAll()}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function val(b,k){return b[k]!==undefined&&b[k]!==''&&b[k]!==null?b[k]:null}
function money(n){return n==null?'—':new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n))}
function specNum(n,unit=''){return n==null?'—':`${n}${unit}`}
function statusLabel(s){return s==='wish'?'En deseos':s==='past'?'Tuviste esta moto':'En mi garaje'}
function a2Label(v){return ({yes:'Limitable A2',no:'No A2',factory:'A2 de fábrica',unknown:'A2 sin confirmar'})[v]||'A2 sin confirmar'}
function visual(){return '<div class="bike-visual" aria-hidden="true">♧</div>'}
function card(b){return `<article class="bike-card" data-id="${esc(b.id)}">${visual()}<div class="bike-card-body"><span class="chip">${esc(statusLabel(b.status))}</span><h3 style="margin-top:9px">${esc(b.name)}</h3><div class="subline">${esc([b.brand,b.year].filter(Boolean).join(' · ')||'Sin datos de marca/año')}</div><div class="subline">${b.cc?esc(b.cc)+' cc':''}${b.hp?' · '+esc(b.hp)+' CV':''}</div><button class="mini-btn gold" data-detail="${esc(b.id)}">Ver ficha ↗</button></div></article>`}
function row(b){return `<article class="bike-row" data-id="${esc(b.id)}">${visual()}<div class="row-main"><h3>${esc(b.name)}</h3><p>${esc([b.brand,b.year].filter(Boolean).join(' · ')||'Marca/año sin indicar')} · ${esc(statusLabel(b.status))}</p><div class="row-actions"><button class="mini-btn gold" data-detail="${esc(b.id)}">Ficha técnica</button><button class="mini-btn" data-edit="${esc(b.id)}">Editar</button><button class="mini-btn danger" data-delete="${esc(b.id)}">Eliminar</button></div></div></article>`}
function setEmpty(id,show){$(id).classList.toggle('show',show)}
function renderAll(){
 const owned=bikes.filter(b=>b.status==='owned'||b.status==='past'), wish=bikes.filter(b=>b.status==='wish');
 $('#ownedCount').textContent=bikes.filter(b=>b.status==='owned').length;
 $('#wishCount').textContent=wish.length;
 const total=bikes.filter(b=>b.status==='owned'&&Number(b.price)>0).reduce((s,b)=>s+Number(b.price),0);
 $('#totalValue').textContent=total?money(total):'—';
 $('#homeGarage').innerHTML=owned.slice(0,4).map(card).join('');
 setEmpty('#homeEmpty',owned.length===0);
 $('#garageList').innerHTML=owned.map(row).join('');setEmpty('#garageEmpty',owned.length===0);
 $('#wishList').innerHTML=wish.map(row).join('');setEmpty('#wishEmpty',wish.length===0);
 selectedCompare=selectedCompare.filter(id=>bikes.some(b=>b.id===id));
 renderCompare();
}
function goto(tab){
 if(!$('#'+tab))return;
 activeTab=tab;$$('.page').forEach(p=>p.classList.toggle('active',p.id===tab));
 $$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
 $('#fab').style.display=['garage','wishlist','home'].includes(tab)?'grid':'none';
 window.scrollTo({top:0,behavior:'smooth'});
}
function openForm(status='owned',id=null){
 const form=$('#bikeForm');form.reset();$('#bikeId').value='';
 $('#formTitle').textContent=id?'Editar moto':'Añadir moto';
 const b=id?bikes.find(x=>x.id===id):null;
 if(b){fields.forEach(k=>{const el=$('#'+k);if(el)el.value=b[k]??''});}
 else $('#status').value=status;
 $('#bikeDialog').showModal();
}
function closeForm(){$('#bikeDialog').close()}
function readForm(){
 const b={id:$('#bikeId').value||crypto.randomUUID()};
 fields.forEach(k=>{const el=$('#'+k);if(el)b[k]=el.value.trim()});
 ['year','price','cc','kw','hp','weight','speed','torque','consumption','tank'].forEach(k=>b[k]=b[k]===''?null:Number(b[k]));
 return b;
}
function saveForm(e){
 e.preventDefault();const b=readForm();if(!b.name){toast('Ponle un nombre a la moto');return}
 const i=bikes.findIndex(x=>x.id===b.id);if(i>=0)bikes[i]=b;else bikes.unshift(b);
 save();closeForm();goto(b.status==='wish'?'wishlist':'garage');toast(i>=0?'Ficha actualizada':'Moto guardada en MyGarage');
}
function detail(id){
 const b=bikes.find(x=>x.id===id);if(!b)return;lastPage=activeTab;
 $('#detailContent').innerHTML=`<div class="detail-hero"><span class="chip">${esc(statusLabel(b.status))}</span>${visual()}<h1>${esc(b.name)}</h1><p class="muted">${esc([b.brand,b.year,b.type].filter(Boolean).join(' · ')||'Marca y tipo sin indicar')}</p><div class="detail-actions"><button class="gold-btn" data-edit="${esc(b.id)}">Editar ficha</button><button class="outline-btn" data-move="${esc(b.id)}">${b.status==='wish'?'Mover al garaje':'Añadir a deseos'}</button></div></div>
 <div class="detail-grid">
 ${spec('Cilindrada',specNum(b.cc,' cc'))}${spec('Potencia',b.hp!=null?specNum(b.hp,' CV'):specNum(b.kw,' kW'))}
 ${spec('Velocidad máxima',specNum(b.speed,' km/h'))}${spec('Peso',specNum(b.weight,' kg'))}
 ${spec('Par motor',specNum(b.torque,' Nm'))}${spec('Consumo',specNum(b.consumption,' L/100 km'))}
 ${spec('Depósito',specNum(b.tank,' L'))}${spec('Precio / valor',money(val(b,'price')))}
 ${spec('Limitación A2',a2Label(b.a2))}${spec('Año',specNum(b.year))}
 </div><div class="detail-section"><h2>Notas</h2><div class="detail-notes">${esc(b.notes||'Todavía no has añadido notas a esta ficha.')}</div></div><p class="footnote">Los datos de esta ficha los has introducido tú. Verifica las especificaciones, especialmente potencia, homologación A2 y velocidad máxima, con fuentes oficiales o pruebas fiables.</p>`;
 goto('details');
}
function spec(label,value){return `<div class="spec"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`}
function renderCompare(){
 const all=bikes;$('#comparePicker').innerHTML=all.map(b=>`<label class="pick-row"><input type="checkbox" data-pick="${esc(b.id)}" ${selectedCompare.includes(b.id)?'checked':''} ${selectedCompare.length>=3&&!selectedCompare.includes(b.id)?'disabled':''}><span style="flex:1">${esc(b.name)}<small style="display:block;color:var(--muted);margin-top:3px">${esc(statusLabel(b.status))}</small></span><span class="chip">${b.cc?esc(b.cc)+' cc':'Moto'}</span></label>`).join('');
 setEmpty('#compareEmpty',all.length===0);
 const picked=selectedCompare.map(id=>bikes.find(b=>b.id===id)).filter(Boolean);
 if(!picked.length){$('#comparison').innerHTML='';return}
 const rows=[['Marca','brand'],['Año','year'],['Cilindrada','cc',' cc'],['Potencia (kW)','kw',' kW'],['Potencia (CV)','hp',' CV'],['Velocidad máxima','speed',' km/h'],['Peso','weight',' kg'],['Par motor','torque',' Nm'],['Consumo','consumption',' L/100 km'],['Depósito','tank',' L'],['Precio / valor','price','€'],['Limitación A2','a2']];
 $('#comparison').innerHTML=`<table><thead><tr><th>Dato</th>${picked.map(b=>`<th>${esc(b.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,key,unit=''])=>`<tr><td>${esc(label)}</td>${picked.map(b=>`<td>${esc(key==='a2'?a2Label(b[key]):key==='price'?(val(b,key)==null?'—':money(b[key])):specNum(val(b,key),unit))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(window._toastTimer);window._toastTimer=setTimeout(()=>t.classList.remove('show'),2300)}
function exportData(){
 const blob=new Blob([JSON.stringify({app:'MyGarage',version:1,exportedAt:new Date().toISOString(),bikes},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mygarage-backup.json';a.click();URL.revokeObjectURL(url);toast('Copia de seguridad exportada');
}
function importData(file){
 const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);const list=Array.isArray(data)?data:data.bikes;if(!Array.isArray(list))throw 0;if(confirm(`¿Importar ${list.length} motos? Esto reemplazará la colección actual.`)){bikes=list;save();toast('Copia restaurada')}}catch{toast('El archivo no parece una copia válida')}};r.readAsText(file);
}
document.addEventListener('click',e=>{
 const tab=e.target.closest('[data-tab]');if(tab)goto(tab.dataset.tab);
 const jump=e.target.closest('[data-goto]');if(jump)goto(jump.dataset.goto);
 const d=e.target.closest('[data-detail]');if(d)detail(d.dataset.detail);
 const edit=e.target.closest('[data-edit]');if(edit){const id=edit.dataset.edit;const b=bikes.find(x=>x.id===id);if(b)openForm(b.status,id)}
 const del=e.target.closest('[data-delete]');if(del&&confirm('¿Eliminar esta moto de MyGarage?')){bikes=bikes.filter(b=>b.id!==del.dataset.delete);save();toast('Moto eliminada')}
 const move=e.target.closest('[data-move]');if(move){const b=bikes.find(x=>x.id===move.dataset.move);if(b){b.status=b.status==='wish'?'owned':'wish';save();detail(b.id);toast('Estado actualizado')}}
 const pick=e.target.closest('[data-pick]');if(pick){const id=pick.dataset.pick;if(pick.checked){if(selectedCompare.length<3)selectedCompare.push(id);else pick.checked=false}else selectedCompare=selectedCompare.filter(x=>x!==id);renderCompare()}
});
$('#addOwnedBtn').onclick=()=>openForm('owned');$('#addWishBtn').onclick=()=>openForm('wish');
$('#fab').onclick=()=>openForm(activeTab==='wishlist'?'wish':'owned');
$('#closeDialog').onclick=closeForm;$('#cancelDialog').onclick=closeForm;
$('#bikeForm').addEventListener('submit',saveForm);
$('#backFromDetails').onclick=()=>goto(lastPage==='details'?'garage':lastPage);
$('#exportBtn').onclick=exportData;
$('#exportBtn').addEventListener('contextmenu',e=>{e.preventDefault();const i=document.createElement('input');i.type='file';i.accept='application/json';i.onchange=()=>i.files[0]&&importData(i.files[0]);i.click()});
if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
load();
