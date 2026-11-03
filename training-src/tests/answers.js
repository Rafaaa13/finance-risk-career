// 打印每个标签默认状态下所有题目的参考答案（供与独立的 Python 计算交叉核对）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const vc=new VirtualConsole();const dom=new JSDOM(fs.readFileSync(process.argv[2],'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://localhost/'});
const w=dom.window,d=w.document;w.scrollTo=()=>{};const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
setTimeout(()=>{click(d.querySelector('[data-view="fund"]'));const out={};
 for(const t of ['val','attr','fi','quant','risk','prod']){click(d.querySelector(`#view-fund [data-fdtab="${t}"]`));const root=d.querySelector('#view-fund');
  for(const b of root.querySelectorAll('[data-qcheck]')){const key=b.dataset.qcheck,inp=root.querySelector(`[data-qin="${key}"]`),radios=[...root.querySelectorAll('input[type=radio]')].filter(r=>r.name===key);
   if(inp){inp.value='-987654.321';click(b);inp.value='-987654.321';click(b)}else{radios[0].checked=true;click(b);radios[0].checked=true;click(b)}
   const m=/参考答案：([^。]*)。/.exec(b.closest('.qz').querySelector('.qz-fb').textContent);out[key]=m?m[1].trim():'(首项即正确)'}}
 console.log(JSON.stringify(out,null,1));w.close()},300);
