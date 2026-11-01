/* 六爻 · 墨金视觉动效（liuyao-premium.js）
 * 依赖 premium-base.js 的 window.PremiumUI。只做展示：题头罗盘、铜钱钱文、
 * 成卦后的入场与滚动揭示。不读写排盘数据，不改变随机结果。 */
(function(){
  'use strict';
  var UI=window.PremiumUI;if(!UI)return;
  UI.ready(function(){
    UI.decorateHero({seal:'爻',eyebrow:'纳甲 · 六亲 · 世应 · 动变',outer:'乾坤震巽坎离艮兑',inner:'子丑寅卯辰巳午未申酉戌亥'});
    // 铜钱：字面铸“开元通宝”，另一面素面带月纹；不显示字/背文字
    UI.each(document.querySelectorAll('#coinTray .coin-zi'),function(face){face.innerHTML='<i>开</i><i>元</i><i>通</i><i>宝</i>';face.setAttribute('aria-hidden','true')});
    UI.each(document.querySelectorAll('#coinTray .coin-bei'),function(face){face.textContent='';face.setAttribute('aria-hidden','true')});
    UI.smoothDetails('.more-fields');UI.smoothDetails('.question-helper');UI.smoothDetails('.question-details');
    // 成卦后：盘面卡片入场、长内容滚动揭示
    var area=document.getElementById('resultArea');
    if(area&&window.MutationObserver){
      new MutationObserver(function(){
        if(area.hidden||!area.firstElementChild)return;
        var card=area.querySelector('.result-card');
        if(card&&!card.dataset.pmDone){card.dataset.pmDone='1';UI.enter(card);UI.setupReveal(card,'.reading-guide,.research-box,.ai-box,.review-box')}
      }).observe(area,{childList:true});
    }
  });
})();
