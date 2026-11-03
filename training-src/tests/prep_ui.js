// 新增视图测试：分析框架 / 经历库 / 面试对答 / 数据账本。
// 用法：NODE_PATH=<含jsdom的node_modules> node prep_ui.js <html路径>
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const file=process.argv[2];const errs=[],bad=[];const vc=new VirtualConsole();
vc.on('jsdomError',e=>errs.push('jsdomError: '+(e.detail&&e.detail.stack||e.message)));vc.on('error',e=>errs.push('console.error: '+e));
const dom=new JSDOM(fs.readFileSync(file,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://localhost/'});
const w=dom.window,d=w.document;w.scrollTo=()=>{};w.addEventListener('error',e=>errs.push('window.onerror: '+e.message));
const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const fire=(el,type)=>el.dispatchEvent(new w.Event(type,{bubbles:true}));
const out={};
setTimeout(()=>{try{
 const nav=[...d.querySelectorAll('.nav button')].map(b=>b.textContent.replace(/\s+/g,''));out.nav=nav.slice(-6);
 // 分析框架
 click(d.querySelector('[data-view="fw"]'));let r=d.querySelector('#view-fw');
 if(r.querySelectorAll('details').length<14)bad.push('fw 折叠项过少 '+r.querySelectorAll('details').length);
 if(/NaN|undefined/.test(r.textContent))bad.push('fw 含 NaN/undefined');
 const gap=r.querySelector('#fwOut').textContent.match(/差\s*([-\d.,]+)/);if(!gap||Math.abs(parseFloat(gap[1].replace(/,/g,'')))>1e-6)bad.push('三效应之和与 ΔR 不相等 '+(gap&&gap[1]));
 out.fwOut=r.querySelector('#fwOut').textContent.slice(0,150);
 // 经历库
 click(d.querySelector('[data-view="exp"]'));r=d.querySelector('#view-exp');
 const slots=r.querySelectorAll('[data-expslot]');out.slots=slots.length;if(slots.length<40)bad.push('槽位过少 '+slots.length);
 const s=r.querySelector('[data-expslot="me.why_role"]');s.value='测试用的真实理由';fire(s,'input');
 const fct=r.querySelector('[data-expfact]');fct.checked=true;fire(fct,'change');
 // 面试对答
 click(d.querySelector('[data-view="iv"]'));r=d.querySelector('#view-iv');
 const cards=r.querySelectorAll('.iv-card');out.cards=cards.length;if(cards.length<10)bad.push('对答卡片过少');
 if(!/测试用的真实理由/.test(r.textContent))bad.push('经历库填空未替换进对答');
 if(/账本缺/.test(r.textContent))bad.push('对答有账本缺失: '+(r.textContent.match(/账本缺[^】]*/)||[''])[0]);
 if(/NaN|undefined|\{\{|\}\}/.test(r.textContent))bad.push('对答含 NaN/undefined/未替换占位: '+(r.textContent.match(/.{20}(NaN|undefined|\{\{).{20}/)||[''])[0]);
 const todo=r.querySelectorAll('mark.todo').length;out.todoMarks=todo;
 // 追问树展开
 const rev=r.querySelector('[data-ivrev]');if(!rev)bad.push('无追问树按钮');else{click(rev);if(!d.querySelector('#view-iv .iv-ans'))bad.push('追问展开无内容')}
 // 自评保存
 const sv=d.querySelector('#view-iv [data-ivsave]');click(sv);if(!/自评/.test(d.querySelector('#view-iv').textContent))bad.push('自评未保存');
 // 过滤
 const gsel=d.querySelector('[data-ivf="g"]');gsel.value='written';fire(gsel,'change');out.writtenCards=d.querySelectorAll('#view-iv .iv-card').length;if(out.writtenCards<2)bad.push('笔试群面分组题数不对');
 gsel.value='all';fire(d.querySelector('[data-ivf="g"]'),'change');
 // 抽题模式
 click(d.querySelector('[data-ivmode="drill"]'));click(d.querySelector('[data-ivdraw]'));
 if(!d.querySelector('#view-iv .iv-card'))bad.push('抽题无卡片');
 click(d.querySelector('[data-ivrev$=".ans"]'));if(!d.querySelector('#view-iv .iv-ans'))bad.push('抽题看答案无内容');
 // 数据账本
 click(d.querySelector('[data-view="led"]'));r=d.querySelector('#view-led');
 out.ledRows=r.querySelectorAll('tbody tr').length;if(out.ledRows<30)bad.push('账本行数过少');
 if(/NaN|undefined/.test(r.textContent))bad.push('账本含 NaN/undefined');
 // 导出状态里带 prep
 click(d.querySelector('[data-view="dashboard"]'));
}catch(e){errs.push('harness: '+e.stack)}
console.log(JSON.stringify(out));console.log('BAD:',bad.length?bad:'none');console.log('ERRORS:',errs.length?errs.slice(0,6):'none');w.close();},300);
