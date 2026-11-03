/* 洞见模块没有客观题：把 insight.* 方法卡追加到该页底部 */
(function(){
 const v=FDV.insight;if(!v||typeof v.render!=='function')return;
 const orig=v.render;
 v.render=function(){
  const base=orig.apply(this,arguments);
  const cards=Object.keys(FDSOL).filter(k=>k.startsWith('insight.')).map(k=>fdSolCard(FDSOL[k])).join('');
  return base+(cards?`<div class="section-label">方法卡 · 用真实数字演算（先自己做，再对照）</div><div class="panel">${cards}</div>`:'');
 };
})();
