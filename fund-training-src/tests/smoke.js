// 冒烟测试：加载构建好的 HTML，逐个切标签、逐题故意答错取“参考答案”再答对，捕获脚本异常。
// 用法：NODE_PATH=<含jsdom的node_modules> node smoke.js <html路径> [tab,tab…]
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const file=process.argv[2],only=(process.argv[3]||'').split(',').filter(Boolean);
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push('jsdomError: '+(e.detail&&e.detail.stack||e.message)));vc.on('error',e=>errs.push('console.error: '+e));
const dom=new JSDOM(fs.readFileSync(file,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://localhost/'});
const w=dom.window,d=w.document;w.scrollTo=()=>{};w.addEventListener('error',e=>errs.push('window.onerror: '+e.message+' @'+e.filename+':'+e.lineno));
const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const out={};
setTimeout(()=>{
 try{
  click(d.querySelector('[data-view="fund"]'));
  const tabs=[...d.querySelectorAll('#view-fund [data-fdtab]')].map(b=>b.dataset.fdtab);
  for(const t of tabs){
   if(only.length&&!only.includes(t))continue;
   click(d.querySelector(`#view-fund [data-fdtab="${t}"]`));
   const body=d.querySelector('#fd-body');const info={len:body.textContent.length,quiz:0,fixed:0,bad:[]};
   info.nanCount=(body.textContent.match(/NaN|undefined|Infinity/g)||[]).length;
   const btns=[...d.querySelectorAll('#view-fund [data-qcheck]')];info.quiz=btns.length;
   for(const b of btns){
    const key=b.dataset.qcheck,root=d.querySelector('#view-fund');
    const inp=root.querySelector(`[data-qin="${key}"]`);
    const radios=[...root.querySelectorAll('input[type=radio]')].filter(r=>r.name===key);
    const fb=()=>b.closest('.qz').querySelector('.qz-fb');
    if(inp){inp.value='-987654.321';click(b);inp.value='-987654.321';click(b)}
    else{radios[0].checked=true;click(b);radios[0].checked=true;click(b)}
    const m=/参考答案：([^。]*)。/.exec(fb().textContent);
    if(!m){if(fb().classList.contains('ok')){info.fixed++;continue}info.bad.push(key+' 无参考答案: '+fb().textContent.slice(0,80));continue}
    const ans=m[1].trim();
    if(inp){inp.value=String(parseFloat(ans.replace(/,/g,'')))}
    else{const r=radios.find(r=>r.value===ans);if(!r){info.bad.push(key+' 选项不含答案:'+ans);continue}r.checked=true}
    click(b);
    if(fb().classList.contains('ok'))info.fixed++;else info.bad.push(key+' 答案回填后仍错: '+ans+' | '+fb().textContent.slice(0,100));
   }
   out[t]=info;
  }
 }catch(e){errs.push('harness: '+e.stack)}
 console.log(JSON.stringify(out,null,1));console.log('ERRORS:',errs.length?errs.slice(0,8):'none');
 w.close();
},300);
