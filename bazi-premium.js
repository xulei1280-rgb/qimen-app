/* 八字页 · 视觉动效层（bazi-premium.js）
 * 只做展示：题头装饰、标签滑块、入场/揭示动画、折叠平滑展开、数字滚动。
 * 不读写任何排盘数据，不改动 bazi.html 内的业务函数。 */
(function(){
  'use strict';
  var doc=document,root=doc.documentElement;
  var reduceQuery=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  function motionOK(){return !(reduceQuery&&reduceQuery.matches)}
  function syncMotionClass(){root.classList.toggle('pm-motion',motionOK())}
  syncMotionClass();
  if(reduceQuery){
    if(reduceQuery.addEventListener)reduceQuery.addEventListener('change',syncMotionClass);
    else if(reduceQuery.addListener)reduceQuery.addListener(syncMotionClass);
  }
  root.classList.add('pm-js');

  var STEMS='甲乙丙丁戊己庚辛壬癸',BRANCHES='子丑寅卯辰巳午未申酉戌亥';
  var raf=window.requestAnimationFrame?window.requestAnimationFrame.bind(window):function(fn){return setTimeout(fn,16)};
  function each(list,fn){Array.prototype.forEach.call(list||[],fn)}

  /* ---------- 题头：干支罗盘与题签 ---------- */
  function ringText(chars,r,size,offsetDeg){
    var out='',n=chars.length;
    for(var i=0;i<n;i++){
      var a=(i/n)*360+(offsetDeg||0),rad=(a-90)*Math.PI/180;
      var x=(200+r*Math.cos(rad)).toFixed(1),y=(200+r*Math.sin(rad)).toFixed(1);
      out+='<text x="'+x+'" y="'+y+'" font-size="'+size+'" text-anchor="middle" dominant-baseline="central" transform="rotate('+a.toFixed(1)+' '+x+' '+y+')">'+chars.charAt(i)+'</text>';
    }
    return out;
  }
  function ticks(count,r1,r2,width){
    var out='';
    for(var i=0;i<count;i++){
      var rad=(i/count)*2*Math.PI;
      out+='<line x1="'+(200+r1*Math.cos(rad)).toFixed(1)+'" y1="'+(200+r1*Math.sin(rad)).toFixed(1)+'" x2="'+(200+r2*Math.cos(rad)).toFixed(1)+'" y2="'+(200+r2*Math.sin(rad)).toFixed(1)+'" stroke="currentColor" stroke-width="'+width+'"/>';
    }
    return out;
  }
  function decorateHero(){
    var top=doc.querySelector('.top');
    if(!top||top.querySelector('.pm-hero-ring'))return;
    var ring=doc.createElement('div');
    ring.className='pm-hero-ring';
    ring.setAttribute('aria-hidden','true');
    ring.innerHTML='<svg viewBox="0 0 400 400" fill="none">'+
      '<g class="pm-ring-outer">'+
        '<circle cx="200" cy="200" r="196" stroke="currentColor" stroke-width=".6"/>'+
        '<circle cx="200" cy="200" r="186" stroke="currentColor" stroke-width=".4" stroke-dasharray="1 5"/>'+
        ticks(72,186,192,.5)+
        ringText(BRANCHES,166,17,0)+
        '<circle cx="200" cy="200" r="146" stroke="currentColor" stroke-width=".5"/>'+
      '</g>'+
      '<g class="pm-ring-inner">'+
        ringText(STEMS,126,14,18)+
        '<circle cx="200" cy="200" r="106" stroke="currentColor" stroke-width=".4"/>'+
        ticks(24,96,106,.5)+
        '<circle cx="200" cy="200" r="70" stroke="currentColor" stroke-width=".5" stroke-dasharray="2 4"/>'+
        '<path d="M200 130a35 35 0 0 1 0 70a35 35 0 0 0 0 70a70 70 0 0 1 0-140z" fill="currentColor" fill-opacity=".14" stroke="currentColor" stroke-width=".5"/>'+
      '</g></svg>';
    top.appendChild(ring);
    var titleWrap=top.querySelector('.page-intro > div');
    var h1=titleWrap&&titleWrap.querySelector('h1');
    if(h1&&!titleWrap.querySelector('.pm-eyebrow')){
      var eyebrow=doc.createElement('div');
      eyebrow.className='pm-eyebrow';
      eyebrow.setAttribute('aria-hidden','true');
      eyebrow.innerHTML='<span class="pm-seal">命</span><span>四柱 · 十神 · 岁运</span>';
      titleWrap.insertBefore(eyebrow,h1);
    }
  }

  /* ---------- 标签滑块 ---------- */
  function placeTabInkInstant(){
    var ink=doc.querySelector('.bazi-tabs .pm-tab-ink');
    if(ink)ink.classList.remove('pm-ready');
    placeTabInk();
  }
  function placeTabInk(){
    var tabs=doc.querySelector('.bazi-tabs');
    if(!tabs)return;
    var ink=tabs.querySelector('.pm-tab-ink');
    if(!ink){
      ink=doc.createElement('span');
      ink.className='pm-tab-ink';
      ink.setAttribute('aria-hidden','true');
      tabs.insertBefore(ink,tabs.firstChild);
      tabs.classList.add('pm-has-ink');
    }
    var active=tabs.querySelector('button.active');
    if(!active||!active.offsetWidth){ink.style.opacity='0';return}
    ink.style.width=active.offsetWidth+'px';
    ink.style.height=active.offsetHeight+'px';
    ink.style.transform='translate('+active.offsetLeft+'px,'+active.offsetTop+'px)';
    ink.style.opacity='1';
    if(!ink.classList.contains('pm-ready'))raf(function(){raf(function(){ink.classList.add('pm-ready')})});
  }

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

  /* ---------- 数字滚动 ---------- */
  function countUp(el,duration){
    var finalText=el.textContent;
    var target=parseFloat(finalText);
    if(!isFinite(target)||!/^\s*-?\d+(\.\d+)?\s*$/.test(finalText))return;
    var decimals=(finalText.trim().split('.')[1]||'').length,start=null;
    el.textContent=(0).toFixed(decimals);
    function step(ts){
      if(start===null)start=ts;
      var p=Math.min(1,(ts-start)/duration),eased=1-Math.pow(1-p,3);
      if(p<1){el.textContent=(target*eased).toFixed(decimals);raf(step)}
      else el.textContent=finalText;
    }
    raf(step);
  }

  /* ---------- 滚动揭示 ---------- */
  var revealObserver=('IntersectionObserver' in window)?new IntersectionObserver(function(entries){
    var batch=0;
    entries.forEach(function(entry){
      if(!entry.isIntersecting)return;
      var el=entry.target;
      el.style.setProperty('--pm-i',String(Math.min(batch++,6)));
      el.classList.add('pm-in');
      revealObserver.unobserve(el);
    });
  },{rootMargin:'0px 0px -6% 0px',threshold:.06}):null;
  var REVEAL_SELECTOR='.detail-grid > .detail-box,.info-grid > div,.luck-origin,.luck-selector,.luck-detail-panel,.summary-panel,.ai-controls,.quick-ai';
  function setupReveal(scope){
    if(!revealObserver||!motionOK())return;
    each(scope.querySelectorAll(REVEAL_SELECTOR),function(el){
      el.classList.add('pm-reveal');
      revealObserver.observe(el);
    });
  }

  function enter(el,index){
    if(!el)return;
    el.style.setProperty('--pm-i',String(index));
    el.classList.remove('pm-enter');
    void el.offsetWidth;
    el.classList.add('pm-enter');
  }

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
    setupReveal(area);
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
  var SMOOTH_DETAILS='#entryPanel,.structure-deep,.outlook-details,.core-context,.luck-detail,.phenomenon-detail,details.outlook-note';
  function closedHeight(det,summary){
    var cs=getComputedStyle(det),ss=getComputedStyle(summary);
    return summary.getBoundingClientRect().height+
      (parseFloat(ss.marginTop)||0)+(parseFloat(ss.marginBottom)||0)+
      (parseFloat(cs.paddingTop)||0)+(parseFloat(cs.paddingBottom)||0)+
      (parseFloat(cs.borderTopWidth)||0)+(parseFloat(cs.borderBottomWidth)||0);
  }
  function animateDetails(det,summary){
    if(det._pmAnim){det._pmAnim.cancel();det._pmAnim=null}
    var opening=!det.open;
    var from=det.getBoundingClientRect().height;
    if(opening)det.open=true;
    var to=opening?det.getBoundingClientRect().height:closedHeight(det,summary);
    if(Math.abs(to-from)<2){if(!opening)det.open=false;return}
    det.style.overflow='hidden';
    var anim=det.animate([{height:from+'px'},{height:to+'px'}],{duration:Math.round(Math.min(560,240+Math.abs(to-from)*.35)),easing:'cubic-bezier(.22,1,.36,1)'});
    det._pmAnim=anim;
    function done(){det.style.overflow='';if(det._pmAnim===anim)det._pmAnim=null}
    anim.onfinish=function(){if(!opening)det.open=false;done()};
    anim.oncancel=done;
  }
  doc.addEventListener('click',function(event){
    if(event.defaultPrevented||!motionOK())return;
    var target=event.target;
    var summary=target&&target.closest?target.closest('summary'):null;
    if(!summary)return;
    var det=summary.parentElement;
    if(!det||det.tagName!=='DETAILS'||!det.matches(SMOOTH_DETAILS))return;
    var interactive=target.closest('button,a,input,select,textarea,label');
    if(interactive&&summary.contains(interactive))return;
    if(typeof det.animate!=='function')return;
    event.preventDefault();
    animateDetails(det,summary);
  });

  /* ---------- 启动 ---------- */
  function init(){
    decorateHero();
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
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init);else init();
})();
