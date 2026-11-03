/* ===== prep_06：TMT 洞见与岗位库的容器与分段定义 ===== */
const TMT=[];
const ROLES=[];
const TMT_SEGS=[
 {id:'up_chip',name:'上游 · AI 芯片'},
 {id:'up_fab',name:'上游 · 制造 · 存储 · 设备'},
 {id:'up_net',name:'上游 · 光互联 · 服务器 · 数据中心硬件 · 电信'},
 {id:'mid_cloud',name:'中游 · 云与算力服务'},
 {id:'mid_model',name:'中游 · 大模型与平台'},
 {id:'down_app',name:'下游 · AI 应用与软件'},
 {id:'down_dev',name:'下游 · 终端 · 入口 · 平台'},
 {id:'fin_ai',name:'金融 AI 与金融科技'}];
const TMT_MKT={CN:'A 股',HK:'港股',US:'美股',PV:'未上市'};
function roleById(id){return ROLES.find(r=>r.id===id)||null}
function roleCardHtml(r){
 if(!r)return '';
 const e=ansEsc,row=(k,v)=>v?`<tr><td style="white-space:nowrap"><b>${k}</b></td><td>${v}</td></tr>`:'';
 const sc=(o)=>o?`${o.score?`<span class="tag teal">${o.score}/5（判断）</span> `:''}${e(o.text||o.range||'')}${o.basis?`<br><span class="fd-note">依据：${e(o.basis)}</span>`:''}${o.grade?` <span class="tag">${e(o.grade)}</span>`:''}`:'';
 const srcs=(r.src||[]).map(s=>`<a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.t)}</a>${s.date?'（'+e(s.date)+'）':''}`).join('；');
 return `<div class="panel role-card"><h4>${e(r.org_type)} · ${e(r.role)}</h4><p><b>做什么：</b>${e(r.work)}</p>`
  +((r.typical_day||[]).length?`<ul>${r.typical_day.map(x=>`<li>${e(x)}</li>`).join('')}</ul>`:'')
  +`<table class="ans-tbl"><tbody>${row('工作节奏 WLB',sc(r.wlb))}${row('成长性',sc(r.growth))}${row('薪资范围',sc(r.salary))}${row('对口实习',e(r.intern_fit))}${row('岗位要求',e(r.requirements))}${row('招聘流程与淘汰点',e(r.process))}${row('出口与下一跳',e(r.exit))}${row('批次、节点与 HC',e(r.batches))}${row('证书',e(r.certs))}${row('城市',e((r.cities||[]).join('、')))}${row('样本机构',e((r.sample_orgs||[]).join('、')))}</tbody></table>`
  +(srcs?`<p class="fd-note">来源：${srcs}</p>`:'')+'</div>';
}
