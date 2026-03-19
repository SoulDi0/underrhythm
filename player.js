// ── DOM refs ──────────────────────────────────────────────────────────────────
const audio         = document.getElementById('audio');
const playerCard    = document.getElementById('playerCard');
const cardClipEl    = document.getElementById('cardClip');
const coverImg      = document.getElementById('coverImg');
const defaultCover  = document.getElementById('defaultCover');
const heartBtn      = document.getElementById('heartBtn');
const heartLikedImg = document.getElementById('heartLikedImg');
const heartSvgEl    = document.getElementById('heartSvg');
const heartPathEl   = document.getElementById('heartPath');
const progressTrack = document.getElementById('progressTrack');
const progressFill  = document.getElementById('progressFill');
const progressThumb = document.getElementById('progressThumb');
const thumbHeart    = document.getElementById('thumbHeart');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl   = document.getElementById('totalTime');
const playBtn       = document.getElementById('playBtn');
const playIcon      = document.getElementById('playIcon');
const pauseIcon     = document.getElementById('pauseIcon');
const pauseSpans    = pauseIcon.querySelectorAll('span');
const prevBtn       = document.getElementById('prevBtn');
const nextBtn       = document.getElementById('nextBtn');
const charNameEl    = document.getElementById('charName');
const trackTitleEl  = document.getElementById('trackTitle');
const volIcon       = document.getElementById('volIcon');
const volWave       = document.getElementById('volWave');
const volumeSlider  = document.getElementById('volumeSlider');
const shuffleBtn    = document.getElementById('shuffleBtn');
const repeatBtn     = document.getElementById('repeatBtn');
const shuffleSvg    = shuffleBtn.querySelector('svg');
const repeatSvg     = repeatBtn.querySelector('svg');
const artNameEl     = document.getElementById('artName');
const musicNameEl   = document.getElementById('musicName');
const artLinkEl     = document.getElementById('artLink');
const musicLinkEl   = document.getElementById('musicLink');
const prevCard      = document.getElementById('prevCard');
const nextCard      = document.getElementById('nextCard');
const ghostCard     = document.getElementById('ghostCard');

// Кэш элементов только внутри основной карточки
const mainSkipPolygons = playerCard.querySelectorAll('.skip-svg polygon');
const mainSkipLines    = playerCard.querySelectorAll('.skip-svg line');
const mainTimeLabels   = playerCard.querySelectorAll('.time-label');
const mainCreditLinks  = playerCard.querySelectorAll('.credit-link');
const mainCreditLabels = playerCard.querySelectorAll('.credit-label');

// ── Состояние ────────────────────────────────────────────────────────────────
let currentIndex = 0, isPlaying = false, isDragging = false;
let liked = new Set(), isShuffle = false, isRepeat = false;

// Кэш последних индексов боковых карточек — не перерисовываем без нужды
let _prevIdx = -1, _nextIdx = -1;

// ── Частицы — только 6, длинные интервалы ────────────────────────────────────
(function(){
  const c = document.getElementById('particles');
  for (let i = 0; i < 6; i++){
    const p = document.createElement('div');
    p.className = 'particle';
    const s = Math.random() * 2 + 1;
    p.style.cssText = 'width:'+s+'px;height:'+s+'px;left:'+(Math.random()*100)+'%;bottom:'+(Math.random()*15)+'%;--dur:'+(10+Math.random()*10)+'s;--delay:'+(Math.random()*10)+'s;';
    c.appendChild(p);
  }
})();

