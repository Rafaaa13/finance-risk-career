// 题库/洞见卡/岗位库校验：node validate_bank.js   （在 训练工作台源码/tests 下运行；不依赖浏览器）
// 校验对象：prep/prep_42*.js、prep_6*_iv_*.js（IV.push）、prep_7*_tmt_*.js（TMT.push）、面试备战/岗位库/ROLE_*.json、事实账本/*.json
const fs=require('fs'),path=require('path'),vm=require('vm');
const B=path.resolve(__dirname,'..'),PREP=path.join(B,'prep'),ROOT=path.resolve(B,'..','面试备战');
const errs=[],warn=[];const E=(m)=>errs.push(m),W=(m)=>warn.push(m);
// 账本
const led={};for(const f of fs.readdirSync(path.join(ROOT,'事实账本')).filter(x=>x.endsWith('.json'))){try{for(const e of JSON.parse(fs.readFileSync(path.join(ROOT,'事实账本',f),'utf8'))){if(led[e.id])E('账本 ID 重复: '+e.id+' ('+f+')');led[e.id]=e}}catch(x){E('账本 JSON 解析失败 '+f+': '+x.message)}}
for(const [id,e] of Object.entries(led)){if(e.value!=null&&e.status!=='unverified'&&!(e.url&&e.asof&&e.source&&e.quote))E('账本条目缺 url/asof/source/quote: '+id)}
// 数据文件
const IV=[],TMT=[];const ctx=vm.createContext({IV,TMT});
const dataFiles=fs.readdirSync(PREP).filter(f=>/^prep_(42|6\d_iv|7\d_tmt)/.test(f)).sort();
for(const f of dataFiles){try{vm.runInContext(fs.readFileSync(path.join(PREP,f),'utf8'),ctx,{filename:f})}catch(x){E('执行失败 '+f+': '+x.message)}}
const ROLES=[];const roleDir=path.join(ROOT,'岗位库');
if(fs.existsSync(roleDir))for(const f of fs.readdirSync(roleDir).filter(x=>/^ROLE_.*\.json$/.test(x))){try{ROLES.push(...JSON.parse(fs.readFileSync(path.join(roleDir,f),'utf8')))}catch(x){E('岗位 JSON 解析失败 '+f+': '+x.message)}}
const roleIds=new Set();ROLES.forEach(r=>{
 if(roleIds.has(r.id))E('岗位 id 重复 '+r.id);roleIds.add(r.id);
 for(const k of ['id','group','org_type','role','work','intern_fit','requirements','process','exit','batches','certs'])if(!r[k]||String(r[k]).length<(k==='group'||k==='org_type'?2:4))E(`岗位 ${r.id} 缺 ${k}`);
 for(const k of ['wlb','growth','salary'])if(!r[k]||!(r[k].text||r[k].range))E(`岗位 ${r.id} 缺 ${k}`);
 if(r.salary&&!r.salary.grade)E(`岗位 ${r.id} 薪资未标证据等级`);
 if(r.wlb&&!r.wlb.grade)E(`岗位 ${r.id} WLB 未标证据等级`);
 if(!Array.isArray(r.src)||!r.src.length||r.src.some(s=>!/^https?:\/\//.test(s.url||'')))E(`岗位 ${r.id} 缺有效来源链接`);
 if(/占位|STUB|TODO|待补/.test(JSON.stringify(r)))E(`岗位 ${r.id} 含占位/STUB/待补文字`);
 if(String(r.work).length<80)W(`岗位 ${r.id} work 偏短(${String(r.work).length})`);
});
// 题库
const ids=new Set(),tokRe=/\{\{([^}]+)\}\}/g;
function tokens(o){const s=JSON.stringify(o),r=[];let m;while((m=tokRe.exec(s)))r.push(m[1]);return r}
function checkTokens(where,o){for(const t of tokens(o)){
 if(t.startsWith('L:')){if(!led[t.slice(2)])E(`${where} 引用了不存在的账本 ID ${t}`);else if(led[t.slice(2)].value==null)E(`${where} 引用了未核实账本项 ${t}`)}
 else if(t.startsWith('D:')){const [a,b]=t.slice(2).split('~');if(!led[a]||!led[b])E(`${where} 差值引用缺账本 ${t}`)}
 else E(`${where} 含个人槽位或非法占位 {{${t}}}（新题库禁用）`)}}
for(const it of IV){const w=`IV ${it.id}`;
 if(ids.has(it.id))E('IV id 重复 '+it.id);ids.add(it.id);
 for(const k of ['id','g','type','q','a30','a180'])if(!it[k])E(`${w} 缺 ${k}`);
 if(!['real','freq','infer'].includes(it.type))E(`${w} type 非法`);
 if(!/^c\d+|^g\d+/.test(it.id)){ // 新题库规则
  if(!it.role)E(`${w} 缺 role`);else if(!roleIds.has(it.role))E(`${w} role 不在岗位库: ${it.role}`);
  if((it.a30||'').length<60)E(`${w} a30 过短`);if((it.a180||'').length<420)E(`${w} a180 过短(${(it.a180||'').length})`);
  if(!Array.isArray(it.tree)||it.tree.length<3)E(`${w} 追问树少于 3 条`);else if(it.tree.filter(n=>n.next&&n.next.length).length<2)E(`${w} 追问树需要至少 2 条带第二层`);
  if(/待补|\{\{me\.|\{\{[a-z]+\.[A-Za-z]+\}\}/.test(JSON.stringify(it)))E(`${w} 含待补/个人槽位`);
  if((it.type==='real'||it.type==='freq')&&(!Array.isArray(it.src)||!it.src.length||it.src.some(s=>!/^https?:\/\//.test(s.url||''))))E(`${w} 真题/高频题缺出处链接`);
  if(!(tokens(it).some(t=>t.startsWith('L:')||t.startsWith('D:'))))W(`${w} 没有引用任何账本数字`);
  checkTokens(w,it);
 }
}
for(const c of TMT){const w=`TMT ${c.id}`;
 for(const k of ['id','seg','mkt','name','asof','position','landscape'])if(!c[k])E(`${w} 缺 ${k}`);
 if(!c.fin||!c.fin.rows||c.fin.rows.length<4)E(`${w} 财务表少于 4 行`);
 if(!c.scen||c.scen.length!==3)E(`${w} 情景需 3 个`);
 if(!c.peers||!c.peers.rows||c.peers.rows.length<3)E(`${w} 同行对比少于 3 行`);
 if(!c.insights||c.insights.length<2)E(`${w} 洞见少于 2 条`);
 if(!c.kill||c.kill.length<2)E(`${w} 证伪条件少于 2 条`);
 if(!c.asks||c.asks.length<2)E(`${w} 追问少于 2 条`);
 if(!c.valuation||!c.valuation.text)E(`${w} 缺估值拆解`);
 if(/待补|\{\{me\./.test(JSON.stringify(c)))E(`${w} 含待补/个人槽位`);
 for(const t of tokens(c)){if(t.startsWith('L:')){const e=led[t.slice(2)];if(!e)E(`${w} 引用不存在的账本 ID ${t}`);else if(e.value==null)E(`${w} 引用未核实账本项 ${t}`)}else if(!t.startsWith('D:'))E(`${w} 含非法占位 {{${t}}}`)}
}
const segCount={};TMT.forEach(c=>segCount[c.seg]=(segCount[c.seg]||0)+1);
console.log(JSON.stringify({ledger:Object.keys(led).length,iv:IV.length,ivNew:IV.filter(i=>!/^c\d+|^g\d+/.test(i.id)).length,tmt:TMT.length,tmtBySeg:segCount,roles:ROLES.length}));
console.log('WARN:',warn.length,warn.slice(0,8));
console.log('ERRORS:',errs.length);errs.slice(0,60).forEach(e=>console.log(' -',e));
process.exit(errs.length?1:0);
