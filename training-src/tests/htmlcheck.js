// 检查每个标签生成的 HTML 字符串是否标签配平（jsdom 会自动纠错，所以要拦截 innerHTML 赋值的原始字符串）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const raw={};const dom=new JSDOM(fs.readFileSync(process.argv[2],'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:new VirtualConsole(),url:'http://localhost/',
 beforeParse(win){const d=Object.getOwnPropertyDescriptor(win.Element.prototype,'innerHTML');
  Object.defineProperty(win.Element.prototype,'innerHTML',{get(){return d.get.call(this)},set(v){if(this.id==='view-fund')raw.last=v;return d.set.call(this,v)}})}});
const w=dom.window,d=w.document;w.scrollTo=()=>{};const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const VOID=new Set(['br','hr','img','input','meta','link','col']);
function balance(html){const st=[],bad=[];const re=/<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;let m;
 while((m=re.exec(html))){const [_,close,tag,attrs]=m,t=tag.toLowerCase();if(VOID.has(t)||/\/\s*$/.test(attrs))continue;
  if(!close)st.push(t);else{const top=st.pop();if(top!==t){bad.push(`</${t}> 遇到 <${top}> 附近: ${html.slice(Math.max(0,m.index-60),m.index+20).replace(/\n/g,' ')}`);if(bad.length>3)break}}}
 if(st.length)bad.push('未闭合: '+st.slice(-5).join(','));return bad}
setTimeout(()=>{click(d.querySelector('[data-view="fund"]'));let n=0;
 for(const b of [...d.querySelectorAll('#view-fund [data-fdtab]')]){click(d.querySelector(`#view-fund [data-fdtab="${b.dataset.fdtab}"]`));const bad=balance(raw.last||'');n+=bad.length;console.log(b.dataset.fdtab.padEnd(8),bad.length?bad:'OK')}
 console.log('总问题',n);w.close()},300);
