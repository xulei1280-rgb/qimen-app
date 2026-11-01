/* 术数研习 · 共用视觉动效基础（premium-base.js）
 * 八字页与奇门页共用：减弱动效检测、题头罗盘与题签、标签滑块、数字滚动、
 * 滚动揭示、入场动画、折叠面板平滑展开。只做展示，不读写任何排盘数据。
 * 暴露 window.PremiumUI 供各页的 *-premium.js 调用。 */
(function(){
  'use strict';
  if(window.PremiumUI)return;
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

  /* ---------- 题头：罗盘与题签 ---------- */
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
  /* opts: {seal:'命', eyebrow:'四柱 · 十神 · 岁运', outer:'子丑…', inner:'甲乙…'} */
  function decorateHero(opts){
    opts=opts||{};
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
        ringText(opts.outer||BRANCHES,166,17,0)+
        '<circle cx="200" cy="200" r="146" stroke="currentColor" stroke-width=".5"/>'+
      '</g>'+
      '<g class="pm-ring-inner">'+
        ringText(opts.inner||STEMS,126,14,18)+
        '<circle cx="200" cy="200" r="106" stroke="currentColor" stroke-width=".4"/>'+
        ticks(24,96,106,.5)+
        '<circle cx="200" cy="200" r="70" stroke="currentColor" stroke-width=".5" stroke-dasharray="2 4"/>'+
        (opts.centerSvg||'<path d="M200 130a35 35 0 0 1 0 70a35 35 0 0 0 0 70a70 70 0 0 1 0-140z" fill="currentColor" fill-opacity=".14" stroke="currentColor" stroke-width=".5"/>')+
      '</g></svg>';
    top.appendChild(ring);
    var titleWrap=top.querySelector('.page-intro > div');
    var h1=titleWrap&&titleWrap.querySelector('h1');
    if(h1&&!titleWrap.querySelector('.pm-eyebrow')&&opts.seal){
      var eyebrow=doc.createElement('div');
      eyebrow.className='pm-eyebrow';
      eyebrow.setAttribute('aria-hidden','true');
      eyebrow.innerHTML='<span class="pm-seal">'+opts.seal+'</span><span>'+(opts.eyebrow||'')+'</span>';
      titleWrap.insertBefore(eyebrow,h1);
    }
  }

  /* ---------- 标签滑块：返回 {place, instant} ---------- */
  function tabInk(tabsSelector,activeSelector){
    activeSelector=activeSelector||'button.active';
    function place(){
      var tabs=doc.querySelector(tabsSelector);
      if(!tabs)return;
      var ink=tabs.querySelector('.pm-tab-ink');
      if(!ink){
        ink=doc.createElement('span');
        ink.className='pm-tab-ink';
        ink.setAttribute('aria-hidden','true');
        tabs.insertBefore(ink,tabs.firstChild);
        tabs.classList.add('pm-has-ink');
      }
      var active=tabs.querySelector(activeSelector);
      if(!active||!active.offsetWidth){ink.style.opacity='0';return}
      ink.style.width=active.offsetWidth+'px';
      ink.style.height=active.offsetHeight+'px';
      ink.style.transform='translate('+active.offsetLeft+'px,'+active.offsetTop+'px)';
      ink.style.opacity='1';
      if(!ink.classList.contains('pm-ready'))raf(function(){raf(function(){ink.classList.add('pm-ready')})});
    }
    function instant(){
      var ink=doc.querySelector(tabsSelector+' .pm-tab-ink');
      if(ink)ink.classList.remove('pm-ready');
      place();
    }
    return {place:place,instant:instant};
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
  function setupReveal(scope,selector){
    if(!revealObserver||!motionOK()||!scope)return;
    each(scope.querySelectorAll(selector),function(el){
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
  function replay(el,cls){
    if(!el)return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  /* ---------- 折叠面板平滑展开/收起 ---------- */
  var smoothSelectors=[];
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
    if(event.defaultPrevented||!motionOK()||!smoothSelectors.length)return;
    var target=event.target;
    var summary=target&&target.closest?target.closest('summary'):null;
    if(!summary)return;
    var det=summary.parentElement;
    if(!det||det.tagName!=='DETAILS'||!det.matches(smoothSelectors.join(',')))return;
    var interactive=target.closest('button,a,input,select,textarea,label');
    if(interactive&&summary.contains(interactive))return;
    if(typeof det.animate!=='function')return;
    event.preventDefault();
    animateDetails(det,summary);
  });
  function smoothDetails(selector){if(selector&&smoothSelectors.indexOf(selector)<0)smoothSelectors.push(selector)}

  function ready(fn){if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',fn);else fn()}

  window.PremiumUI={
    motionOK:motionOK,raf:raf,each:each,ready:ready,
    decorateHero:decorateHero,tabInk:tabInk,countUp:countUp,
    setupReveal:setupReveal,enter:enter,replay:replay,smoothDetails:smoothDetails
  };
})();
