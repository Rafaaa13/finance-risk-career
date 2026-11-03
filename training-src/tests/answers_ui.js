// 参考答案界面测试：每道 fund 题点“看解析”、每个备忘录有范例、基础视图都挂了答案面板，且无 NaN/undefined。
// 用法：NODE_PATH=<含jsdom的node_modules> node answers_ui.js <html路径>
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const file=process.argv[2];const errs=[];const vc=new VirtualConsole();
vc.on('jsdomError',e=>errs.push('jsdomError: '+(e.detail&&e.detail.stack||e.message)));vc.on('error',e=>errs.push('console.error: '+e));
const dom=new JSDOM(fs.readFileSync(file,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://localhost/'});
const w=dom.window,d=w.document;w.scrollTo=()=>{};w.addEventListener('error',e=>errs.push('window.onerror: '+e.message));
const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const res={fund:{},base:{}};const bad=[];
setTimeout(()=>{try{
 click(d.querySelector('[data-view="fund"]'));
 for(const t of [...d.querySelectorAll('#view-fund [data-fdtab]')].map(b=>b.dataset.fdtab)){
  click(d.querySelector(`#view-fund [data-fdtab="${t}"]`));
  const root=d.querySelector('#view-fund');let sol=0,memoBoxes=0,memoRef=0;
  for(const b of root.querySelectorAll('[data-qsol]')){click(b);const box=b.closest('.qz').querySelector('.qz-sol');
   const txt=box.textContent;if(!box.classList.contains('show')||txt.length<120||!/步骤/.test(txt)||/NaN|undefined|Infinity/.test(txt))bad.push(`fund ${t} ${b.dataset.qsol} 解析异常(${txt.length})`);else sol++}
  for(const m of root.querySelectorAll('.fd-memo')){memoBoxes++;const r=m.querySelector('.fd-ref-body');if(r&&r.textContent.length>80&&!/NaN|undefined/.test(r.textContent))memoRef++}
  if(memoBoxes&&memoRef!==memoBoxes)bad.push(`fund ${t} 备忘录范例 ${memoRef}/${memoBoxes}`);
  if(t==='insight'&&!/方法卡/.test(root.textContent))bad.push('insight 缺方法卡');
  res.fund[t]={sol,memoBoxes,memoRef};
 }
 for(const v of ['roadmap','risk','quant','sql','project','interview','local']){
  click(d.querySelector(`[data-view="${v}"]`));const a=d.querySelector(`#view-${v} .ans-wrap`);
  if(!a){bad.push(v+' 无答案面板');continue}
  for(const det of a.querySelectorAll('details'))det.open=true;
  const txt=a.textContent;res.base[v]={len:txt.length,details:a.querySelectorAll('details').length};
  if(txt.length<400||/NaN|undefined|Infinity|\[object/.test(txt))bad.push(`${v} 答案异常 len=${txt.length} ${(txt.match(/NaN|undefined|Infinity|\[object Object\]/)||[''])[0]}`);
 }
 // 面试演练：换题后答案跟着换
 click(d.querySelector('[data-view="interview"]'));const t0=d.querySelector('#view-interview .ans-wrap .panel').textContent.slice(0,40);
 click(d.querySelector('#newQuestion'));const t1=d.querySelector('#view-interview .ans-wrap .panel').textContent.slice(0,40);
 if(t0===t1)bad.push('面试演练换题后答案未变');
 // SQL 载入按钮
 click(d.querySelector('[data-view="sql"]'));const sb=d.querySelector('[data-ans-sql="0"]');if(!sb)bad.push('SQL 无载入按钮');else{click(sb);if(!/loans|segment/i.test(d.querySelector('#sqlEditor').value))bad.push('SQL 载入失败')}
}catch(e){errs.push('harness: '+e.stack)}
console.log(JSON.stringify(res));console.log('BAD:',bad.length?bad:'none');console.log('ERRORS:',errs.length?errs.slice(0,6):'none');w.close();},300);
