// 压力测试：对每个标签的每个下拉框逐个选项切换，检查脚本异常、NaN/undefined，并让每道题“答错取参考答案→回填→应判对”。
// 用法：NODE_PATH=<含jsdom的node_modules> node stress.js <html路径>
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push('jsdomError: '+(e.detail&&e.detail.stack||e.message)));
const dom=new JSDOM(fs.readFileSync(process.argv[2],'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://localhost/'});
const w=dom.window,d=w.document;w.scrollTo=()=>{};w.addEventListener('error',e=>errs.push('window.onerror: '+e.message));
const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const problems=[];let combos=0,quizzes=0;
function quizPass(ctx){
 const root=d.querySelector('#view-fund');
 const btns=[...root.querySelectorAll('[data-qcheck]')];
 for(const b of btns){quizzes++;
  const key=b.dataset.qcheck,inp=root.querySelector(`[data-qin="${key}"]`),radios=[...root.querySelectorAll('input[type=radio]')].filter(r=>r.name===key);
  const fb=()=>b.closest('.qz').querySelector('.qz-fb');
  if(inp){inp.value='-987654.321';click(b);inp.value='-987654.321';click(b)}else{radios[0].checked=true;click(b);radios[0].checked=true;click(b)}
  const m=/参考答案：([^。]*)。/.exec(fb().textContent);
  if(!m){if(!fb().classList.contains('ok'))problems.push(ctx+' '+key+' 无参考答案');continue}
  const ans=m[1].trim();if(/NaN|undefined|Infinity|—/.test(ans)){problems.push(ctx+' '+key+' 答案异常:'+ans);continue}
  if(inp)inp.value=String(parseFloat(ans.replace(/,/g,'')));else{const r=radios.find(r=>r.value===ans);if(!r){problems.push(ctx+' '+key+' 选项缺答案:'+ans);continue}r.checked=true}
  click(b);if(!fb().classList.contains('ok'))problems.push(ctx+' '+key+' 回填后仍错:'+ans);
  if(/NaN|undefined/.test(fb().textContent))problems.push(ctx+' '+key+' 解析含NaN/undefined');
 }}
setTimeout(()=>{
 try{
  click(d.querySelector('[data-view="fund"]'));
  const tabs=[...d.querySelectorAll('#view-fund [data-fdtab]')].map(b=>b.dataset.fdtab);
  for(const t of tabs){
   click(d.querySelector(`#view-fund [data-fdtab="${t}"]`));
   const names=[...new Set([...d.querySelectorAll('#view-fund select[data-fdin]')].map(s=>s.dataset.fdin))];
   for(const nm of names){
    const sel0=d.querySelector(`#view-fund select[data-fdin="${nm}"]`);if(!sel0)continue;
    const vals=[...sel0.options].map(o=>o.value);
    for(const v of vals){
     const sel=d.querySelector(`#view-fund select[data-fdin="${nm}"]`);if(!sel)break;
     sel.value=v;sel.dispatchEvent(new w.Event('change',{bubbles:true}));combos++;
     const body=d.querySelector('#fd-body').textContent;const ctx=`[${t}/${nm}=${v}]`;
     const bad=body.match(/NaN|undefined|Infinity|\[object/g);if(bad)problems.push(ctx+' 页面含 '+[...new Set(bad)].join(','));
     quizPass(ctx);
    }
   }
  }
 }catch(e){errs.push('harness: '+e.stack)}
 console.log('选项组合',combos,'题目检查',quizzes,'问题数',problems.length);
 [...new Set(problems)].slice(0,40).forEach(p=>console.log(' -',p));
 console.log('ERRORS:',errs.length?errs.slice(0,6):'none');w.close();
},300);
