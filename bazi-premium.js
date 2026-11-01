/* 八字页 · 视觉动效层（bazi-premium.js）
 * 依赖 premium-base.js（window.PremiumUI）。
 * 只做展示：题头装饰、标签滑块、入场/揭示动画、折叠平滑展开、数字滚动。
 * 不读写任何排盘数据，不改动 bazi.html 内的业务函数。 */
(function(){
  'use strict';
  var UI=window.PremiumUI;
  if(!UI)return;
  var doc=document,raf=UI.raf,each=UI.each,motionOK=UI.motionOK,enter=UI.enter,countUp=UI.countUp;
  var ink=UI.tabInk('.bazi-tabs');
  var placeTabInk=ink.place,placeTabInkInstant=ink.instant;

  /* ---------- 四柱表：日柱高亮 ---------- */
  function markDayColumn(scope){
    each((scope||doc).querySelectorAll('.pillar-table'),function(table){
      var head=table.rows&&table.rows[0];
      if(!head)return;
      var dayIndex=-1;
      each(head.cells,function(cell,i){if(dayIndex<0&&/^日柱/.test((cell.textContent||'').trim()))dayIndex=i});
      if(dayIndex<0)return;
      each(table.rows,function(row){var cell=row.cells[dayIndex];if(cell)cell.classList.add('pm-day-col')});
    });
  }

  var REVEAL_SELECTOR='.detail-grid > .detail-box,.info-grid > div,.luck-origin,.luck-selector,.luck-detail-panel,.summary-panel,.ai-controls,.quick-ai';

  /* ---------- 每次排盘后的整体入场 ---------- */
  function onFullRender(area){
    markDayColumn(area);
    raf(placeTabInk);
    if(!motionOK())return;
    var i=0;
    enter(area.querySelector('.result-heading'),i++);
    enter(area.querySelector('.bazi-tabs'),i++);
    each(area.querySelectorAll('.core-cards > .core-card'),function(card){enter(card,i++)});
    enter(area.querySelector('.basic-dashboard > .result-card'),i++);
    enter(area.querySelector('.bazi-view.active > .result-card'),i++);
    each(area.querySelectorAll('.pillar-stack'),function(stack,col){
      each(stack.querySelectorAll('b'),function(b,row){b.style.setProperty('--pm-d',String(260+col*90+row*45));b.classList.add('pm-ink')});
    });
    each(area.querySelectorAll('.basic-dashboard .pillar-table .stem,.basic-dashboard .pillar-table .branch'),function(ch){
      var cell=ch.closest('td'),col=cell?cell.cellIndex:0,isBranch=ch.classList.contains('branch');
      ch.style.setProperty('--pm-d',String(420+col*90+(isBranch?60:0)));
      ch.classList.add('pm-ink');
    });
    var strongs=area.querySelectorAll('.core-card > strong');
    each(strongs,function(s,k){s.style.setProperty('--pm-d',String(200+k*80));s.classList.add('pm-ink')});
    var activeView=area.querySelector('.bazi-view.active');
    if(activeView)each(activeView.querySelectorAll('.wx-row em'),function(em){countUp(em,1100)});
    UI.setupReveal(area,REVEAL_SELECTOR);
  }

  /* ---------- 局部重绘（选大运/流年、切换标签等） ---------- */
  function onPartial(nodes){
    var seen=[];
    nodes.forEach(function(node){
      if(node.nodeType!==1||node.classList.contains('pm-tab-ink'))return;
      if(node.querySelector&&node.querySelector('.pillar-table'))markDayColumn(node);
      if(node.classList.contains('pillar-table-wrap')||node.matches('details.outlook-details'))markDayColumn(node);
      if(!motionOK())return;
      var detail=node.classList.contains('luck-professional')?node.querySelector('.luck-detail-panel'):null;
      if(detail&&seen.indexOf(detail)<0){seen.push(detail);detail.classList.add('pm-refresh')}
      if(node.classList.contains('luck-professional')){
        each(node.querySelectorAll('.fortune-item.active'),function(btn){btn.classList.add('pm-pop')});
      }
      if(node.classList.contains('ai-turn')||node.classList.contains('ai-pending'))node.classList.add('pm-refresh');
    });
  }

  function watchResults(){
    var area=doc.getElementById('resultArea');
    if(!area||!('MutationObserver' in window))return;
    new MutationObserver(function(mutations){
      var added=[],full=false,tabsChanged=false;
      mutations.forEach(function(m){
        if(m.type==='attributes'){
          if(m.target.tagName==='BUTTON'&&m.target.parentNode&&m.target.parentNode.classList&&m.target.parentNode.classList.contains('bazi-tabs'))tabsChanged=true;
          return;
        }
        each(m.addedNodes,function(n){
          if(n.nodeType!==1)return;
          added.push(n);
          if(m.target===area&&n.classList.contains('result-heading'))full=true;
        });
      });
      if(tabsChanged&&!full)raf(placeTabInk);
      if(!added.length)return;
      if(full)onFullRender(area);else onPartial(added);
    }).observe(area,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }

  /* ---------- 折叠面板平滑展开/收起 ---------- */
  UI.smoothDetails('#entryPanel,.structure-deep,.outlook-details,.core-context,.luck-detail,.phenomenon-detail,details.outlook-note');

  /* ---------- 启动 ---------- */
  UI.ready(function(){
    UI.decorateHero({seal:'命',eyebrow:'四柱 · 十神 · 岁运'});
    watchResults();
    var area=doc.getElementById('resultArea');
    if(area&&area.querySelector('.result-heading'))onFullRender(area);
    doc.addEventListener('click',function(event){
      var btn=event.target&&event.target.closest?event.target.closest('.bazi-tabs button'):null;
      if(btn)raf(placeTabInk);
    });
    var resizeTimer=null;
    window.addEventListener('resize',function(){clearTimeout(resizeTimer);resizeTimer=setTimeout(placeTabInkInstant,80)});
    if(doc.fonts&&doc.fonts.ready)doc.fonts.ready.then(placeTabInk);
  });
})();
