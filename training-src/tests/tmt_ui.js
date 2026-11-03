// TMT 洞见页与岗位筛选测试
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const file=process.argv[2];const errs=[],bad=[];const vc=new VirtualConsole();
vc.on('jsdomError',e=>errs.push('jsdomError: '+(e.detail&&e.detail.stack||e.message)));vc.on('error',e=>errs.push('console.error: '+e));
const dom=new JSDOM(fs.readFileSync(file,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://localhost/'});
const w=dom.window,d=w.document;w.scrollTo=()=>{};w.addEventListener('error',e=>errs.push('window.onerror: '+e.message));
const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const fire=(el,t)=>el.dispatchEvent(new w.Event(t,{bubbles:true}));
const out={};
setTimeout(()=>{try{
 click(d.querySelector('[data-view="tmt"]'));let r=d.querySelector('#view-tmt');
 const cards=[...r.querySelectorAll('details')].filter(x=>/^tmt\./.test(x.dataset.ansk||''));
 out.tmtCards=cards.length;
 if(cards.length<40)bad.push('TMT 卡片数 '+cards.length);
 cards.slice(0,6).forEach(c=>c.open=true);
 const txt=r.textContent;
 if(/NaN|undefined|\{\{|账本缺/.test(txt))bad.push('TMT 含异常: '+(txt.match(/.{15}(NaN|undefined|\{\{|账本缺).{25}/)||[''])[0]);
 if(!/up_chip|上游/.test(txt))bad.push('TMT 无类别');
 const kpi=[...r.querySelectorAll('.fd-kpi b')].map(b=>+b.textContent);out.segCounts=kpi;
 if(kpi.some(x=>x<5))bad.push('有类别不足 5 家 '+kpi);
 const segSel=r.querySelector('[data-tf="seg"]');segSel.value='fin_ai';fire(segSel,'change');
 out.finAi=d.querySelectorAll('#view-tmt details').length;
 if(out.finAi<5)bad.push('fin_ai 过滤后 '+out.finAi);
 // 面试对答：按岗位筛选
 click(d.querySelector('[data-view="iv"]'));r=d.querySelector('#view-iv');
 const rsel=r.querySelector('[data-ivf="r"]');out.roles=rsel?rsel.options.length-1:0;
 if(!rsel||out.roles<30)bad.push('细分岗位筛选项 '+out.roles);
 rsel.value='buy.pub.fi_research';fire(rsel,'change');
 const n1=d.querySelectorAll('#view-iv .iv-card').length;
 if(!/公募/.test(d.querySelector('#view-iv').textContent))bad.push('岗位卡未显示');
 rsel2=d.querySelector('#view-iv [data-ivf="r"]');rsel2.value='bank.hq.fm';fire(rsel2,'change');
 out.roleCards=d.querySelectorAll('#view-iv .iv-card').length;
 if(out.roleCards<5)bad.push('bank.hq.fm 题目 '+out.roleCards);
 // 全局题数
 const g=d.querySelector('#view-iv [data-ivf="g"]');g.value='all';fire(g,'change');
 const cnt=/共 (\d+) 题/.exec(d.querySelector('#view-iv').textContent);out.totalQ=cnt?+cnt[1]:0;
 if(out.totalQ<450)bad.push('总题数 '+out.totalQ);
}catch(e){errs.push('harness: '+e.stack)}
console.log(JSON.stringify(out));console.log('BAD:',bad.length?bad:'none');console.log('ERRORS:',errs.length?errs.slice(0,4):'none');w.close();},400);