// ── Утилиты ───────────────────────────────────────────────────────────────────
function fmt(s){ if (!s||isNaN(s)) return '0:00'; return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'); }
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Сердечко ──────────────────────────────────────────────────────────────────
const HEART_NORMAL   = 'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5';
const HEART_INVERTED = 'M22 14.5a5.5 5.5 0 0 1-9.591 3.676.56.56 0 0 0-.818 0A5.49 5.49 0 0 1 2 14.5c0-2.29 1.5-4 3-5.5l5.492-5.313a2 2 0 0 1 3-.019L19 9c1.5 1.5 3 3.2 3 5.5';

function setHeartShape(src, color){
  heartPathEl.setAttribute('d', src === 'up' ? HEART_INVERTED : HEART_NORMAL);
  heartPathEl.setAttribute('fill', 'none');
  heartPathEl.setAttribute('stroke', color || '#000000');
  heartPathEl.setAttribute('stroke-width', '1.8');
  heartPathEl.setAttribute('stroke-linejoin', 'round');
}
function showHeartState(isLiked, t){
  var sz = (t.heartSize || 36) + 'px';
  if (isLiked){
    heartSvgEl.style.display = 'none';
    heartLikedImg.src = t.heartLiked||''; heartLikedImg.style.display = 'block';
    heartLikedImg.style.width = sz; heartLikedImg.style.height = sz;
  } else if (t.heartUnliked){
    heartSvgEl.style.display = 'none';
    heartLikedImg.src = t.heartUnliked; heartLikedImg.style.display = 'block';
    heartLikedImg.style.width = sz; heartLikedImg.style.height = sz;
  } else {
    heartLikedImg.style.display = 'none'; heartSvgEl.style.display = 'block';
    heartSvgEl.style.width = sz; heartSvgEl.style.height = sz;
    setHeartShape(t.heartDefault, t.heartColor||'#000000');
  }
}

// ── Тема основной карточки ────────────────────────────────────────────────────
function applyTheme(t){
  cardClipEl.style.background  = t.cardColor;
  playerCard.style.background  = 'none';
  playBtn.style.background     = t.btnColor;
  playIcon.style.fill          = t.btnText;
  pauseSpans.forEach(function(s){ s.style.background = t.btnText; });
  mainSkipPolygons.forEach(function(el){ el.style.fill = t.skipColor; el.style.stroke = t.skipColor; });
  mainSkipLines.forEach(function(el){ el.style.stroke = t.skipColor; });
  progressFill.style.background  = t.progressFill;
  progressTrack.style.background = t.progressBg;
  if (thumbHeart) thumbHeart.style.fill = t.progressFill;
  mainTimeLabels.forEach(function(el){ el.style.color = t.timeColor; });
  charNameEl.style.color   = t.charColor;
  trackTitleEl.style.color = t.titleColor;
  mainCreditLinks.forEach(function(el){ el.style.color = t.creditName; });
  mainCreditLabels.forEach(function(el){ el.style.color = t.creditLabel; });
  playerCard.style.setProperty('--card-popup-bg',     t.popupBg);
  playerCard.style.setProperty('--card-popup-border', t.popupBorder);
  playerCard.style.setProperty('--card-popup-track',  t.popupTrack);
  playerCard.style.setProperty('--card-popup-thumb',  t.popupThumb);
  volIcon.style.stroke = t.skipColor;
  updateVolumeFill();
  updateModeButtons(t);
}

function updateModeButtons(t){
  t = t || TRACKS[currentIndex];
  shuffleSvg.style.transition = repeatSvg.style.transition = 'none';
  shuffleSvg.offsetHeight;
  shuffleSvg.style.stroke = isShuffle ? t.btnColor : t.modeColor;
  repeatSvg.style.stroke  = isRepeat  ? t.btnColor : t.modeColor;
  volIcon.style.stroke = t.skipColor;
  var style = document.getElementById('volSliderStyle') || document.createElement('style');
  style.id = 'volSliderStyle';
  style.textContent = '.volume-slider::-webkit-slider-thumb{background:'+t.popupThumb+'}.volume-slider::-moz-range-thumb{background:'+t.popupThumb+'}';
  document.head.appendChild(style);
}

// ── Предзагрузка ─────────────────────────────────────────────────────────────
const _preloadImgs = [0,1,2,3,4].map(function(i){ return document.getElementById('preload'+i); });
function preloadImages(center){
  var n=TRACKS.length, slot=0;
  [-2,-1,1,2,0].forEach(function(off){
    if (slot>=_preloadImgs.length) return;
    var src=TRACKS[(center+off+n)%n].cover;
    if (!src||src.toLowerCase().endsWith('.gif')) return;
    _preloadImgs[slot++].src = src;
  });
}

// ── Загрузка трека ────────────────────────────────────────────────────────────
function loadTrack(i){
  currentIndex = i;
  var t = TRACKS[i];
  audio.src = t.music; audio.load();
  var src = t.cover, isGif = src && src.toLowerCase().endsWith('.gif');
  if (!src){
    coverImg.style.display='none'; defaultCover.style.display='flex';
  } else if (isGif){
    coverImg.src=src+'?t='+Date.now(); coverImg.style.display='block'; coverImg.style.opacity='1'; defaultCover.style.display='none';
  } else {
    var tmp=new Image();
    tmp.onload=function(){ coverImg.src=src; coverImg.style.display='block'; defaultCover.style.display='none'; coverImg.style.opacity='1'; };
    tmp.onerror=function(){ coverImg.style.display='none'; defaultCover.style.display='flex'; };
    tmp.src=src;
    if (tmp.complete&&tmp.naturalWidth>0){
      coverImg.src=src; coverImg.style.display='block'; coverImg.style.opacity='1'; defaultCover.style.display='none';
    } else { coverImg.style.opacity='0'; }
  }
  applyTheme(t);
  charNameEl.textContent=t.character||''; trackTitleEl.textContent=t.title||'';
  artNameEl.textContent=t.artName||''; musicNameEl.textContent=t.musicName||'';
  artLinkEl.href=t.artUrl||'#'; musicLinkEl.href=t.musicUrl||'#';
  var lk=liked.has(i); heartBtn.classList.toggle('liked',lk); showHeartState(lk,t);
  progressFill.style.width='0%'; progressThumb.style.left='0%';
  currentTimeEl.textContent='0:00'; totalTimeEl.textContent='0:00';
  preloadImages(i);
}

function setPlayUI(on){ isPlaying=on; playIcon.style.display=on?'none':'block'; pauseIcon.style.display=on?'flex':'none'; }

// ── Плеер ─────────────────────────────────────────────────────────────────────
playBtn.addEventListener('click', function(){
  if (!TRACKS.length) return;
  if (isPlaying){ audio.pause(); setPlayUI(false); }
  else { audio.play().then(function(){ setPlayUI(true); }).catch(function(e){ console.warn(e); }); }
});

// ── Навигация с очередью ──────────────────────────────────────────────────────
var _navQueue=[];
function processNavQueue(){ if (!carouselBusy&&_navQueue.length) _navQueue.shift()(); }
function navigate(dir){
  _navQueue.push(function(){
    var n=TRACKS.length, newIdx=(currentIndex+dir+n)%n;
    prevBtn.style.pointerEvents=nextBtn.style.pointerEvents='none';
    carouselNavigate(dir,function(){
      loadTrack(newIdx);
      if (isPlaying) audio.play().then(function(){ setPlayUI(true); }).catch(function(){});
    });
    setTimeout(function(){ prevBtn.style.pointerEvents=nextBtn.style.pointerEvents=''; processNavQueue(); },CAROUSEL_DUR+30);
  });
  if (!carouselBusy) processNavQueue();
}
prevBtn.addEventListener('click',function(){ navigate(-1); });
nextBtn.addEventListener('click',function(){ navigate(1); });

audio.addEventListener('ended',function(){
  if (isRepeat){ audio.currentTime=0; audio.play().then(function(){ setPlayUI(true); }).catch(function(){}); return; }
  var target;
  if (isShuffle){ do{target=Math.floor(Math.random()*TRACKS.length);}while(TRACKS.length>1&&target===currentIndex); }
  else { target=(currentIndex+1)%TRACKS.length; }
  _navQueue.push(function(){
    carouselNavigate(1,function(){ loadTrack(target); audio.play().then(function(){ setPlayUI(true); }).catch(function(){}); });
    setTimeout(processNavQueue,CAROUSEL_DUR+30);
  });
  if (!carouselBusy) processNavQueue();
});

// ── Прогресс (rAF throttle) ───────────────────────────────────────────────────
audio.addEventListener('loadedmetadata',function(){ totalTimeEl.textContent=fmt(audio.duration); });
var _rafPending=false;
audio.addEventListener('timeupdate',function(){
  if (isDragging||!audio.duration||_rafPending) return;
  _rafPending=true;
  requestAnimationFrame(function(){
    _rafPending=false;
    var p=audio.currentTime/audio.duration*100;
    progressFill.style.width=p+'%'; progressThumb.style.left=p+'%';
    currentTimeEl.textContent=fmt(audio.currentTime);
  });
});

function seekTo(cx){
  var r=progressTrack.getBoundingClientRect(), p=Math.max(0,Math.min(cx-r.left,r.width))/r.width;
  if (audio.duration) audio.currentTime=p*audio.duration;
  progressFill.style.width=(p*100)+'%'; progressThumb.style.left=(p*100)+'%';
  currentTimeEl.textContent=fmt(p*(audio.duration||0));
}
progressTrack.addEventListener('mousedown',function(e){
  isDragging=true; seekTo(e.clientX);
  var mv=function(e2){seekTo(e2.clientX);}, up=function(){isDragging=false;document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};
  document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
});
progressTrack.addEventListener('touchstart',function(e){
  isDragging=true; seekTo(e.touches[0].clientX);
  var mv=function(e2){seekTo(e2.touches[0].clientX);}, en=function(){isDragging=false;document.removeEventListener('touchmove',mv);document.removeEventListener('touchend',en);};
  document.addEventListener('touchmove',mv,{passive:true}); document.addEventListener('touchend',en);
},{passive:true});

// ── Кнопки ────────────────────────────────────────────────────────────────────
heartBtn.addEventListener('click',function(){
  var t=TRACKS[currentIndex];
  if (liked.has(currentIndex)){ liked.delete(currentIndex); heartBtn.classList.remove('liked'); showHeartState(false,t); }
  else { liked.add(currentIndex); heartBtn.classList.remove('liked'); void heartBtn.offsetWidth; heartBtn.classList.add('liked'); showHeartState(true,t); }
});
shuffleBtn.addEventListener('click',function(){ isShuffle=!isShuffle; if(isShuffle)isRepeat=false; updateModeButtons(); });
repeatBtn.addEventListener('click',function(){ isRepeat=!isRepeat; if(isRepeat)isShuffle=false; updateModeButtons(); });

// ── Громкость ─────────────────────────────────────────────────────────────────
function updateVolumeFill(){
  var val=parseFloat(volumeSlider.value)*100, t=TRACKS[currentIndex];
  volumeSlider.style.background='linear-gradient(to top,'+(t?t.popupThumb:'#1a1a1a')+' '+val+'%,'+(t?t.popupTrack:'rgba(0,0,0,0.15)')+' '+val+'%)';
}
volumeSlider.addEventListener('input',function(){ audio.volume=parseFloat(this.value); volWave.style.display=audio.volume===0?'none':''; updateVolumeFill(); });
(function(){
  var btn=document.getElementById('volumeBtn'),popup=document.getElementById('volumePopup'),t=null;
  function show(){ clearTimeout(t); popup.classList.add('vol-visible'); }
  function hide(){ t=setTimeout(function(){ popup.classList.remove('vol-visible'); },120); }
  btn.addEventListener('mouseenter',show); btn.addEventListener('mouseleave',hide);
  popup.addEventListener('mouseenter',show); popup.addEventListener('mouseleave',hide);
})();

document.addEventListener('keydown',function(e){
  if (e.code==='Space'){ e.preventDefault(); playBtn.click(); }
  if (e.code==='ArrowRight') navigate(1);
  if (e.code==='ArrowLeft')  navigate(-1);
});

// ── Карусель ──────────────────────────────────────────────────────────────────
var CAROUSEL_OFFSET=510, CAROUSEL_SCALE=0.88, CAROUSEL_DIM=0.45, CAROUSEL_DUR=500;
var carouselBusy=false;
var CAROUSEL_ANIM='transform 0.5s cubic-bezier(0.16,1,0.3,1), filter 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.5s ease';

function snapCard(el,x,scale,bright){
  el.style.transition='none'; el.offsetHeight;
  el.style.opacity='1'; el.style.transform='translateX('+x+'px) scale('+scale+')'; el.style.filter='brightness('+bright+')';
}

// Лёгкая боковая карточка — только фон + картинка + имя персонажа
// Полный контент не нужен: пользователь не взаимодействует с боковыми карточками
function fillSideCard(el, idx){
  if (el._idx === idx) return;
  el._idx = idx;
  var t=TRACKS[idx], skipClr=t.skipColor, modeClr=t.modeColor;
  var skipPoly='fill:'+skipClr+';stroke:'+skipClr, skipLine='stroke:'+skipClr+';fill:none';
  var heartPath = t.heartDefault==='up'
    ? 'M22 14.5a5.5 5.5 0 0 1-9.591 3.676.56.56 0 0 0-.818 0A5.49 5.49 0 0 1 2 14.5c0-2.29 1.5-4 3-5.5l5.492-5.313a2 2 0 0 1 3-.019L19 9c1.5 1.5 3 3.2 3 5.5'
    : 'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5';
  var lk=liked.has(idx);
  var heartHtml = lk
    ? '<img style="width:'+( t.heartSize||36)+'px;height:'+(t.heartSize||36)+'px;object-fit:contain;display:block" src="'+esc(t.heartLiked||'')+'">'
    : t.heartUnliked
      ? '<img style="width:'+(t.heartSize||36)+'px;height:'+(t.heartSize||36)+'px;object-fit:contain;display:block" src="'+esc(t.heartUnliked)+'">'
      : '<svg class="heart-svg" viewBox="0 0 24 24"><path d="'+heartPath+'" fill="none" stroke="'+t.heartColor+'" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  el.style.background='none';
  el.innerHTML=
    '<div class="card-clip" style="background:'+t.cardColor+'"></div>'+
    '<div class="char-name" style="color:'+t.charColor+'">'+esc(t.character||'')+'</div>'+
    '<div class="album-wrapper"><img src="'+(t.cover||'')+'" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="default-cover" style="display:none">♪</div></div>'+
    '<div class="actions-row"><button class="heart-btn" style="pointer-events:none">'+heartHtml+'</button></div>'+
    '<div class="track-title" style="color:'+t.titleColor+'">'+esc(t.title||'')+'</div>'+
    '<div class="progress-section"><div class="progress-track" style="background:'+t.progressBg+'">'+
      '<div class="progress-fill" style="width:0%;background:'+t.progressFill+'"></div>'+
      '<div class="progress-thumb" style="left:0%"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35z" style="fill:'+t.progressFill+'"/></svg></div>'+
    '</div><div class="time-row"><span class="time-label" style="color:'+t.timeColor+'">0:00</span><span class="time-label" style="color:'+t.timeColor+'">0:00</span></div></div>'+
    '<div class="controls-row"><div class="left-modes">'+
      '<button class="mode-btn" style="pointer-events:none"><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" style="stroke:'+modeClr+'"><path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/></svg></button>'+
      '<button class="mode-btn" style="pointer-events:none"><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" style="stroke:'+modeClr+'"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></button>'+
    '</div>'+
    '<button class="ctrl-btn" style="pointer-events:none"><svg class="skip-svg" viewBox="0 0 24 24"><polygon points="19,20 9,12 19,4" style="'+skipPoly+'"/><line x1="5" y1="4" x2="5" y2="20" stroke-width="2" stroke-linecap="round" style="'+skipLine+'"/></svg></button>'+
    '<button class="ctrl-btn play-btn" style="background:'+t.btnColor+';pointer-events:none"><svg viewBox="0 0 24 24" width="22" height="22" style="fill:'+t.btnText+'"><polygon points="6,3 20,12 6,21"/></svg></button>'+
    '<button class="ctrl-btn" style="pointer-events:none"><svg class="skip-svg" viewBox="0 0 24 24"><polygon points="5,4 15,12 5,20" style="'+skipPoly+'"/><line x1="19" y1="4" x2="19" y2="20" stroke-width="2" stroke-linecap="round" style="'+skipLine+'"/></svg></button>'+
    '<button class="volume-btn" style="pointer-events:none"><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" style="width:26px;height:26px;stroke:'+skipClr+'"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></button>'+
    '</div>'+
    '<div class="credits-row">'+
      '<div class="credit-item"><span class="credit-label" style="color:'+t.creditLabel+'">Art by</span><span class="credit-link" style="color:'+t.creditName+'">'+esc(t.artName||'')+'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span></div>'+
      '<div class="credit-item right"><span class="credit-label" style="color:'+t.creditLabel+'">Music by</span><span class="credit-link" style="color:'+t.creditName+'">'+esc(t.musicName||'')+'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span></div>'+
    '</div>';
}
// Сбрасывает кэш индексов боковых карточек (нужно после liked/heart изменений)
function invalidateSideCards(){ prevCard._idx=-1; nextCard._idx=-1; ghostCard._idx=-1; }

function carouselReset(){
  var n=TRACKS.length;
  var pi=(currentIndex-1+n)%n, ni=(currentIndex+1)%n;
  fillSideCard(prevCard,pi); fillSideCard(nextCard,ni);
  snapCard(prevCard,-CAROUSEL_OFFSET,CAROUSEL_SCALE,CAROUSEL_DIM);
  snapCard(playerCard,0,1,1);
  snapCard(nextCard,CAROUSEL_OFFSET,CAROUSEL_SCALE,CAROUSEL_DIM);
  ghostCard.style.transition='none'; ghostCard.style.opacity='0'; ghostCard.style.transform='translateX(9999px)'; ghostCard.style.zIndex='';
}

function carouselNavigate(dir, onSwap){
  if (carouselBusy) return; carouselBusy=true;
  var n=TRACKS.length, newIdx=(currentIndex+dir+n)%n;
  var staying=dir>0?nextCard:prevCard, leaving=dir>0?prevCard:nextCard;

  preloadImages(newIdx);

  var newSideIdx=dir>0?(currentIndex+2)%n:(currentIndex-2+n)%n;
  ghostCard._idx=-1; // сброс кэша
  fillSideCard(ghostCard,newSideIdx);
  ghostCard.style.zIndex='1'; ghostCard.style.opacity='0'; ghostCard.style.transition='none';
  ghostCard.offsetHeight;
  ghostCard.style.transform='translateX('+(dir*CAROUSEL_OFFSET*2)+'px) scale('+CAROUSEL_SCALE+')';
  ghostCard.style.filter='brightness('+CAROUSEL_DIM+')';
  ghostCard.offsetHeight;

  var newT=TRACKS[newIdx], curT=TRACKS[currentIndex];
  shuffleSvg.getBoundingClientRect();
  shuffleSvg.style.transition=repeatSvg.style.transition='stroke 0.45s ease';
  shuffleSvg.style.stroke=curT.modeColor; repeatSvg.style.stroke=curT.modeColor;
  var stayModes=staying.querySelectorAll('.mode-btn svg');
  if (stayModes.length>=2){
    stayModes[0].style.transition=stayModes[1].style.transition='stroke 0.45s ease';
    stayModes[0].style.stroke=isShuffle?newT.btnColor:newT.modeColor;
    stayModes[1].style.stroke=isRepeat?newT.btnColor:newT.modeColor;
  }

  prevCard.style.transition=playerCard.style.transition=nextCard.style.transition=ghostCard.style.transition=CAROUSEL_ANIM;

  playerCard.style.zIndex='3';
  playerCard.style.transform='translateX('+(-dir*CAROUSEL_OFFSET)+'px) scale('+CAROUSEL_SCALE+')';
  playerCard.style.filter='brightness('+CAROUSEL_DIM+')';
  staying.style.zIndex='4'; staying.style.transform='translateX(0px) scale(1)'; staying.style.filter='brightness(1)';
  leaving.style.zIndex='2'; leaving.style.opacity='0'; leaving.style.filter='brightness(0)';
  ghostCard.style.opacity='1';
  ghostCard.style.transform='translateX('+(dir*CAROUSEL_OFFSET)+'px) scale('+CAROUSEL_SCALE+')';
  ghostCard.style.filter='brightness('+CAROUSEL_DIM+')';

  setTimeout(function(){
    prevCard.style.transition=playerCard.style.transition=nextCard.style.transition=ghostCard.style.transition='none';
    prevCard.offsetHeight;
    shuffleSvg.style.transition=repeatSvg.style.transition='none';
    var cT=TRACKS[currentIndex]; shuffleSvg.style.stroke=cT.modeColor; repeatSvg.style.stroke=cT.modeColor;
    shuffleSvg.getBoundingClientRect();

    onSwap(); // обновляет currentIndex

    ghostCard.style.opacity='0'; ghostCard.style.transform='translateX(9999px)'; ghostCard.style.zIndex='';
    staying.style.zIndex=leaving.style.zIndex=''; leaving.style.opacity='';

    // Сбрасываем кэш боковых карточек — индексы поменялись
    prevCard._idx=-1; nextCard._idx=-1;
    carouselReset();

    var nT=TRACKS[currentIndex];
    shuffleSvg.style.stroke=isShuffle?nT.btnColor:nT.modeColor;
    repeatSvg.style.stroke=isRepeat?nT.btnColor:nT.modeColor;
    staying.style.visibility='hidden'; playerCard.style.zIndex=''; prevCard.offsetHeight; staying.style.visibility='';

    // Обновляем подсветку в меню если оно открыто
    if (menuOpen) renderAllTracks();

    carouselBusy=false;
  },CAROUSEL_DUR);
}

// ── Старт ─────────────────────────────────────────────────────────────────────
// ── Старт ─────────────────────────────────────────────────────────────────────
var startIndex=Math.floor(Math.random()*TRACKS.length);
prevCard._idx=-1; nextCard._idx=-1; ghostCard._idx=-1;

// Клик по боковым карточкам — переключение треков
prevCard.addEventListener('click', function(){ navigate(-1); });
nextCard.addEventListener('click', function(){ navigate(1); });
loadTrack(startIndex); preloadImages(startIndex); setTimeout(carouselReset,100);

// ── Меню ──────────────────────────────────────────────────────────────────────
var menuOpen=false;
const menuBtn      = document.getElementById('menuBtn');
const sideMenu     = document.getElementById('sideMenu');
const panelAll     = document.getElementById('panelAllTracks');
const panelSearch  = document.getElementById('panelSearch');
const panelCredits = document.getElementById('panelCredits');

function toggleMenu(){ menuOpen=!menuOpen; document.body.classList.toggle('menu-open',menuOpen); if(menuOpen){renderAllTracks();showTrackList();} }
menuBtn.addEventListener('click',toggleMenu);

function showTrackList(){
  panelAll.classList.add('visible'); panelSearch.classList.remove('visible');
  panelCredits.classList.remove('visible');
}
function showSearch(){
  panelSearch.classList.add('visible'); panelAll.classList.remove('visible');
  panelCredits.classList.remove('visible');
}

function makeTrackItem(i, container){
  var t = TRACKS[i];
  var item = document.createElement('div');
  item.className = 'menu-track-item' + (i === currentIndex ? ' active-track' : '');


  // Обложка
  var coverHtml = t.cover
    ? '<img src="' + esc(t.cover) + '" style="width:100%;height:100%;object-fit:cover;display:block">'
    : '';

  // Лайк — показываем лайкнутую или пустую иконку
  var isLk = liked.has(i);
  var heartHtml = '';
  if (isLk && t.heartLiked) {
    heartHtml = '<img src="' + esc(t.heartLiked) + '">';
  } else if (!isLk && t.heartUnliked) {
    heartHtml = '<img src="' + esc(t.heartUnliked) + '">';
  } else if (!isLk) {
    // SVG пустое сердце
    var hp = t.heartDefault === 'up'
      ? 'M22 14.5a5.5 5.5 0 0 1-9.591 3.676.56.56 0 0 0-.818 0A5.49 5.49 0 0 1 2 14.5c0-2.29 1.5-4 3-5.5l5.492-5.313a2 2 0 0 1 3-.019L19 9c1.5 1.5 3 3.2 3 5.5'
      : 'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5';
    heartHtml = '<svg viewBox="0 0 24 24"><path d="' + hp + '" fill="none" stroke="' + (t.heartColor||'rgba(255,255,255,0.3)') + '" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  }
  // Не лайкнуто и нет иконки — ничего не показываем (heartHtml = '')

  item.innerHTML = (
    '<div class="mti-cover">' + coverHtml + '</div>' +
    '<div class="mti-info">' +
      '<div class="mti-col">' +
        '<span class="mti-title">' + esc(t.title || t.music || '') + '</span>' +
        (t.musicName ? '<span class="mti-music">' + esc(t.musicName) + '</span>' : '') +
      '</div>' +
      '<div class="mti-col">' +
        '<span class="mti-char">' + esc(t.character || '') + '</span>' +
        (t.artName ? '<span class="mti-artist">' + esc(t.artName) + '</span>' : '') +
      '</div>' +
    '</div>' +
    '<div class="mti-heart">' + heartHtml + '</div>'
  );

  item.addEventListener('click', function(){
    loadTrack(i); invalidateSideCards(); carouselReset();
    audio.play().then(function(){ setPlayUI(true); }).catch(function(){});
    renderAllTracks();
  });

  // Лайк прямо в меню
  var heartEl = item.querySelector('.mti-heart');
  if (heartEl) {
    heartEl.style.cursor = 'pointer';
    heartEl.addEventListener('click', function(e){
      e.stopPropagation(); // не переключаем трек
      if (liked.has(i)){ liked.delete(i); } else { liked.add(i); }
      // Если это текущий трек — обновляем основную карточку тоже
      if (i === currentIndex){
        heartBtn.classList.toggle('liked', liked.has(i));
        showHeartState(liked.has(i), TRACKS[i]);
      }
      invalidateSideCards();
      renderAllTracks();
    });
  }
  container.appendChild(item);
}
function renderAllTracks(){ panelAll.innerHTML=''; TRACKS.forEach(function(t,i){makeTrackItem(i,panelAll);}); }
function renderCredits(){
  panelCredits.innerHTML='';
  TRACKS.forEach(function(t,i){
    var el=document.createElement('div'); el.className='menu-credit-entry';
    el.innerHTML='<div class="mce-char">'+esc(t.character||('Трек '+(i+1)))+' — '+esc(t.title||'')+'</div>'+
      '<div class="mce-row"><span class="mce-label">Art</span><a class="mce-link" href="'+(t.artUrl||'#')+'" target="_blank">'+esc(t.artName||'—')+'<svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a></div>'+
      '<div class="mce-row" style="margin-top:4px"><span class="mce-label">Music</span><a class="mce-link" href="'+(t.musicUrl||'#')+'" target="_blank">'+esc(t.musicName||'—')+'<svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a></div>';
    panelCredits.appendChild(el);
  });
}
document.getElementById('menuSearch').addEventListener('input',function(){
  var q=this.value.trim().toLowerCase();
  if(!q){showTrackList();renderAllTracks();return;}
  showSearch(); panelSearch.innerHTML=''; var found=false;
  TRACKS.forEach(function(t,i){
    if(((t.title||'')+' '+(t.character||'')+' '+(t.artName||'')+' '+(t.musicName||'')).toLowerCase().indexOf(q)!==-1){makeTrackItem(i,panelSearch);found=true;}
  });
  if(!found) panelSearch.innerHTML='<div class="menu-empty">Ничего не найдено</div>';
});
heartBtn.addEventListener('click',function(){
  invalidateSideCards();
  if (menuOpen) renderAllTracks();
  setTimeout(carouselReset,50);
});