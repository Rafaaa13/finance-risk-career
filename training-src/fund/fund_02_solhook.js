/* ===== 参考答案挂钩：FDSOL（方法卡）/ FDMEMO（备忘录范例） =====
   数据文件 fund_95_*.js、fund_96_*.js 用 Object.assign 合并进来。 */
const FDSOL={},FDMEMO={};
function fdSolCard(sol){
 if(!sol)return '<p class="fd-note">这一题型暂无方法卡。</p>';
 const li=a=>(a||[]).map(x=>`<li>${esc(x)}</li>`).join('');
 return `<div class="fd-sol"><h5>${esc(sol.t)}</h5>`
  +(sol.f?`<p><b>公式</b>：${esc(sol.f)}</p>`:'')
  +(sol.s&&sol.s.length?`<p><b>步骤</b></p><ol>${li(sol.s)}</ol>`:'')
  +(sol.w&&sol.w.length?`<p><b>易错点</b></p><ul>${li(sol.w)}</ul>`:'')
  +(sol.say?`<p><b>面试里怎么说</b>：${esc(sol.say)}</p>`:'')
  +(sol.eg?`<p><b>用真实数字演算一遍</b>：${esc(sol.eg)}</p>`:'')
  +(sol.src?`<p class="fd-note">来源：${esc(sol.src)}</p>`:'')+'</div>';
}
function fdSolHtml(key){
 const it=FDQ[key];if(!it)return '';
 const parts=key.split('.'),sol=FDSOL[parts[0]+'.'+parts[1]];
 const ans=it.type==='choice'?esc(it.a):fdF(it.a,4)+(it.unit?' '+esc(it.unit):'');
 return `<div class="fd-sol-head"><b>参考答案：</b>${ans}</div><div class="fd-sol-ex">${it.ex||''}</div>${fdSolCard(sol)}`
  +'<p class="fd-note">先自己算一遍再看解析；看过解析的题，不要当作独立完成。</p>';
}
function fdToggleSol(key,btn){
 const box=btn.closest('.qz'),sb=box&&box.querySelector('.qz-sol');if(!sb)return;
 if(sb.innerHTML.trim()){sb.innerHTML='';sb.classList.remove('show');btn.textContent='看解析';return}
 sb.innerHTML=fdSolHtml(key);sb.classList.add('show');btn.textContent='收起解析';
}
