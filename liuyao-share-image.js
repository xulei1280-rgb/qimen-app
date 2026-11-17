/* 六爻「保存为图片」—— 纯 Canvas 2D 绘制，不引第三方库 */
(function(){
var W=360,S=3,PAD=16; // 逻辑宽 360，×3 = 1080px 输出
var C={paper:'#f4eee3',card:'#fffdf8',card2:'#fbf6ec',ink:'#1b1814',text:'#2b261f',muted:'#7a6f62',faint:'#a2978a',gold:'#b08a46',goldDeep:'#8a6a2f',goldLight:'#dcc08a',cinnabar:'#a8352a',jade:'#2f5a4b',onInk:'#f2e8d4',line:'rgba(110,84,44,.15)',line2:'rgba(110,84,44,.26)'};
var SERIF='"Songti SC","STSong","Noto Serif CJK SC","Source Han Serif SC",serif',SANS='-apple-system,"PingFang SC","Noto Sans CJK SC","Microsoft YaHei",sans-serif';
function font(w,size,fam){return w+' '+size+'px '+(fam||SANS)}
function wrap(ctx,text,maxW){var out=[],line='';Array.from(String(text||'')).forEach(function(ch){if(ctx.measureText(line+ch).width>maxW&&line){out.push(line);line=ch}else line+=ch});if(line)out.push(line);return out}
function rrect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function para(ctx,text,x,y,maxW,lh,f,color){ctx.font=f;ctx.fillStyle=color;var lines=wrap(ctx,text,maxW);lines.forEach(function(l,i){ctx.fillText(l,x,y+i*lh)});return lines.length*lh}
function yao(ctx,x,y,w,line){var h=5;ctx.fillStyle=line.moving?C.cinnabar:C.text;if(line.yinYang==='阳')ctx.fillRect(x,y,w,h);else{var g=w*.22;ctx.fillRect(x,y,(w-g)/2,h);ctx.fillRect(x+(w+g)/2,y,(w-g)/2,h)}
  if(line.moving){ctx.font=font(600,10);ctx.fillStyle=C.cinnabar;ctx.fillText(line.value===9?'○':'×',x+w+3,y+5)}}
window.drawLiuyaoShareImage=function(record,plate,verdict,useGod){
  var cv=document.createElement('canvas');cv.width=W*S;cv.height=2400*S;var ctx=cv.getContext('2d');ctx.scale(S,S);ctx.textBaseline='alphabetic';
  ctx.fillStyle=C.paper;ctx.fillRect(0,0,W,2400);
  var y=0,innerW=W-PAD*2;
  // —— 墨色题头
  var qLines;ctx.font=font(600,19,SERIF);qLines=wrap(ctx,record.question,innerW);var headH=34+qLines.length*27+40;
  ctx.fillStyle=C.ink;ctx.fillRect(0,0,W,headH);
  var g=ctx.createLinearGradient(0,0,W,0);g.addColorStop(0,'rgba(220,192,138,0)');g.addColorStop(.5,'rgba(220,192,138,.75)');g.addColorStop(1,'rgba(220,192,138,0)');ctx.fillStyle=g;ctx.fillRect(0,headH-1,W,1);
  ctx.font=font(600,10.5);ctx.fillStyle=C.goldLight;ctx.letterSpacing='3px';ctx.fillText('六 爻 卦 案',PAD,26);ctx.letterSpacing='0px';
  // 朱砂小印
  ctx.save();ctx.translate(W-PAD-22,22);ctx.rotate(-4*Math.PI/180);rrect(ctx,-13,-13,26,26,4);ctx.fillStyle=C.cinnabar;ctx.fill();ctx.font=font(700,11,SERIF);ctx.fillStyle='#f6e7dc';ctx.textAlign='center';ctx.fillText('卦',0,4);ctx.restore();ctx.textAlign='left';
  ctx.font=font(600,19,SERIF);ctx.fillStyle=C.onInk;qLines.forEach(function(l,i){ctx.fillText(l,PAD,58+i*27)});
  var type=(window.TOPIC_LABELS&&TOPIC_LABELS[record.questionType])||'';
  ctx.font=font(400,11.5);ctx.fillStyle='rgba(242,232,212,.62)';ctx.fillText((type?type+' · ':'')+record.castTime.input.replace('T',' ')+' 北京时间',PAD,58+qLines.length*27+4);
  y=headH+18;
  // —— 本卦之变卦
  var moving=plate.lines.some(function(l){return l.moving});
  ctx.font=font(600,20,SERIF);ctx.fillStyle=C.ink;var t1=plate.primary.fullName;ctx.fillText(t1,PAD,y+18);var x1=PAD+ctx.measureText(t1).width;
  if(moving){ctx.font=font(400,12);ctx.fillStyle=C.faint;ctx.fillText(' 之 ',x1+2,y+16);var x2=x1+2+ctx.measureText(' 之 ').width;ctx.font=font(600,20,SERIF);ctx.fillStyle=C.goldDeep;ctx.fillText(plate.changed.fullName,x2,y+18)}
  else{ctx.font=font(400,12);ctx.fillStyle=C.faint;ctx.fillText('（无动爻）',x1+4,y+16)}
  ctx.font=font(400,11.5);ctx.fillStyle=C.muted;ctx.fillText(plate.calendar.monthGZ+'月  '+plate.calendar.dayGZ+'日  旬空 '+plate.calendar.voidBranches.join(''),PAD,y+40);
  y+=56;
  // —— 六列盘面（缩进一图宽，不横滑）
  var cols=[['六神',44],['伏神',36],['本卦',98],['爻象',50],['',28],['变卦',72]];
  var rowH=44,headRow=26,tableH=headRow+rowH*6;
  ctx.save();rrect(ctx,PAD,y,innerW,tableH,12);ctx.fillStyle=C.card;ctx.fill();ctx.strokeStyle=C.line2;ctx.lineWidth=.8;ctx.stroke();ctx.clip();
  ctx.fillStyle='#efe1ca';ctx.fillRect(PAD,y,innerW,headRow);
  var cx=PAD+8;ctx.font=font(700,9.5);ctx.fillStyle='#665746';cols.forEach(function(c){ctx.fillText(c[0]==='爻象'?'爻象':(c[0]||'世应'),cx,y+17);cx+=c[1]});
  plate.lines.slice().reverse().forEach(function(line,i){
    var ry=y+headRow+i*rowH,isUse=useGod&&useGod.position===line.position;
    if(line.moving){var mg=ctx.createLinearGradient(PAD,0,PAD+innerW*.6,0);mg.addColorStop(0,'rgba(167,54,36,.09)');mg.addColorStop(1,'rgba(167,54,36,0)');ctx.fillStyle=mg;ctx.fillRect(PAD,ry,innerW,rowH)}
    if(isUse){ctx.fillStyle='rgba(47,90,75,.08)';ctx.fillRect(PAD,ry,innerW,rowH);ctx.fillStyle=C.jade;ctx.fillRect(PAD,ry,3,rowH)}
    if(i){ctx.fillStyle=C.line;ctx.fillRect(PAD,ry,innerW,.8)}
    var x=PAD+8,mid=ry+18,sub=ry+33;
    ctx.font=font(700,11);ctx.fillStyle=C.text;ctx.fillText(line.label,x,mid);ctx.font=font(400,10);ctx.fillStyle=C.muted;ctx.fillText(line.spirit,x,sub);x+=cols[0][1];
    if(line.hidden){ctx.font=font(600,10);ctx.fillStyle=C.cinnabar;ctx.fillText(line.hidden.relative,x,mid);ctx.font=font(400,10);ctx.fillStyle=C.text;ctx.fillText(line.hidden.stem+line.hidden.branch,x,sub)}else{ctx.font=font(400,11);ctx.fillStyle=C.faint;ctx.fillText('—',x,mid+6)}x+=cols[1][1];
    ctx.font=font(700,12.5,SERIF);ctx.fillStyle=C.cinnabar;ctx.fillText(line.original.relative,x,mid);var rw=ctx.measureText(line.original.relative).width;ctx.font=font(600,12.5,SERIF);ctx.fillStyle=C.ink;ctx.fillText(' '+line.original.stem+line.original.branch,x+rw,mid);var sw=ctx.measureText(' '+line.original.stem+line.original.branch).width;ctx.font=font(400,9.5);ctx.fillStyle=C.faint;ctx.fillText(' '+line.original.element,x+rw+sw,mid);
    ctx.font=font(400,9);ctx.fillStyle=C.muted;var ft=(line.facts||[]).join(' · ');ctx.fillText(wrap(ctx,ft,cols[2][1]-4)[0]||'',x,sub);x+=cols[2][1];
    yao(ctx,x,ry+19,28,line);x+=cols[3][1];
    ctx.font=font(700,12,SERIF);ctx.fillStyle=line.shi?C.cinnabar:C.goldDeep;ctx.fillText(line.shi?'世':(line.ying?'应':''),x,mid+6);x+=cols[4][1];
    if(line.moving){ctx.font=font(600,11.5,SERIF);ctx.fillStyle=C.cinnabar;ctx.fillText(line.changed.relative,x,mid);var cw=ctx.measureText(line.changed.relative).width;ctx.fillStyle=C.ink;ctx.fillText(' '+line.changed.stem+line.changed.branch,x+cw,mid);ctx.font=font(400,9);ctx.fillStyle=C.muted;ctx.fillText((line.changeFacts||[]).join(' · '),x,sub)}
    else{ctx.font=font(400,10);ctx.fillStyle=C.faint;ctx.fillText('静',x,mid+6)}
  });
  ctx.restore();y+=tableH+16;
  // —— 关键结论
  if(verdict){
    var cardY=y,cy=y+22;
    // 先量高度
    function measure(){var h=22+24+8;ctx.font=font(400,12.5);h+=wrap(ctx,verdict.answer,innerW-32).length*20+8;ctx.font=font(400,11.5);verdict.reasons.forEach(function(r){h+=wrap(ctx,r.text,innerW-50).length*17+6});h+=10+18;verdict.timing.forEach(function(t){h+=wrap(ctx,t,innerW-44).length*17+4});h+=(useGod?26:0)+14;return h}
    var ch=measure();rrect(ctx,PAD,cardY,innerW,ch,14);ctx.fillStyle=C.card;ctx.fill();ctx.strokeStyle=C.line2;ctx.lineWidth=.8;ctx.stroke();var TONE={favorable:['#2f6b53','#2f5a4b'],obstructed:['#8a7a2f',C.ink],strained:['#b0702f','#8f4f1e'],unfavorable:[C.cinnabar,C.cinnabar],mixed:['#6f6aa0',C.ink],timing:['#6f6aa0',C.ink]}[verdict.tendency]||[C.gold,C.ink];ctx.fillStyle=TONE[0];ctx.fillRect(PAD,cardY+14,3,ch-28);
    ctx.font=font(600,10);ctx.fillStyle=C.goldDeep;ctx.letterSpacing='2px';ctx.fillText('本卦结论',PAD+16,cy);ctx.letterSpacing='0px';ctx.font=font(400,10);ctx.fillStyle=C.faint;ctx.fillText('规则初断',PAD+16+ctx.measureText('本卦结论').width+20,cy);
    cy+=26;ctx.font=font(700,20,SERIF);ctx.fillStyle=TONE[1];ctx.fillText(verdict.label,PAD+16,cy);cy+=12;
    cy+=para(ctx,verdict.answer,PAD+16,cy+8,innerW-32,20,font(400,12.5),C.text)+8;
    verdict.reasons.forEach(function(r){var plus=r.tone==='support';ctx.font=font(700,12);ctx.fillStyle=plus?C.jade:C.cinnabar;ctx.fillText(plus?'+':'−',PAD+18,cy+5);cy+=para(ctx,r.text,PAD+34,cy+5,innerW-50,17,font(400,11.5),C.text)+6});
    cy+=10;ctx.font=font(600,11);ctx.fillStyle=C.goldDeep;ctx.fillText('应期线索',PAD+16,cy+5);cy+=18;
    verdict.timing.forEach(function(t){ctx.fillStyle=C.gold;ctx.fillRect(PAD+19,cy+1,3,3);cy+=para(ctx,t,PAD+28,cy+5,innerW-44,17,font(400,11.5),C.text)+4});
    if(useGod){cy+=10;ctx.fillStyle=C.line;ctx.fillRect(PAD+16,cy-4,innerW-32,.8);ctx.font=font(400,10.5);ctx.fillStyle=C.muted;ctx.fillText('用神  '+useGod.label+' '+(useGod.hidden?'伏':'')+useGod.relative+useGod.stemBranch+'  ·  规则 '+verdict.rule,PAD+16,cy+12)}
    y=cardY+ch+18;
  }
  // —— 页脚：起卦时间 + 网站名
  var fg=ctx.createLinearGradient(PAD,0,W-PAD,0);fg.addColorStop(0,'rgba(176,138,70,0)');fg.addColorStop(.5,'rgba(176,138,70,.55)');fg.addColorStop(1,'rgba(176,138,70,0)');ctx.fillStyle=fg;ctx.fillRect(PAD,y,innerW,.8);
  y+=22;ctx.font=font(400,11);ctx.fillStyle=C.muted;ctx.fillText('起卦  '+record.castTime.input.replace('T',' ')+'（北京时间）',PAD,y);
  ctx.font=font(600,12,SERIF);ctx.fillStyle=C.goldDeep;ctx.textAlign='right';ctx.letterSpacing='1px';ctx.fillText('qimenbazi.cn',W-PAD,y);ctx.letterSpacing='0px';ctx.textAlign='left';
  y+=18;ctx.font=font(400,9.5);ctx.fillStyle=C.faint;ctx.fillText('规则初断仅供参考 · 已隐藏姓名与性别',PAD,y);y+=20;
  var out=document.createElement('canvas');out.width=W*S;out.height=Math.ceil(y*S);out.getContext('2d').drawImage(cv,0,0);return out;
};

var closeShot=null;
window.showLiuyaoShot=function(dataUrl,returnFocus){
  if(closeShot)closeShot();
  var previousFocus=returnFocus||document.activeElement,overflow=document.body.style.overflow;
  var layer=document.createElement('div');layer.className='ly-shot-layer';
  layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-label','卦案图片');
  layer.innerHTML='<div class="ly-shot-bar"><span class="ly-shot-hint">长按图片保存</span><button type="button" class="ly-shot-close">关闭</button></div><div class="ly-shot-scroll"><img alt="六爻卦案长图"></div>';
  layer.querySelector('img').src=dataUrl;
  var close=layer.querySelector('.ly-shot-close');
  closeShot=function(){
    document.removeEventListener('keydown',onKey);layer.remove();document.body.style.overflow=overflow;closeShot=null;
    if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});
  };
  function onKey(event){
    if(event.key==='Escape'){event.preventDefault();closeShot()}
    else if(event.key==='Tab'){event.preventDefault();close.focus()}
  }
  close.onclick=closeShot;document.addEventListener('keydown',onKey);
  document.body.appendChild(layer);document.body.style.overflow='hidden';close.focus();
};
var saving=false;
window.saveLiuyaoImage=async function(btn){
  if(!currentRecord||!currentPlate||saving)return;
  saving=true;btn.setAttribute('aria-busy','true');btn.disabled=true;btn.querySelector('.ly-save-text').textContent='生成中';
  try{
    if(document.fonts&&document.fonts.ready)await document.fonts.ready;
    var cv=drawLiuyaoShareImage(currentRecord,currentPlate,currentVerdict,activeUseGod());
    var blob=await new Promise(function(resolve){cv.toBlob(resolve,'image/png')});
    if(!blob)throw new Error('无法生成 PNG 图片');
    var name='六爻卦案-'+currentRecord.castTime.input.replace(/[-:T]/g,'').slice(0,12)+'.png';
    var file=new File([blob],name,{type:'image/png'}),fallback=true;
    try{
      if(!/MicroMessenger/i.test(navigator.userAgent)&&navigator.canShare&&navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:'六爻卦案'});fallback=false;
      }
    }catch(error){if(error&&error.name==='AbortError')fallback=false}
    if(fallback)showLiuyaoShot(cv.toDataURL('image/png'),btn);
  }catch(error){setStatus('plateActionStatus','生成失败：'+error.message,true)}
  finally{saving=false;btn.removeAttribute('aria-busy');btn.disabled=false;btn.querySelector('.ly-save-text').textContent='保存为图片'}
};
})();
