(function(){const c=TMT.find(x=>x.id==='bloomberg');Object.assign(c,{
peers:{head:['公司','2025营收（本币）','增速','估值','定位'],rows:[
['彭博 Bloomberg','{{L:TMT8-BBG-REV}}亿美元','估算','PS {{L:TMT8-BBG-PS}}倍','全球终端'],
['LSEG','{{L:TMT8-LSEG-REV25}}亿英镑','{{L:TMT8-LSEG-ORGANIC}}%','伦敦上市','数据+交易所'],
['同花顺','{{L:TMT8-THS-REV25}}亿元','{{L:TMT8-THS-REVTZ25}}%','PS {{L:TMT8-AE-THSPS}}倍','中国散户流量'],
['东方财富','{{L:TMT8-EM-REV25}}亿元','{{L:TMT8-EM-REVTZ25}}%','PS {{L:TMT8-AE-EMPS}}倍','中国牌照+代销'],
['恒生电子','{{L:TMT8-HS-REV25}}亿元','{{L:TMT8-HS-REVTZ25}}%','PS {{L:TMT8-AE-HSPS}}倍','中国金融IT']]},
insights:[
{t:'彭博卖的不是AI，是席位上的工作流',b:'【事实】彭博终端有{{L:TMT8-BBG-TERM}}个以上付费席位，单席位年费{{L:TMT8-BBG-PRICE}}美元；按席位乘年费估算，终端收入占估算营收{{L:TMT8-BBG-REV}}亿美元的大部分。【判断】BloombergGPT在2023年就发布了，但它的作用不是卖模型，而是让终端更好用、更难被替换。投行分析师的工作流是行情、新闻、Excel、聊天、交易执行，彭博把这些放在一个屏幕里，AI只是把这个屏幕变得更聪明。真正的威胁不是另一个大模型，而是AI原生终端把初级分析师的工作自动化，从而减少席位需求。'},
{t:'LSEG追的是工作流，不是模型',b:'【事实】LSEG 2025年收入{{L:TMT8-LSEG-REV25}}亿英镑、有机增长{{L:TMT8-LSEG-ORGANIC}}%、EBITDA margin {{L:TMT8-LSEG-EBITDA}}%、ASV增速{{L:TMT8-LSEG-ASV}}%、收入留存{{L:TMT8-LSEG-RETENTION}}%，Workspace迁移在2025年完成。【判断】LSEG的护城河是数据、交易所与风险情报的组合，AI是补齐工作流体验，不是领先项；Bloomberg在终端交互与通讯网络仍领先。对中国的启示是Wind、iFinD缺少全球数据授权，做不出Bloomberg，但可以在A股数据与本地工作流上做“中国版终端+Agent”，这是同花顺与东财的机会。'}],
kill:[
'彭博终端付费席位跌破{{L:TMT8-BBG-TERM}}万个——AI原生终端或预算压缩开始侵蚀基本盘。',
'LSEG ASV增速跌破5%——数据终端的订阅逻辑整体走弱。',
'一家全球前十大投行把AI原生终端设为分析师标准配置——工作流护城河被绕开。'],
asks:[
{q:'BloombergGPT当年很轰动，为什么没有颠覆终端？',a:'结论：因为BloombergGPT是终端的功能，不是独立产品。彭博2023年发布500亿参数的金融语料模型，目的是提升新闻摘要、问答、代码生成等终端体验，而不是卖API。终端有{{L:TMT8-BBG-TERM}}个以上席位、单席位{{L:TMT8-BBG-PRICE}}美元，客户买的是数据、通讯和工作流，模型只是附加值。我的判断是AI不会颠覆彭博，但会改变席位的构成：初级分析师的重复工作被自动化，席位增长会放缓，高级投顾与交易员的席位更值钱。'},
{q:'LSEG和Bloomberg的差距在哪？',a:'结论：LSEG强在数据广度与交易所资产，Bloomberg强在终端体验与通讯网络。LSEG 2025年收入{{L:TMT8-LSEG-REV25}}亿英镑、有机增长{{L:TMT8-LSEG-ORGANIC}}%、EBITDA margin {{L:TMT8-LSEG-EBITDA}}%、ASV增速{{L:TMT8-LSEG-ASV}}%，Workspace迁移完成，说明它在补齐终端；Bloomberg的估值{{L:TMT8-BBG-VAL}}亿美元、PS{{L:TMT8-BBG-PS}}倍，说明市场给终端网络更高溢价。我的判断是LSEG更像数据供应商，Bloomberg更像工作流平台，前者的AI更容易被替代，后者的AI更难被绕过。'},
{q:'中国能复制一个Bloomberg吗？',a:'结论：全球数据终端复制不了，中国本地终端可以。Bloomberg的核心是全球行情、新闻、通讯与交易连接，数据授权是几十年积累；Wind、iFinD有A股与宏观数据，但缺少全球资产与聊天网络。我的判断是中国公司应该做“本地数据+Agent工作流”，而不是做全球终端：同花顺有散户流量，东财有账户与代销，恒生有金融机构系统，三者都比纯模型公司更接近中国版金融AI入口。复制Bloomberg的关键不是模型，是数据授权与工作流嵌入。'}]});
})();
