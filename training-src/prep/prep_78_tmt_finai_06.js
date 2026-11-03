TMT.push({id:'bloomberg',seg:'fin_ai',mkt:'PV',name:'彭博 Bloomberg',ticker:'未上市',asof:'2026-11-02',tags:['Terminal','BloombergGPT','金融数据'],
position:'Bloomberg是全球金融数据终端的标准：Terminal提供行情、新闻、分析、交易与通讯，按席位收年费，客户是投行、资管、对冲基金、央行与交易所。2025年第三方估算营收约{{L:TMT8-BBG-REV}}亿美元、终端席位{{L:TMT8-BBG-TERM}}万个以上、单席位年费{{L:TMT8-BBG-PRICE}}万美元；BloombergGPT在2023年发布，AI功能嵌在终端里，不单独收费。',
fin:{head:['指标','数值','期间/口径'],rows:[
['营业收入（估算）','{{L:TMT8-BBG-REV}} 亿美元','2025，第三方估算'],
['终端付费席位','{{L:TMT8-BBG-TERM}} 万个','2025-10'],
['单席位年费','{{L:TMT8-BBG-PRICE}} 万美元/年','2025'],
['员工数','{{L:TMT8-BBG-EMP}} 人','2025，估算'],
['估值（估算）','{{L:TMT8-BBG-VAL}} 亿美元','2025，媒体口径'],
['媒体付费订阅','{{L:TMT8-BBG-MEDIA}} 人','2025，不含终端'],
['PS（估算）','{{L:TMT8-BBG-PS}} 倍','估算估值/估算营收'],
['BloombergGPT','2023年发布500亿参数模型','2023']]},
landscape:'对手是LSEG Workspace、FactSet、S&P Capital IQ，以及中国的Wind、iFinD。LSEG 2025年收入{{L:TMT8-LSEG-REV25}}亿英镑、有机增长{{L:TMT8-LSEG-ORGANIC}}%、EBITDA margin {{L:TMT8-LSEG-EBITDA}}%、ASV增速{{L:TMT8-LSEG-ASV}}%、留存{{L:TMT8-LSEG-RETENTION}}%，Workspace迁移完成。我的判断是Bloomberg的护城河在数据授权、通讯网络和工作流，AI不会颠覆终端，但会侵蚀初级分析师的部分工作，AI原生终端可能从低价段切入。',
valuation:{text:'未上市，无审计财报，只能用第三方估算：估值{{L:TMT8-BBG-VAL}}亿美元除以营收{{L:TMT8-BBG-REV}}亿美元，得到PS{{L:TMT8-BBG-PS}}倍。可比LSEG收入{{L:TMT8-LSEG-REV25}}亿英镑、EBITDA margin {{L:TMT8-LSEG-EBITDA}}%、ASV增速{{L:TMT8-LSEG-ASV}}%；Bloomberg利润率未披露，但终端年费与{{L:TMT8-LSEG-RETENTION}}%级的留存说明现金流质量更高。合理PS区间{{L:TMT8-BBG-PSFAIR}}倍。我的判断是终端提价空间接近上限，增长来自数据授权、指数与媒体；AI是防守工具，不是第二曲线。若席位跌破{{L:TMT8-BBG-TERM}}万个，估值应向下修。',head:['指标','数值','口径'],rows:[
['估值（估算）','{{L:TMT8-BBG-VAL}} 亿美元','媒体口径'],
['营收（估算）','{{L:TMT8-BBG-REV}} 亿美元','第三方估算'],
['PS（估算）','{{L:TMT8-BBG-PS}} 倍','估算'],
['合理PS区间','{{L:TMT8-BBG-PSFAIR}} 倍','本文判断']]},
scen:[
{n:'熊',p:'30%',v:'{{L:TMT8-BBG-BEAR}}',why:'银行与资管压缩数据预算，AI原生终端以低价抢初级分析师席位，终端提价失败。'},
{n:'基准',p:'50%',v:'{{L:TMT8-BBG-BASE}}',why:'席位持平、年费小幅提升，AI功能作为续费理由，增长与GDP同步。'},
{n:'牛',p:'20%',v:'{{L:TMT8-BBG-BULL}}',why:'AI功能按模块加价，数据授权与指数业务提速，终端从工具变成工作流平台。'}]});
