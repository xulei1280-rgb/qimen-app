/* 奇门页 · 视觉动效与交互层（qimen-premium.js）
 * 依赖 premium-base.js（window.PremiumUI）。
 * 只做展示与导航：题头装饰、九宫入场、宫位详情浮层（手机）、标签滑块、
 * 记录快捷入口、平滑滚动。不改 qimen.js 的排盘计算，也不改写盘面数据。 */
(function(){
  'use strict';
  var UI=window.PremiumUI;
  var doc=document;
  if(!UI)return;
  var raf=UI.raf,each=UI.each,motionOK=UI.motionOK;
  var mobileQuery=window.matchMedia?window.matchMedia('(max-width: 1100px)'):null;
  function isCompact(){return !!(mobileQuery&&mobileQuery.matches)}
  function $(id){return doc.getElementById(id)}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function scrollToEl(el,block){
    if(!el||!el.scrollIntoView)return;
    el.scrollIntoView({behavior:motionOK()?'smooth':'auto',block:block||'start'});
  }

  var sideInk=UI.tabInk('.side-tabs','.side-tab.active');
  var calInk=UI.tabInk('.cal-tabs','.cal-tab.active');
  function placeInks(){sideInk.place();calInk.place()}
  function placeInksInstant(){sideInk.instant();calInk.instant()}

  /* 洛书顺序：一白坎起，依次 1→9 入场 */
  var LUOSHU=[1,2,3,4,5,6,7,8,9];
  function animateBoard(){
    if(!motionOK())return;
    LUOSHU.forEach(function(n,i){
      var p=$('p'+n);
      if(!p)return;
      p.style.setProperty('--pm-d',String(60+i*55));
      UI.replay(p,'pm-ink');
    });
    each(doc.querySelectorAll('#statusStrip .status-chip'),function(chip,i){
      chip.style.setProperty('--pm-i',String(i));
      chip.classList.add('pm-enter');
    });
  }

  /* ---------- 宫位详情浮层（手机/窄屏） ---------- */
  var DIRS=['','坎','坤','震','巽','中','乾','兑','艮','离'];
  var sheet=null,lastFocus=null,closeTimer=null;
  function ensureSheet(){
    if(sheet)return sheet;
    sheet=doc.createElement('div');
    sheet.className='qm-sheet';
    sheet.id='qmPalaceSheet';
    sheet.hidden=true;
    sheet.setAttribute('role','dialog');
    sheet.setAttribute('aria-modal','true');
    sheet.setAttribute('aria-label','宫位详情');
    sheet.innerHTML='<div class="qm-sheet-backdrop" data-qm-close></div><div class="qm-sheet-panel" tabindex="-1"><div class="qm-sheet-grip" aria-hidden="true"></div><div class="qm-sheet-body"></div></div>';
    doc.body.appendChild(sheet);
    sheet.addEventListener('click',function(e){
      var t=e.target;
      if(t.closest('[data-qm-close]'))closeSheet(true);
      else if(t.closest('[data-qm-more]')){closeSheet(false);scrollToEl($('infoPanel'))}
    });
    doc.addEventListener('keydown',function(e){if(e.key==='Escape'&&sheet&&!sheet.hidden)closeSheet(true)});
    return sheet;
  }
  function cell(label,value,cls){return '<div class="qm-sheet-cell"><span>'+label+'</span><b'+(cls?' class="'+cls+'"':'')+'>'+(value||'—')+'</b></div>'}
  function openSheet(num){
    var data=window.plateData;
    if(!data||!data.gongs||!data.gongs[num])return;
    var o=data.gongs[num];
    var marks=[];
    try{marks=typeof window.getPalaceMarks==='function'?window.getPalaceMarks(o)||[]:[]}catch(e){marks=[]}
    var earth=o.diPan;
    try{if(typeof window.palaceStemText==='function')earth=window.palaceStemText(num,o)}catch(e){}
    var star=o.star==='天芮,天禽'?'芮禽':(o.star||'');
    var flags=[];
    if(o.kongWang)flags.push('旬空');
    if(o.maXing)flags.push('马星');
    var body=ensureSheet().querySelector('.qm-sheet-body');
    body.innerHTML=
      '<div class="qm-sheet-head"><div class="qm-sheet-title">第'+num+'宫 · '+DIRS[num]+'宫<small>五行 '+esc(o.wuxing||'')+(flags.length?' · '+flags.join(' · '):'')+'</small></div>'+
      '<button type="button" class="qm-sheet-close" data-qm-close aria-label="关闭宫位详情">关闭</button></div>'+
      '<div class="qm-sheet-grid">'+
        cell('天盘',esc(o.tianPan||'空'),'qm-h')+cell('九星',esc(star),'qm-s')+cell('八门',o.door?esc(o.door)+'门':'—')+
        cell('地盘',esc(earth||'—'),'qm-e')+cell('八神',esc(o.spirit||''),'qm-g')+cell('隐干',esc(o.yinGan||'—'))+
      '</div>'+
      '<div class="qm-sheet-lines">长生：天盘 '+esc(o.changShengTian||'-')+' / 地盘 '+esc(o.changShengDi||'-')+(o.jigan?'<br>寄干：'+esc(o.jigan):'')+'</div>'+
      (marks.length?'<div class="qm-sheet-tags">'+marks.map(function(m){return '<span>'+esc(m)+'</span>'}).join('')+'</div>':'')+
      '<div class="qm-sheet-actions"><button type="button" data-qm-more>查看完整解读与 AI 分析</button></div>';
    clearTimeout(closeTimer);
    sheet._closing=false;
    var wasHidden=sheet.hidden;
    if(wasHidden)lastFocus=doc.activeElement;
    sheet.hidden=false;
    if(!sheet.classList.contains('qm-open')){
      if(motionOK()&&wasHidden){void sheet.offsetWidth;raf(function(){if(!sheet.hidden&&!sheet._closing)sheet.classList.add('qm-open')})}
      else sheet.classList.add('qm-open');
    }
    var panel=sheet.querySelector('.qm-sheet-panel');
    panel.scrollTop=0;
    var closeBtn=sheet.querySelector('.qm-sheet-close');
    if(closeBtn)closeBtn.focus({preventScroll:true});
  }
  function closeSheet(deselect){
    if(!sheet||sheet.hidden)return;
    sheet._closing=true;
    sheet.classList.remove('qm-open');
    var finish=function(){if(sheet._closing)sheet.hidden=true};
    clearTimeout(closeTimer);
    if(motionOK())closeTimer=setTimeout(finish,380);else finish();
    if(deselect){
      var sel=doc.querySelector('.palace.selected');
      if(sel&&typeof window.selectPalace==='function'){
        var n=Number(sel.id.replace('p',''));
        if(n)origSelect(n);
      }
    }
    if(lastFocus&&lastFocus.focus){try{lastFocus.focus({preventScroll:true})}catch(e){}}
  }

  /* ---------- 包装展示函数（调用原函数，仅追加展示效果） ---------- */
  var origSelect=null;
  function wrap(){
    if(typeof window.renderPlate==='function'&&!window.renderPlate._pm){
      var origRender=window.renderPlate;
      window.renderPlate=function(){
        var r=origRender.apply(this,arguments);
        raf(animateBoard);
        return r;
      };
      window.renderPlate._pm=true;
    }
    if(typeof window.selectPalace==='function'&&!window.selectPalace._pm){
      origSelect=window.selectPalace;
      window.selectPalace=function(num){
        var r=origSelect.apply(this,arguments);
        var sel=doc.querySelector('.palace.selected');
        if(!sel){closeSheet(false);return r}
        if(isCompact())openSheet(num);
        else{
          if(typeof window.setSideTab==='function')window.setSideTab('info');
          raf(placeInks);
          var focus=doc.querySelector('#sideContent .side-focus');
          if(focus&&motionOK())UI.replay(focus,'pm-pop');
          var side=$('sidePanel');
          if(side)side.scrollTo({top:0,behavior:motionOK()?'smooth':'auto'});
        }
        var info=$('infoPanel');
        if(info&&motionOK())UI.replay(info,'pm-refresh');
        return r;
      };
      window.selectPalace._pm=true;
    }
    if(typeof window.doPaiPan==='function'&&!window.doPaiPan._pm){
      var origPai=window.doPaiPan;
      window.doPaiPan=function(){
        closeSheet(false);
        var r=origPai.apply(this,arguments);
        if(isCompact()&&window.plateData)setTimeout(function(){scrollToEl($('qmPlate'))},60);
        return r;
      };
      window.doPaiPan._pm=true;
    }
    if(typeof window.setSideTab==='function'&&!window.setSideTab._pm){
      var origTab=window.setSideTab;
      window.setSideTab=function(){var r=origTab.apply(this,arguments);placeInks();raf(placeInks);return r};
      window.setSideTab._pm=true;
    }
    if(typeof window.switchCal==='function'&&!window.switchCal._pm){
      var origCal=window.switchCal;
      window.switchCal=function(){var r=origCal.apply(this,arguments);placeInks();raf(placeInks);return r};
      window.switchCal._pm=true;
    }
  }

  /* 记录快捷入口：切到对应标签并滚动到侧栏 */
  window.qmShowRecords=function(kind){
    if(typeof window.setSideTab==='function')window.setSideTab(kind==='saved'?'saved':'auto');
    var side=$('sidePanel');
    if(isCompact())scrollToEl(side);
    else if(side)side.scrollTo({top:0,behavior:motionOK()?'smooth':'auto'});
    var search=$(kind==='saved'?'historySearch':'autoHistorySearch');
    if(search&&!isCompact())setTimeout(function(){try{search.focus({preventScroll:true})}catch(e){}},200);
  };

  UI.smoothDetails('#qimenBaziLink');

  UI.ready(function(){
    UI.decorateHero({seal:'遁',eyebrow:'九宫 · 八门 · 九星 · 八神',outer:'坎坤震巽中乾兑艮离休生伤杜景死惊开',inner:'甲乙丙丁戊己庚辛壬癸'});
    wrap();
    placeInks();
    var resizeTimer=null;
    window.addEventListener('resize',function(){
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(function(){
        placeInksInstant();
        if(!isCompact())closeSheet(false);
      },80);
    });
    if(doc.fonts&&doc.fonts.ready)doc.fonts.ready.then(placeInks);
    /* 宫位支持键盘：Enter / 空格 选中 */
    var board=$('board');
    if(board){
      board.addEventListener('keydown',function(e){
        var p=e.target&&e.target.closest?e.target.closest('.palace'):null;
        if(!p||(e.key!=='Enter'&&e.key!==' '))return;
        e.preventDefault();
        p.click();
      });
      var setTab=function(){each(board.querySelectorAll('.palace'),function(p){if(!p.hasAttribute('tabindex'))p.tabIndex=0})};
      setTab();
      if('MutationObserver' in window)new MutationObserver(setTab).observe(board,{childList:true});
    }
  });
})();
