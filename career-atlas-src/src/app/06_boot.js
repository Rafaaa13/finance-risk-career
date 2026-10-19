const VIEWS={overview:viewOverview,companies:viewCompanies,detail:viewDetail,compare:viewCompare,paths:viewPaths,timeline:viewTimeline,roles:viewRoles,sources:viewSources};
const TITLE={overview:'总览',companies:'公司与岗位',detail:'机构详情',compare:'对比',paths:'职业走廊',timeline:'时间线',roles:'岗位族谱',sources:'证据与口径'};
function updateTop(){
 $('#sCo').textContent=CO.length;$('#sHc').textContent=CO.filter(c=>c.hc[1]==='E1').length;$('#sPay').textContent=CO.filter(c=>payVal(c)).length;$('#sCmp').textContent=ST.cmp.length+' / 4';
 $('#crumb').textContent=TITLE[ST.view]||'';
 $$('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===(ST.view==='detail'?'companies':ST.view)));
 $$('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+ST.view));
}
function render(){VIEWS[ST.view]();updateTop()}
function setView(v){ST.view=v;render();window.scrollTo({top:0})}
document.addEventListener('click',e=>{const n=e.target.closest('[data-view]');if(n)setView(n.dataset.view);const j=e.target.closest('[data-jump]');if(j)setView(j.dataset.jump)});
$('#reset').onclick=()=>{Object.assign(ST,{cat:'all',q:'',sort:'idx',onlyHC:false,roleGroup:'全部',roleQ:'',roleOpen:null});render();toast('已重置筛选')};
$('#export').onclick=()=>{download('我的职业规划状态.json',JSON.stringify({mode:ST.mode,compare:ST.cmp.map(i=>coBy(i)?.n),my:Object.fromEntries(Object.entries(ST.my).filter(([k,v])=>v.s||v.n).map(([k,v])=>[coBy(k)?.n||k,v]))},null,2),'application/json');toast('已导出状态 JSON')};
load();
window.__atlas={CO,CATS,PENDING,PATHS,DEADLINES,roles,ST,idx,comp,payVal,rankMap,list,render,setView};
render();
