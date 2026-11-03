/* 银行总行·风险管理与授信审批 bank1-27：PD/LGD/EAD与预期损失（训练台合成零售贷款，非真实机构口径）。 */
IV.push({id:'bank1-27',g:'bank',role:'bank.hq.risk',type:'infer',tags:['PD','LGD','EAD','预期损失','压力测试'],
 q:'给你一个160笔零售贷款的组合，每笔有PD、LGD和EAD，怎么算预期损失？为什么用加权PD乘加权LGD会低估？PD上升35%、LGD上升20%，损失增加多少？',
 a30:'EL=PD×LGD×EAD，逐笔相乘再求和。训练台合成组合（160笔，EAD合计{{L:QBANK1-RK-SYN-EAD}}）EL为{{L:QBANK1-RK-SYN-EL}}，占EAD的{{L:QBANK1-RK-SYN-ELPCT}}；用加权PD乘加权LGD会低估{{L:QBANK1-RK-SYN-WPROD-GAP}}；PD×1.35、LGD×1.2时EL增{{L:QBANK1-RK-SYN-STRESS-UP}}。',
 a180:'结论：EL要逐笔相乘再求和。合成组合基准EL是{{L:QBANK1-RK-SYN-EL}}，占EAD的{{L:QBANK1-RK-SYN-ELPCT}}；PD×1.35、LGD×1.2的压力下EL升到{{L:QBANK1-RK-SYN-STRESS-EL}}，增{{L:QBANK1-RK-SYN-STRESS-UP}}。口径：PD是一年期违约概率，LGD是违约后损失率，EAD是违约时的暴露，这里用贷款金额字段；EL是一年期平均损失，对应拨备和定价，不是最坏损失，最坏情形看压力情景和非预期损失，后者由资本覆盖。例子：L001的PD 3.0964%、LGD 32.511%、EAD 196,936元，EL约{{L:QBANK1-RK-SYN-L001}}。组合的EAD加权PD是{{L:QBANK1-RK-SYN-WPD}}、加权LGD是{{L:QBANK1-RK-SYN-WLGD}}，若用加权PD×加权LGD×总EAD只得{{L:QBANK1-RK-SYN-WPROD}}，比逐笔求和低{{L:QBANK1-RK-SYN-WPROD-GAP}}，原因是高PD贷款的LGD也更高，两者同向变化，平均值相乘漏掉了这部分。分客群：小微企业EL{{L:QBANK1-RK-SYN-SB-EL}}（占{{L:QBANK1-RK-SYN-SB-PCT}}）排第一，但平均PD最高的是消费贷{{L:QBANK1-RK-SYN-CONS-PD}}，EL÷EAD最高的也是消费贷{{L:QBANK1-RK-SYN-CONS-ELEAD}}，顺序翻转是因为小微企业EAD更大。D级27笔贷款EAD占{{L:QBANK1-RK-SYN-D-EADSHARE}}，却贡献{{L:QBANK1-RK-SYN-D-ELSHARE}}的EL，说明风险集中。压力：1.35×1.2-1=62%，没有贷款触及0.99封顶，所以精确等于{{L:QBANK1-RK-SYN-STRESS-UP}}，EL÷EAD升到{{L:QBANK1-RK-SYN-STRESS-ELEAD}}，超过训练假设的4%预警线（非任何机构口径）。极端情景PD×2.5、LGD×2.2时增{{L:QBANK1-RK-SYN-EXT-UP}}，低于450%，因为部分贷款的LGD被封顶。反方：统一乘数忽略客群差异和违约相关性，也没有时间维度。落地：分客群设压力乘数，用历史违约率回测PD。以上为训练台合成数据，不是真实机构口径。',
 tree:[
  {ask:'EAD为什么不是授信额度？',ans:'EAD是违约时的暴露。循环额度要用已用额度加未用额度乘信用转换系数（CCF）；合成数据是一次性贷款，EAD直接取贷款金额。',next:[{ask:'信用卡的EAD怎么估？',ans:'已用额度加未用额度×CCF，CCF用历史上违约前12个月的提款行为估计，并要定期回测，它不是固定常数。'}]},
  {ask:'怎么验证PD是准的？',ans:'用后续12个月真实违约率和预测PD按评分分档比较，看校准度（分档违约率）和区分度（KS、AUC）。注意：训练台里的逾期标签是按PD抽样生成的，拿它验证PD是循环论证。',next:[{ask:'回测显示PD被低估怎么办？',ans:'先判断是模型偏差还是宏观冲击。短期加保守调整系数，长期重新估计并走模型验证流程，不能只改参数。'}]},
  {ask:'这个EL和银行的拨备是什么关系？',ans:'会计上的预期信用损失按三阶段计提，第一阶段计提12个月ECL；工行第一阶段准备金约占正常类贷款{{L:QBANK1-RK-D-S1-RATE}}，可作量级参照。但会计ECL要加前瞻性宏观调整，不等于监管内评法的EL。'}
 ],
 notes:'推断题，依据岗位职责（信用风险计量）。全部数值来自训练工作台合成数据（prep_10a_roadmap_risk.js 第3、4周参考解答），非真实机构口径；PD按一年期理解。工行第一阶段准备金比例为自算近似口径。面试时说明数据是合成的，重点展示口径和推理。'});
