/* 产品·持有人行为：计算 */
function fdDca(r){const p=fdGrow(r),n=r.length,cf=[];let val=0;for(let t=0;t<n;t++){cf.push(-1);val+=p[n]/p[t]}cf.push(val);const irr=fdIRR(cf);return{irr:Math.pow(1+irr,12)-1,mult:val/n,total:val,n}}
function fdChase(r,th=8){const p=fdGrow(r),n=r.length;let cash=1,inv=false,units=0,trades=0;const path=[];
 for(let t=3;t<=n;t++){const past=p[t]/p[t-3]-1;
  const val=inv?units*p[t]:cash;path.push(val);
  if(t===n)break;
  if(!inv&&past>th/100){inv=true;units=val/p[t];trades++}else if(inv&&past<-th/100){inv=false;cash=val;trades++}}
 const final=path[path.length-1],bh=p[n]/p[3];return{final,bh,ratio:final/bh,trades,path,bhPath:path.map((_,i)=>p[3+i]/p[3])}}
function fdRet12To(f,label){const t=FR.months.indexOf(label);return fdCompound(f.r,t-12,t)}
function fdFlowSet(){return FR.funds.filter(f=>f.adj&&/权益|指数/.test(f.cat)&&f.fw&&f.fw.d.length>1&&f.fw.d[f.fw.d.length-1]==='2026-06-30')}
function fdFlowIC(){const U=fdFlowSet();return{U,ic:fdSpearman(U.map(f=>fdRet12To(f,'2026-03')),U.map(f=>fdRedeem(f).rr))}}
function fdTopInst(){const L=FR.funds.filter(f=>f.hd&&f.hd.inst&&f.hd.inst.length).map(f=>[f,f.hd.inst[f.hd.inst.length-1]]).sort((a,b)=>b[1]-a[1]);return L[0]}
const FD_AD=[['ad1','客户沟通：“这只基金近一年涨了28%，我预计明年还能翻倍，现在买正是时候。”','B','预测基金投资业绩、宣传预期收益','sales_ad_ban'],
 ['ad2','路演PPT：“货币基金和银行存款一样安全，收益还更高。”','E','混同、比较货币基金与银行存款','mmf_ads'],
 ['ad3','朋友圈：“本基金保本，万一亏损由我们公司补偿。”','C','违规承诺收益、本金不受损失或限定损失金额','sales_ad_ban'],
 ['ad4','理财经理对一位风险承受能力为最低类别的客户说：“这只基金风险等级高于你的承受能力，但最近很火，我帮你配一点。”','D','向风险承受能力最低类别的投资者销售风险等级更高的产品','suitability_130'],
 ['ad5','官网：“成立以来年化收益9.3%（数据截至2026-09-30，来源：基金定期报告），过往业绩不代表未来表现。”','F','——（本题故意设为“仅凭已核实条文无法判定”：业绩展示的期限、基准对比、字体字号等细则在《宣传推介材料管理暂行规定》，本库未核实原文，应去查原文再判定）','ad_rule_special']];
const FD_ADOPT=[['A','合规'],['B','不合规：预测基金投资业绩或宣传预期收益'],['C','不合规：承诺收益、保本或限定损失'],['D','不合规：向风险承受能力不匹配的投资者销售'],['E','不合规：混同/比较货币基金与银行存款'],['F','仅凭本库已核实条文无法判定，须核对原文细则']];
function fdProdQuiz(f,tag){const r=f.r,rp=fdRollPos(r,12),pos=rp.filter(x=>x>0).length/rp.length,d=fdDca(r),c=fdChase(r),fi=fdFlowIC(),ti=fdTopInst(),R=id=>FR.rules.find(x=>x.id===id),qs=[];
 qs.push({k:'roll',q:`${f.n}：最近60个月里，所有滚动12个月持有期（共${rp.length}个窗口）中，收益为正的占比（%）？`,a:pos*100,tol:0.3,unit:'%',ex:`${rp.filter(x=>x>0).length}/${rp.length}=${fdPc(pos*100,1)}；中位 ${fdPc(fdQtl(rp,0.5)*100,1)}，最差 ${fdPc(Math.min(...rp)*100,1)}，最好 ${fdPc(Math.max(...rp)*100,1)}。窗口重叠，不是独立样本；它回答“持有一年有多大概率赚钱”，不回答“下一年”。`});
 qs.push({k:'dca',q:`每月月初定投1份（共60次）到第60个月末，年化内部收益率 IRR（%）？（对比一次性持有60个月的年化 ${fdPc(fdStat(r,0).ann*100,1)}）`,a:d.irr*100,tol:0.3,unit:'%',ex:`累计投入60份，期末价值${fdF(d.total,2)}份，IRR年化 ${fdPc(d.irr*100,1)}。定投 IRR 与一次性持有收益不同，是因为每笔钱的持有期不同——产品经理要用“持有人拿到的收益”而不是基金净值收益来讲故事。`,hint:'现金流：t=0…59 各 −1，t=60 为全部份额的期末价值；先求月 IRR，再 (1+IRR)^12−1'});
 qs.push({k:'chase',q:`行为模拟：从第3个月末起，若“近3个月涨幅 >8%”就满仓买入，若“近3个月跌幅 >8%”就清仓空仓（空仓收益为0），否则维持；到第60个月末，终值是“一直持有”的多少倍？`,a:c.ratio,tol:0.02,unit:'倍',ex:`追涨杀跌者终值 ${fdF(c.final,3)}，一直持有 ${fdF(c.bh,3)}，比值 ${fdF(c.ratio,3)}，共交易 ${c.trades} 次。规则是我们假设的简化版（无费用、无税、月频），真实持有人行为需要账户级数据才能验证。`});
 qs.push({k:'flow',q:`${fi.U.length}只口径正常的权益/指数基金：截至2026-03的近12个月收益，与2026年二季度赎回份额占季初份额的比例，秩相关（Spearman）是多少？`,a:fi.ic,tol:0.03,unit:'',ex:`相关 ${fdF(fi.ic,3)}。${fi.ic>0?'过去收益越高，随后季度赎回越多——“赚钱了就赎”（处置效应）':'过去收益越差，随后季度赎回越多——“亏了就跑”（追涨杀跌）'}的方向证据；只有${fi.U.length}只、一个季度，相关不等于因果，需要更多季度和机构/个人拆分。`});
 qs.push({k:'inst',type:'choice',q:'持有人结构：样本基金里，最近一期披露的“机构投资者持有比例”最高的是哪一只？',opts:FR.funds.filter(x=>x.hd&&x.hd.inst&&x.hd.inst.length).map(x=>x.n),a:ti[0].n,ex:`${ti[0].n} 机构持有 ${fdPc(ti[1],1)}。机构占比高的产品，赎回更集中、更快，产品与风控要关注大额赎回与对手方集中度。`});
 FD_AD.forEach(([k,txt,ans,why,rid])=>qs.push({k,type:'choice',q:`话术合规审查：${txt}`,opts:FD_ADOPT.map(x=>x[1]),a:FD_ADOPT.find(x=>x[0]===ans)[1],ex:`${why}。依据：${R(rid).cite||'未找到官方出处'}（${R(rid).status}）${R(rid).quote?'：'+R(rid).quote.slice(0,220)+'…':''}`}));
 return fdQuiz('prod',qs,tag)}
const FD_BAN=['保本','稳赚','保证收益','一定赚','一定涨','肯定涨','预计将','预期收益率','翻倍','零风险','无风险','稳赢','第一名','业绩第一'];
