import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const $=s=>document.querySelector(s);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));

/* ---------- sound ---------- */
const snd=(()=>{let ctx,on=true;
 const ensure=()=>{if(!ctx){try{ctx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(ctx&&ctx.state==='suspended')ctx.resume();return ctx};
 const env=(t,d,pk)=>{const g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(pk,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);g.connect(ctx.destination);return g};
 const noise=d=>{const b=ctx.createBuffer(1,Math.max(1,ctx.sampleRate*d|0),ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;const n=ctx.createBufferSource();n.buffer=b;return n};
 const osc=(t,type,f0,f1,d,pk)=>{const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+d);o.connect(env(t,d,pk));o.start(t);o.stop(t+d+.02)};
 const sweep=(d,f0,f1,pk)=>{const t=ctx.currentTime,n=noise(d),f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=.8;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+d*.7);n.connect(f);f.connect(env(t,d,pk));n.start(t)};
 return{unlock:ensure,ctx:()=>ensure(),get on(){return on},toggle(){on=!on;return on},
  click(){if(!on||!ensure())return;const t=ctx.currentTime;osc(t,'sine',520,260,.05,.2)},
  tick(){},
  deal(){if(!on||!ensure())return;sweep(.16,1500,3600,.13)},
  riffle(n=6){if(!on||!ensure())return;const t0=ctx.currentTime;for(let i=0;i<n;i++){const t=t0+i*.085,nz=noise(.035),f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=2300+Math.random()*1800;f.Q.value=1.3;nz.connect(f);f.connect(env(t,.035,.14));nz.start(t)}},
  engine(d=2){if(!on||!ensure())return;const t=ctx.currentTime,f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='lowpass';f.frequency.value=380;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.032,t+.5);g.gain.setValueAtTime(.032,t+d*.65);g.gain.exponentialRampToValueAtTime(.0001,t+d);
   [['sine',1],['triangle',2]].forEach(([ty,m])=>{const o=ctx.createOscillator();o.type=ty;o.frequency.setValueAtTime(52*m,t);o.frequency.linearRampToValueAtTime(88*m,t+d*.5);o.frequency.linearRampToValueAtTime(64*m,t+d);o.connect(f);o.start(t);o.stop(t+d+.05)});f.connect(g);g.connect(ctx.destination)},
  honk(){if(!on||!ensure())return;[0,.2].forEach((dl,i)=>{const t=ctx.currentTime+dl,f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='lowpass';f.frequency.value=1500;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.075,t+.02);g.gain.setValueAtTime(.075,t+.14);g.gain.exponentialRampToValueAtTime(.0001,t+.2);
    [392,494].forEach(fr=>{const o=ctx.createOscillator();o.type='triangle';o.frequency.value=fr;o.connect(f);o.start(t);o.stop(t+.22)});f.connect(g);g.connect(ctx.destination)})},
  flip(){if(!on||!ensure())return;sweep(.5,600,2600,.2);osc(ctx.currentTime+.05,'sine',420,200,.2,.05)}}})();
document.addEventListener('pointerdown',()=>snd.unlock(),{capture:true});
document.addEventListener('click',e=>{if(e.target.closest('.btn,.chip2:not(.snd),#x'))snd.click()});
$('#snd').onclick=()=>{const o=snd.toggle();$('#snd').textContent=o?'Sound on':'Sound off';if(o)snd.click()};

/* ---------- clicking sounds only ---------- */
let lastClick=0;
document.addEventListener('pointerdown',e=>{snd.unlock();if(e.target.closest('button,a,.it,.dk')&&!e.target.closest('#snd')){const n=performance.now();if(n-lastClick>90){lastClick=n;snd.click()}}},{capture:true});
$('#snd').onclick=()=>{const o=snd.toggle();$('#snd').textContent=o?'Sound on':'Sound off';if(o)snd.click()};


/* ---------- soft background music: original Ghibli-style pieces, played by the browser ---------- */
const midi=m=>440*Math.pow(2,(m-69)/12);
const TRACKS=[
 {name:'Soft Morning',bpm:78,spb:6,arp:[2,4],chords:[[45,[57,60,64]],[41,[53,57,60]],[48,[55,60,64]],[43,[55,59,62]],[45,[57,60,64]],[41,[53,57,60]],[43,[55,59,62]],[48,[55,60,64]]],
  mel:[[[0,76,3],[3,72,1],[4,74,2]],[[0,72,2],[2,69,2],[4,72,2]],[[0,76,3],[3,79,1],[4,76,2]],[[0,74,3],[3,71,1],[4,67,2]],[[0,72,2],[2,76,2],[4,81,2]],[[0,79,3],[3,77,1],[4,76,2]],[[0,74,2],[2,71,2],[4,74,2]],[[0,72,6]]]},
 {name:'Windy Hill',bpm:88,spb:8,arp:[2,4,6],chords:[[48,[55,60,64]],[43,[55,59,62]],[45,[57,60,64]],[41,[53,57,60]],[48,[55,60,64]],[43,[55,59,62]],[45,[57,60,64]],[41,[53,57,60]]],
  mel:[[[0,79,2],[2,76,2],[4,72,2],[6,76,2]],[[0,74,2],[2,79,2],[4,71,2],[6,74,2]],[[0,72,3],[3,76,1],[4,81,2],[6,79,2]],[[0,77,2],[2,72,2],[4,77,4]],[[0,76,2],[2,79,2],[4,84,2],[6,79,2]],[[0,79,2],[2,74,2],[4,71,2],[6,67,2]],[[0,72,2],[2,76,2],[4,81,2],[6,76,2]],[[0,77,2],[2,76,2],[4,72,4]]]},
 {name:'Evening Tea',bpm:66,spb:6,arp:[2,4],chords:[[41,[57,60,65]],[38,[57,62,65]],[46,[58,62,65]],[48,[55,60,64]],[41,[57,60,65]],[38,[57,62,65]],[46,[58,62,65]],[41,[57,60,65]]],
  mel:[[[0,72,3],[3,77,1],[4,76,2]],[[0,74,2],[2,77,2],[4,81,2]],[[0,79,3],[3,77,1],[4,74,2]],[[0,72,2],[2,76,2],[4,79,2]],[[0,77,3],[3,81,1],[4,79,2]],[[0,77,2],[2,74,2],[4,69,2]],[[0,70,2],[2,74,2],[4,77,2]],[[0,72,6]]]},
 {name:'Starlit Walk',bpm:72,spb:8,arp:[2,4,6],chords:[[38,[57,62,65]],[46,[58,62,65]],[41,[57,60,65]],[48,[55,60,64]],[38,[57,62,65]],[46,[58,62,65]],[41,[57,60,65]],[48,[55,60,64]]],
  mel:[[[0,74,3],[3,77,1],[4,81,4]],[[0,79,2],[2,77,2],[4,74,4]],[[0,72,2],[2,77,2],[4,81,2],[6,84,2]],[[0,79,4],[4,76,4]],[[0,77,2],[2,81,2],[4,86,2],[6,84,2]],[[0,82,2],[2,79,2],[4,77,4]],[[0,81,2],[2,77,2],[4,72,2],[6,77,2]],[[0,76,3],[3,72,1],[4,74,4]]]}];
TRACKS.forEach(t=>t.len=8*t.spb*60/t.bpm/2);
const music=(()=>{
  let ctx,bus,timer,step=0,next=0,on=false,level=.3,t0=0,idx=0,loops=0,rep=false;const subs=[];
  const pref=()=>localStorage.getItem('fz-music')!=='0';
  function chain(){
    if(bus)return;bus=ctx.createGain();bus.gain.value=0;
    const warm=ctx.createBiquadFilter();warm.type='lowpass';warm.frequency.value=2600;warm.Q.value=.3;
    const dly=ctx.createDelay(1);dly.delayTime.value=.42;const fb=ctx.createGain();fb.gain.value=.34;
    const dl=ctx.createBiquadFilter();dl.type='lowpass';dl.frequency.value=1800;const wet=ctx.createGain();wet.gain.value=.34;
    bus.connect(warm);warm.connect(ctx.destination);bus.connect(dly);dly.connect(dl);dl.connect(fb);fb.connect(dly);dl.connect(wet);wet.connect(warm)}
  const env=(t,d,v,a)=>{const g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+d);g.connect(bus);return g};
  const osc=(t,type,f,d,v,a=.01)=>{const o=ctx.createOscillator();o.type=type;o.frequency.value=f;o.connect(env(t,d,v,a));o.start(t);o.stop(t+d+.05)};
  const piano=(t,m,d,v)=>{const f=midi(m);osc(t,'sine',f,d,v,.006);osc(t,'sine',f*2,d*.5,v*.3,.004);osc(t,'triangle',f*3,d*.25,v*.08,.003)};
  function play(st,t){
    const S=TRACKS[idx],bar=Math.floor(st/S.spb)%8,k=st%S.spb,[bass,ch]=S.chords[bar],sd=60/S.bpm/2;
    if(k===0){osc(t,'sine',midi(bass-12),sd*(S.spb-1),.09,.02);ch.forEach(m=>osc(t,'triangle',midi(m-12),sd*S.spb,.012,.9));piano(t,ch[0],1.6,.022)}
    const ai=S.arp.indexOf(k);if(ai>=0)piano(t,ch[(ai+1)%3],1.4,.03);
    S.mel[bar].forEach(([ms,m,len])=>{if(ms===k)piano(t,m,len*sd+.9,.05)})}
  function pump(){const S=TRACKS[idx],sd=60/S.bpm/2,total=8*S.spb;
    while(next<ctx.currentTime+.4){play(step,next);next+=sd;step++;if(step>=total){step=0;loops++;if(loops>=2){loops=0;if(!rep)idx=(idx+1)%TRACKS.length;t0=performance.now();fire()}}}}
  function begin(){if(!(ctx=snd.ctx()))return;chain();clearInterval(timer);on=true;step=0;loops=0;next=ctx.currentTime+.1;t0=performance.now();
    bus.gain.cancelScheduledValues(ctx.currentTime);bus.gain.setValueAtTime(bus.gain.value,ctx.currentTime);bus.gain.linearRampToValueAtTime(level,ctx.currentTime+3);timer=setInterval(pump,60);pump();fire()}
  function stop(){if(!ctx)return;clearInterval(timer);timer=null;on=false;bus.gain.cancelScheduledValues(ctx.currentTime);bus.gain.setValueAtTime(bus.gain.value,ctx.currentTime);bus.gain.linearRampToValueAtTime(0,ctx.currentTime+.7);fire()}
  const fire=()=>subs.forEach(f=>f(on,idx));
  function go(d){idx=(idx+d+TRACKS.length)%TRACKS.length;step=0;loops=0;t0=performance.now();if(on&&ctx)next=ctx.currentTime+.15;fire()}
  document.addEventListener('visibilitychange',()=>{if(!ctx)return;document.hidden?ctx.suspend():ctx.resume()});
  let gesture=false;
  return{get on(){return on},get idx(){return idx},get rep(){return rep},setRep(v){rep=v},select(i){gesture=true;go(i-idx);if(!on){begin();localStorage.setItem('fz-music','1')}},sub:f=>subs.push(f),pos:()=>on?((performance.now()-t0)/1000)%TRACKS[idx].len:0,len:()=>TRACKS[idx].len,
    toggle(){gesture=true;if(on){stop();localStorage.setItem('fz-music','0')}else{begin();localStorage.setItem('fz-music','1')}},
    next(){gesture=true;go(1);if(!on){begin();localStorage.setItem('fz-music','1')}},prev(){gesture=true;go(-1);if(!on){begin();localStorage.setItem('fz-music','1')}},
    firstGesture(){if(gesture)return;gesture=true;if(pref())begin()}}})();
document.addEventListener('pointerdown',()=>music.firstGesture(),{capture:true,once:true});
/* player, in the style of a music-app card: title above, progress line, then the controls */
const player=document.createElement('div');player.id='player';
const ic=(d,w=20)=>`<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const HEART='<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.600-7 10-7 10z"/>';
player.innerHTML=`<div class="pl-top"><div class="pl-tt"><small>Studio Ghibli · Theme</small><b id="pl-t">Soft Morning</b></div><button class="pl-heart" aria-label="Add to favourites">${ic(HEART,20)}</button></div>
<div class="pl-bar"><i></i></div>
<div class="pl-c"><button class="pl-s pl-list" aria-label="Choose a song">${ic('<path d="M4 6h10M4 11h10M4 16h6"/><path d="M18 18V7l3 1" /><circle cx="16.200" cy="18" r="1.800" fill="currentColor"/>',22)}</button>
<button class="pl-s pl-prev" aria-label="Previous song">${ic('<path d="M7 5v14" stroke-width="2.6"/><path d="M19 5L9 12l10 7z" fill="currentColor"/>',22)}</button>
<button class="pl-b" aria-label="Play or pause"></button>
<button class="pl-s pl-next" aria-label="Next song">${ic('<path d="M17 5v14" stroke-width="2.6"/><path d="M5 5l10 7-10 7z" fill="currentColor"/>',22)}</button>
<button class="pl-s pl-rep" aria-label="Repeat this song">${ic('<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 014-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 01-4 4H4"/>',22)}</button></div>
<div id="plist"></div>`;
document.body.append(player);
const plB=player.querySelector('.pl-b'),plI=player.querySelector('.pl-bar i'),plT=player.querySelector('#pl-t'),plH=player.querySelector('.pl-heart'),plL=player.querySelector('#plist');
const favs=()=>{try{return JSON.parse(localStorage.getItem('fz-fav')||'[]')}catch(e){return[]}};
const plUp=(on)=>{plB.innerHTML=on?'<svg viewBox="0 0 24 24" width="22" height="22"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="#fff"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="#fff"/></svg>':'<svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5l11 7-11 7z" fill="#fff"/></svg>';
  plT.textContent=TRACKS[music.idx].name;plH.classList.toggle('on',favs().includes(music.idx));document.body.classList.toggle('mus-on',on);
  plL.innerHTML=TRACKS.map((t,i)=>`<button data-i="${i}" class="${i===music.idx?'cur':''}">${t.name}</button>`).join('');
  plL.querySelectorAll('button').forEach(b=>b.onclick=()=>{music.select(+b.dataset.i);plL.classList.remove('on')})};
music.sub(plUp);plUp(false);plB.onclick=()=>music.toggle();
player.querySelector('.pl-prev').onclick=()=>music.prev();player.querySelector('.pl-next').onclick=()=>music.next();
player.querySelector('.pl-list').onclick=e=>{e.stopPropagation();plL.classList.toggle('on')};
player.querySelector('.pl-rep').onclick=e=>{music.setRep(!music.rep);e.currentTarget.classList.toggle('on',music.rep)};
plH.onclick=()=>{const f=favs(),i=music.idx,k=f.indexOf(i);k>=0?f.splice(k,1):f.push(i);try{localStorage.setItem('fz-fav',JSON.stringify(f))}catch(e){}plH.classList.toggle('on',k<0)};
document.addEventListener('click',e=>{if(!e.target.closest('#player'))plL.classList.remove('on')});
setInterval(()=>{plI.style.width=(music.pos()/music.len()*100)+'%'},300);

/* ---------- the desktop: folders inside folders ---------- */
const DOC=(n,panel,ext='pages')=>({n,t:'doc',panel,ext});
const LINK=(n,href)=>({n,t:'link',href});
const MILES=[
 {l:'2017',t:'Became a business lecturer',d:'Began my career teaching business to adult learners.'},
 {l:'2019',t:'Started teaching IGCSE',d:'Began teaching IGCSE Accounting and Business Studies, with Economics alongside.'},
 {l:'2021',t:'Worked as a data analyst',d:'Worked at a bank as a data analyst, applying my data analytics training to real business problems.'},
 {l:'2022',t:'Appointed as HOD',d:'Appointed Head of Department (HOD) and became fully focused on IGCSE.'},
 {l:'2023',t:'Started trading',d:'Began trading the markets with a clear plan: risk first, and a journal for every trade.'},
 {l:'Today',t:'Started vibe coding',d:'Teaching and tuition, trading and vibe coding, all side by side.'}];
const yearDoc=m=>({n:m.l==='Today'?'2025 – Today':m.l+' · '+m.t,t:'doc',ext:'txt',html:`<span class="k">Experience</span><h2>${m.l}</h2><h3>${m.t}</h3><p>${m.d}</p>`});
const PROJ=[
 {n:'Learn Islam 101',d:'A guide to wudu, prayer, short surahs, duas and zikir for new and returning Muslims, in English and Malay.',tags:['TypeScript','Live'],live:'https://fatinfaziana.github.io/Learn-Islam-101/',src:'https://github.com/fatinfaziana/Learn-Islam-101'},
 {n:'mark4you',d:'A marking helper for IGCSE teachers, with AI-assisted routes that keep the API key safely on the server.',tags:['TypeScript','In development'],src:'https://github.com/fatinfaziana'},
 {n:'TradeDesk',d:'A scanner and chart desk for crypto, forex, gold and stocks. It lists setups as BUY or SELL with a grade, shows entry, stop loss and take profit, flags news cautions, and links to charts and alerts.',tags:['Node.js','Mac app'],note:'Decision support only, not financial advice.',img:'assets/tradedesk.jpg',src:'https://github.com/fatinfaziana'},
 {n:'Asterisk Academy',d:'The website for my IGCSE tuition: an availability calendar, package selection and an instant invoice for parents.',tags:['Web','Live'],live:'https://my-first-project-y3iv.vercel.app/'},
{n:'GitHub',d:'Every project, in one place.',tags:['All my code'],live:'https://github.com/fatinfaziana',liveName:'Visit profile'}];
const projDoc=p=>({n:'README',t:'doc',ext:'md',html:`<span class="k">Projects</span><h2>${p.n}</h2><p class="lead">${p.d}</p><div class="tagrow">${p.tags.map(x=>`<span>${x}</span>`).join('')}</div>${p.note?`<p class="note">${p.note}</p>`:''}<div class="btns">${p.live?`<a class="btn p" href="${p.live}" target="_blank" rel="noopener">${p.liveName||'Open live site'} ↗</a>`:''}${p.src?`<a class="btn" href="${p.src}" target="_blank" rel="noopener">Source code ↗</a>`:''}</div>`});
const FS={n:'Fatin Faziana',t:'folder',kids:[
 {n:'About myself',t:'folder',kids:[DOC('Who I am','p-about'),DOC('Get in touch','p-contact')]},
 {n:'Experience',t:'folder',kids:[DOC('Timeline','p-exp','key'),{n:'Early years',t:'folder',kids:[yearDoc(MILES[0]),yearDoc(MILES[1])]},{n:'Leading years',t:'folder',kids:MILES.slice(2).map(yearDoc)}]},
 {n:'Contributions',t:'folder',kids:[DOC('From struggling to A','p-impact'),DOC('How I do it','p-how'),DOC('Beyond the classroom','p-events')]},
 {n:'Beyond teaching',t:'folder',kids:[{n:'Trading',t:'folder',kids:[DOC('My rules','p-trading')]},{n:'Vibe coding',t:'folder',kids:[DOC('Overview','p-vibe')]}]},
 {n:'Projects',t:'folder',kids:PROJ.map(p=>({n:p.n,t:'folder',kids:[projDoc(p),...(p.live?[LINK(p.liveName||'Open live site',p.live)]:[]),...(p.src?[LINK('Source code',p.src)]:[])]}))}

 ,{n:'Achievements',t:'folder',kids:[LINK('Dean\'s List awardee','#'),LINK('2nd place, Data Analytics','#')]}
]};
(function link(n,p){n.parent=p;(n.kids||[]).forEach(k=>link(k,n))})(FS,null);
const PAL=[{b:'#e8a3a0',f:'#f7d5d0'},{b:'#d8b98a',f:'#f0dfc2'},{b:'#a3b58f',f:'#d4dfc6'},{b:'#9db7c8',f:'#d0e0ea'},{b:'#c2abd0',f:'#e3d6ec'},{b:'#d9a7b8',f:'#f1d4de'}];
(function paint(n,p){n.pal=p;(n.kids||[]).forEach(k=>paint(k,p))})(FS,null);FS.kids.forEach((k,i)=>(function paint(n){n.pal=PAL[i];(n.kids||[]).forEach(paint)})(k));
const pathOf=n=>{const a=[];for(;n;n=n.parent)a.unshift(n.n);return a};

/* ---------- Finder-style windows (CSS 3D, they tilt with the mouse) ---------- */
let zTop=20,wins=[],wmx=0,wmy=0;
const mobile=()=>innerWidth<700;
function makeWin(kind,{w=720,h=480}={}){
  const n=wins.length,el=document.createElement('div');el.className='win '+kind;
  const W=Math.min(w,innerWidth-16),H=Math.min(h,innerHeight-170);
  const x=mobile()?8:Math.max(8,Math.min(Math.round(Math.min(innerWidth*.16,260)+n*34),innerWidth-W-12)),y=mobile()?50:78+n*30;
  el.style.cssText=`left:${x}px;top:${y}px;width:${W}px;height:${H}px;--tz:${n*14}px;z-index:${++zTop}`;
  $('#wins').append(el);wins.push(el);focusWin(el);
  el.addEventListener('pointerdown',()=>focusWin(el),true);return el}
function focusWin(el){el.style.zIndex=++zTop;wins.forEach(w=>w.classList.toggle('act',w===el))}
function closeWin(el){if(!el.isConnected)return;el.classList.add('out');wins=wins.filter(x=>x!==el);setTimeout(()=>{el.remove();if(el._onclose)el._onclose()},200);const t=wins[wins.length-1];if(t)focusWin(t)}
function chrome(el,title,extra=''){
  const tb=el.querySelector('.tb');
  tb.querySelector('.r').onclick=()=>{snd.click();closeWin(el)};
  tb.querySelector('.y').onclick=()=>closeWin(el);
  tb.querySelector('.g').onclick=()=>{el.classList.toggle('big')};
  tb.addEventListener('pointerdown',e=>{if(e.target.closest('button,.lights')||mobile())return;const r=el.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;
    const mv=ev=>{el.style.left=clamp(ev.clientX-dx,-r.width+120,innerWidth-80)+'px';el.style.top=clamp(ev.clientY-dy,30,innerHeight-60)+'px'};
    const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up)};addEventListener('pointermove',mv);addEventListener('pointerup',up)});
}
const TBAR=t=>`<div class="tb"><div class="lights"><button class="r" aria-label="Close"></button><button class="y" aria-label="Minimise"></button><button class="g" aria-label="Zoom"></button></div><div class="tt">${t}</div></div>`;
const iconHTML=k=>k.t==='folder'?`<span class="fi" style="--a:${k.pal.b};--b:${k.pal.f}"><i class="fe"></i></span>`:k.t==='link'?'<span class="li">↗</span>':`<span class="di"><u>${(k.ext||'pages').toUpperCase()}</u></span>`;

function openFinder(node){
  snd.click();const el=makeWin('finder');const w={el,stack:[node],i:0};
  el.innerHTML=`<div class="wi">${TBAR('')}<div class="nv"><button class="bk" aria-label="Back">‹</button><button class="fw" aria-label="Forward">›</button><span class="nt"></span></div><div class="wb"><aside class="sd"></aside><main class="mn"><div class="grid"></div></main></div><div class="pb"></div></div>`;
  chrome(el);
  const render=()=>{const cur=w.stack[w.i];el.querySelector('.tt').textContent=cur.n;el.querySelector('.nt').textContent=cur.n;
    el.querySelector('.bk').disabled=w.i===0;el.querySelector('.fw').disabled=w.i>=w.stack.length-1;
    el.querySelector('.sd').innerHTML='<h6>Favourites</h6>'+FS.kids.map((k,j)=>`<button data-j="${j}"><span class="mini" style="background:${k.pal.b}"></span>${k.n}</button>`).join('');
    el.querySelectorAll('.sd button').forEach(b=>b.onclick=()=>{snd.tick();w.stack=[FS,FS.kids[+b.dataset.j]];w.i=1;render()});
    el.querySelector('.grid').innerHTML=(cur.kids||[]).map((k,j)=>`<button class="it" data-j="${j}">${iconHTML(k)}<span>${k.n}</span></button>`).join('');
    el.querySelectorAll('.it').forEach(b=>{b.onclick=()=>{const k=cur.kids[+b.dataset.j];snd.click();
      if(k.t==='folder'){w.stack=w.stack.slice(0,w.i+1);w.stack.push(k);w.i++;render()}else if(k.t==='link')window.open(k.href,'_blank','noopener');else openDoc(k)};
      b.onpointerenter=()=>snd.tick()});
    el.querySelector('.pb').innerHTML=pathOf(cur).map(s=>`<span>${s}</span>`).join('<i>›</i>')};
  el.querySelector('.bk').onclick=()=>{if(w.i>0){w.i--;snd.tick();render()}};
  el.querySelector('.fw').onclick=()=>{if(w.i<w.stack.length-1){w.i++;snd.tick();render()}};
  render();return el}
function openDoc(node){
  const el=makeWin('doc',{w:780,h:560});const title=node.n+(node.ext?'.'+node.ext:'');
  el.innerHTML=`<div class="wi">${TBAR(title)}<div class="dc"><div class="dcin"></div></div></div>`;chrome(el);
  const inner=el.querySelector('.dcin');
  if(node.panel){const t=document.getElementById(node.panel);inner.append(t.content.cloneNode(true));el.style.setProperty('--c',t.dataset.c||'#ef95b0')}
  else{inner.innerHTML=node.html;el.style.setProperty('--c','#ef95b0')}
  if(node.panel==='p-exp'){initJourney();el._onclose=stopJourney}
  return el}


/* ---------- one click, straight to the info ---------- */
const tplEl=id=>document.getElementById(id).content.cloneNode(true);
const PASS=`<div class="pass" aria-label="Passport photo of Fatin"></div>`;
function infoInto(inner,i){
  const add=id=>{inner.append(tplEl(id));const hr=document.createElement('hr');hr.className='sep';inner.append(hr)};
  if(i===0){inner.insertAdjacentHTML('beforeend',`<div class="idc">${PASS}<div><span class="k">01 · About myself</span><h2>Fatin Faziana</h2><p class="lead">Teacher · Trader · Creator</p></div></div>`);
    const t=tplEl('p-about');t.querySelector('.k')?.remove();t.querySelector('h2')?.remove();inner.append(t);const hr=document.createElement('hr');hr.className='sep';inner.append(hr);inner.append(tplEl('p-contact'))}
  else if(i===1){inner.append(tplEl('p-exp'))}
  else if(i===2){add('p-impact');inner.append(tplEl('p-how'))}
  else if(i===3){add('p-trading');inner.append(tplEl('p-vibe'))}
  else if(i===4){inner.insertAdjacentHTML('beforeend',`<span class="k">Projects</span><h2>Things I've built.</h2><div class="pgrid">${PROJ.map(p=>`<div class="pc">${p.img?`<a href="${p.live||p.src}" target="_blank" rel="noopener"><img class="pimg" src="${p.img}" alt="${p.n} screenshot" loading="lazy"></a>`:''}<h4>${p.n}</h4><div class="tagrow">${p.tags.map(x=>`<span>${x}</span>`).join('')}</div><p>${p.d}</p>${p.note?`<p class="note">${p.note}</p>`:''}<div class="btns">${p.live?`<a class="btn p" href="${p.live}" target="_blank" rel="noopener">${p.liveName||'Open live site'} ↗</a>`:''}${p.src?`<a class="btn" href="${p.src}" target="_blank" rel="noopener">Source code ↗</a>`:''}</div></div>`).join('')}</div>`)}
  if(i===5)inner.insertAdjacentHTML('beforeend',`<span class="k">Achievements</span><h2>Things I'm proud of.</h2><div class="pgrid"><div class="pc"><h4>Dean's List awardee</h4><div class="tagrow"><span>Academic</span></div><p>Recognised on the Dean's List for academic performance.</p></div><div class="pc"><h4>2nd place, Data Analytics</h4><div class="tagrow"><span>Competition</span></div><p>Won second place in a Data Analytics competition, building a solution that filters unwanted comments: spam, nudity and scam.</p></div></div>`);
  const last=inner.lastElementChild;if(last&&last.classList.contains('sep'))last.remove()}
function openInfo(node){
  if(node===FS||!node)node=FS.kids[0];const i=FS.kids.indexOf(node);snd.click();
  const ex=wins.find(w=>w._i===i);if(ex){focusWin(ex);return ex}
  const el=makeWin('doc',{w:i===4?860:780,h:580});el._i=i;
  el.innerHTML=`<div class="wi">${TBAR(node.n)}<div class="dc"><div class="dcin"></div></div></div>`;chrome(el);
  infoInto(el.querySelector('.dcin'),i);
  if(i===1){initJourney();el._onclose=stopJourney}
  return el}

/* ---------- Experience: a winding line that travels left to right, point to point ---------- */
const JP=[[70,160],[242,64],[414,176],[586,64],[758,176],[930,100]];
let jI=0,jT=null,jAuto=true,jRaf=0,jLen=0,jL=[],jTot=0;
function jgo(i,instant){
  jI=clamp(i,0,MILES.length-1);const m=MILES[jI],svg=$('#jsvg');if(!svg)return;
  const prog=svg.querySelector('.jprog'),mov=svg.querySelector('.jmov'),path=svg.querySelector('.jbase');
  const from=jLen,to=jL[jI],t0=performance.now(),dur=instant?1:Math.max(700,Math.abs(to-from)*3.2);
  cancelAnimationFrame(jRaf);
  const step=now=>{const k=clamp((now-t0)/dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;jLen=from+(to-from)*e;
    prog.style.strokeDashoffset=jTot-jLen;const pt=path.getPointAtLength(jLen);mov.setAttribute('cx',pt.x);mov.setAttribute('cy',pt.y);
    svg.querySelectorAll('.jp').forEach((g,j)=>{g.classList.toggle('seen',jL[j]<=jLen+1);g.classList.toggle('on',j===jI&&k>.85)});
    if(k<1)jRaf=requestAnimationFrame(step)};
  jRaf=requestAnimationFrame(step);
  const c=$('#jcard');c.classList.remove('in');void c.offsetWidth;$('#jyr').textContent=m.l;$('#jt').textContent=m.t;$('#jd').textContent=m.d;c.classList.add('in');
  $('#jprev').disabled=jI===0;$('#jnext').textContent=jI===MILES.length-1?'Back to start ↺':'Next ›';if(!instant&&i>0)snd.tick&&0;
}
function jplan(){clearTimeout(jT);if(!jAuto)return;jT=setTimeout(()=>{if(!$('#jsvg'))return;if(jI<MILES.length-1){jgo(jI+1);jplan()}},5200)}
function initJourney(){
  jAuto=true;jI=0;jLen=0;const svg=$('#jsvg');if(!svg)return;
  const n=JP.length;let d=`M10 ${JP[0][1]+10} C30 ${JP[0][1]+8} 50 ${JP[0][1]} ${JP[0][0]} ${JP[0][1]}`;
  for(let i=0;i<n-1;i++){const p0=JP[i-1]||JP[i],p1=JP[i],p2=JP[i+1],p3=JP[i+2]||p2;
    d+=` C${p1[0]+(p2[0]-p0[0])/6} ${p1[1]+(p2[1]-p0[1])/6} ${p2[0]-(p3[0]-p1[0])/6} ${p2[1]-(p3[1]-p1[1])/6} ${p2[0]} ${p2[1]}`}
  d+=` C${JP[n-1][0]+20} ${JP[n-1][1]-4} 975 ${JP[n-1][1]-14} 990 ${JP[n-1][1]-30}`;
  svg.innerHTML=`<path class="jbase" d="${d}"/><path class="jprog" d="${d}"/>`+JP.slice(0,MILES.length).map((p,j)=>`<g class="jp" data-j="${j}" tabindex="0" role="button" aria-label="${MILES[j].l}: ${MILES[j].t}"><circle class="jhit" cx="${p[0]}" cy="${p[1]}" r="30"/><circle class="jdot" cx="${p[0]}" cy="${p[1]}" r="10"/><text x="${p[0]}" y="${p[1]+(p[1]<110?-24:42)}" text-anchor="middle">${MILES[j].l}</text></g>`).join('')+`<circle class="jmov" r="9" cx="10" cy="${JP[0][1]+10}"/>`;
  const path=svg.querySelector('.jbase');jTot=path.getTotalLength();svg.querySelector('.jprog').style.strokeDasharray=jTot;svg.querySelector('.jprog').style.strokeDashoffset=jTot;
  jL=JP.map(p=>{let best=0,bd=1e9;for(let l=0;l<=jTot;l+=3){const q=path.getPointAtLength(l),dd=(q.x-p[0])**2+(q.y-p[1])**2;if(dd<bd){bd=dd;best=l}}return best});
  const stop=()=>{jAuto=false;clearTimeout(jT)};
  svg.querySelectorAll('.jp').forEach(g=>{const go=()=>{stop();jgo(+g.dataset.j)};g.onclick=go;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')go()}});
  $('#jprev').onclick=()=>{stop();jgo(jI-1)};$('#jnext').onclick=()=>{stop();jgo(jI>=MILES.length-1?0:jI+1)};
  setTimeout(()=>jgo(0),300);jplan();
}
function stopJourney(){clearTimeout(jT);jAuto=false;cancelAnimationFrame(jRaf)}

/* ---------- menu bar, dock ---------- */
function clock(){const d=new Date();const ct=$('#cwt');if(ct){ct.textContent=d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});$('#cwd').textContent=d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}$('#clock').textContent=new Date().toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).replace(',','')}
clock();setInterval(clock,20000);
function openMenu(){const m=$('#menu'),b=$('#gomenu').getBoundingClientRect();
  if(m.classList.contains('on')){m.classList.remove('on');return}
  m.innerHTML=FS.kids.map((k,j)=>`<button data-j="${j}">${k.n}</button>`).join('')+'<hr><button data-j="home">Fatin Faziana</button>';
  m.style.left=b.left+'px';m.classList.add('on');
  m.querySelectorAll('button').forEach(x=>x.onclick=()=>{m.classList.remove('on');openInfo(x.dataset.j==='home'?FS:FS.kids[+x.dataset.j])})}
$('#gomenu').onclick=e=>{e.stopPropagation();openMenu()};
addEventListener('click',e=>{if(!e.target.closest('#menu'))$('#menu').classList.remove('on')});
function openFinderAtOld(node){const el=openFinder(FS);if(node!==FS){const w=el;/* navigate */const b=[...el.querySelectorAll('.sd button')];const j=FS.kids.indexOf(node);if(b[j])b[j].click()}}
const DOCK=[
 {n:'Finder',c:'linear-gradient(#cfdee8,#9db7c8)',g:'<path d="M9 7v12M23 7v12M7 21c4 4 14 4 18 0" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>',f:()=>openInfo(FS.kids[0])},
 {n:'About me',c:'linear-gradient(#f0dfc2,#d8b98a)',g:'<circle cx="16" cy="12" r="5" fill="#4a3b35"/><path d="M6 26c1-6 5-8 10-8s9 2 10 8z" fill="#4a3b35"/>',f:()=>openInfo(FS.kids[0])},
 {n:'Projects',c:'linear-gradient(#f7d5d0,#e8a3a0)',g:'<path d="M16 5l9 5v11l-9 5-9-5V10z" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/><path d="M7 10l9 5 9-5M16 15v11" stroke="#fff" stroke-width="2.2" fill="none"/>',f:()=>openInfo(FS.kids[4])},
 {n:'Mail',c:'linear-gradient(#dde8ef,#a9c3d3)',g:'<rect x="5" y="8" width="22" height="16" rx="3" fill="#fff"/><path d="M6 10l10 8 10-8" stroke="#9db7c8" stroke-width="2" fill="none"/>',f:()=>location.href='mailto:fatinfazianalearn@gmail.com'},
 {n:'Asterisk Academy',c:'linear-gradient(#e3d6ec,#c2abd0)',g:'<path d="M16 6v20M7.3 11l17.4 10M7.3 21l17.4-10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',f:()=>window.open('https://my-first-project-y3iv.vercel.app/','_blank','noopener')},
 {n:'Music',c:'linear-gradient(#f7c6c1,#e8a3a0)',g:'<path d="M12 24V9l12-3v15" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="24" r="3" fill="#fff"/><circle cx="21.5" cy="21" r="3" fill="#fff"/>',f:()=>music.toggle()},
 {n:'Shah Alam',c:'linear-gradient(#d4dfc6,#a3b58f)',g:'<path d="M16 4c-5 0-8 3.600-8 8 0 6 8 15 8 15s8-9 8-15c0-4.400-3-8-8-8z" fill="#fff"/><circle cx="16" cy="12" r="3.200" fill="#a3b58f"/>',f:()=>window.open('https://www.google.com/maps/search/?api=1&query=Shah+Alam,+Selangor','_blank','noopener')},
 {n:'GitHub',c:'linear-gradient(#c4b5a8,#8f8076)',g:'<path d="M16 6a10 10 0 00-3 19.5c.5 0 .7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 .9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.7-1.3-2.2-.3-4.600-1.100-4.600-5 0-1.100.4-2 1-2.700-.1-.3-.4-1.300.1-2.700 0 0 .8-.3 2.800 1a9.600 9.600 0 015 0c1.900-1.300 2.800-1 2.800-1 .5 1.400.2 2.400.1 2.700.7.700 1 1.600 1 2.700 0 3.900-2.400 4.700-4.600 5 .4.300.7.900.7 1.800v2.700c0 .3.2.6.7.5A10 10 0 0016 6z" fill="#fff"/>',f:()=>window.open('https://github.com/fatinfaziana','_blank','noopener')}];
$('#dock').innerHTML=DOCK.map((d,i)=>`<button class="dk" data-i="${i}" aria-label="${d.n}"><span class="dt">${d.n}</span><span class="dic" style="background:${d.c}"><svg viewBox="0 0 32 32" width="30" height="30">${d.g}</svg></span></button>`).join('');
document.querySelectorAll('#dock .dk').forEach(b=>{b.onclick=()=>{snd.click();DOCK[+b.dataset.i].f()};b.onpointerenter=()=>snd.tick()});

/* ---------- the 3D desktop: photo wallpaper on the right, folders on the left ---------- */
const FOV=30,CAMZ=16,FW=1.5,FH=1.12;
let renderer,scene,camera,wall,wallMat,folders=[],raycaster,hoverF=null,GL=false,t0=performance.now();
const mouse=new THREE.Vector2(9,9);let px=0,py=0;
const vis=z=>{const h=2*(CAMZ-z)*Math.tan(THREE.MathUtils.degToRad(FOV/2));return{h,w:h*camera.aspect}};
function ctex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
const SUB=['2 pages','6 milestones','3 pages','2 topics','5 projects','2 awards'];
const mix=(a,b,t)=>'#'+[1,3,5].map(k=>Math.round(parseInt(a.substr(k,2),16)*(1-t)+parseInt(b.substr(k,2),16)*t).toString(16).padStart(2,'0')).join('');
function makeFolder(node,i){
  const g=new THREE.Group(),m=(c,r=.6)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:.02}),P=node.pal;
  const deep=mix(P.b,'#ffffff',.05),light=mix(P.f,'#ffffff',.3);
  // back panel with the slanted tab
  const sh=new THREE.Shape(),x0=-FW/2,x1=FW/2,y0=-FH/2,y1=FH/2-.1,r=.14;
  sh.moveTo(x0+r,y0);sh.lineTo(x1-r,y0);sh.quadraticCurveTo(x1,y0,x1,y0+r);sh.lineTo(x1,y1-r);sh.quadraticCurveTo(x1,y1,x1-r,y1);
  sh.lineTo(x0+.78,y1);sh.lineTo(x0+.6,y1+.15);sh.lineTo(x0+r,y1+.15);sh.quadraticCurveTo(x0,y1+.15,x0,y1+.15-r);sh.lineTo(x0,y0+r);sh.quadraticCurveTo(x0,y0,x0+r,y0);
  const back=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.06,bevelEnabled:true,bevelSize:.025,bevelThickness:.02,bevelSegments:3}),m(deep,.65));back.position.z=-.12;g.add(back);
  // papers peeking out, they rise on hover
  const papers=new THREE.Group();papers.position.z=.0;g.add(papers);
  const pt=ctex(256,190,(c,w,h)=>{c.fillStyle='#fff';c.beginPath();c.roundRect(0,0,w,h,16);c.fill();c.fillStyle='#e3e0ec';[40,70,100].forEach((y,k)=>{c.beginPath();c.roundRect(24,y,k===2?110:200,10,5);c.fill()});c.fillStyle=P.b;c.globalAlpha=.55;c.beginPath();c.roundRect(24,140,70,12,6);c.fill()});
  [[.12,-.04,.0,-.07],[-.1,0,.025,.05],[.02,.03,.05,-.015]].forEach(([x,y,z,rz])=>{const pm=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.78),new THREE.MeshBasicMaterial({map:pt,transparent:true,side:THREE.DoubleSide,depthWrite:true,alphaTest:.5}));pm.renderOrder=2;pm.position.set(x,y+.2,z);pm.rotation.z=rz;papers.add(pm)});
  // front panel: pivots from the bottom edge
  const pivot=new THREE.Group();pivot.position.set(0,-FH/2,.09);g.add(pivot);
  const FHh=FH*.7,body=new THREE.Mesh(new RoundedBoxGeometry(FW,FHh,.08,4,.14),m(P.f,.5));body.position.y=FHh/2;body.castShadow=true;pivot.add(body);
  const ft=ctex(512,380,(c,w,h)=>{const gr=c.createLinearGradient(0,0,0,h);gr.addColorStop(0,light);gr.addColorStop(1,P.b);c.fillStyle=gr;c.beginPath();c.roundRect(0,0,w,h,48);c.fill();
    c.fillStyle='rgba(255,255,255,.28)';c.beginPath();c.roundRect(0,0,w,h*.36,[48,48,0,0]);c.fill();
    c.fillStyle='#4a3b35';c.textBaseline='alphabetic';c.font='700 60px -apple-system,"SF Pro Display","Helvetica Neue",Nunito,sans-serif';
    const words=node.n.split(' ');let lines=words.length>1&&c.measureText(node.n).width>440?[words.slice(0,Math.ceil(words.length/2)).join(' '),words.slice(Math.ceil(words.length/2)).join(' ')]:[node.n];
    const base=h-92-(lines.length-1)*64;lines.forEach((l,k)=>c.fillText(l,40,base+k*64));
    c.font='600 34px -apple-system,"Helvetica Neue",Nunito,sans-serif';c.fillStyle='rgba(74,47,77,.62)';c.fillText(SUB[i]||'',40,h-38)});
  const face=new THREE.Mesh(new THREE.PlaneGeometry(FW,FHh),new THREE.MeshBasicMaterial({map:ft,transparent:true}));face.position.set(0,FHh/2,.06);face.renderOrder=3;pivot.add(face);
  const sel=new THREE.Mesh(new THREE.PlaneGeometry(.01,.01),new THREE.MeshBasicMaterial({transparent:true,opacity:0}));g.add(sel);
  const hit=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.5),new THREE.MeshBasicMaterial({visible:false}));hit.position.set(0,0,.3);scene.add(hit);
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.34),new THREE.MeshBasicMaterial({map:ctex(128,64,(c,w,h)=>{const gr=c.createRadialGradient(w/2,h/2,2,w/2,h/2,w/2);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(0,0,w,h)}),color:mix(P.b,'#6b4a3a',.45),transparent:true,opacity:.25,depthWrite:false}));glow.renderOrder=-1;scene.add(glow);
  scene.add(g);return{g,node,pivot,papers,sel,hit,glow,back,h:0,home:new THREE.Vector3(),sc:1,t0:performance.now()+500+i*140}}
function layoutGL(){
  const W=document.documentElement.clientWidth||innerWidth,H=innerHeight;LW=W;LH=H;renderer.setSize(W,H,false);camera.aspect=W/H;camera.updateProjectionMatrix();
  const v0=vis(0),ppu=H/v0.h,m=mobile();
  const aw=$('#widget'),cm=$('#clockw'),pl=$('#player');
  let cx=i=>0,cy=i=>0,sc,gapY;
  document.documentElement.classList.toggle('mob',m);PPU=ppu;
  if(m){
    const side=12,cw=(W-side*2)/3,rowH=Math.min(118,cw*1.08),top=48;
    sc=Math.min(cw*.9/(FW*ppu),rowH*.78/(FH*ppu));
    cx=i=>side+cw*((i%3)+.5);cy=i=>top+rowH*(Math.floor(i/3)+.5);
    [aw,cm,pl].forEach(e=>{e.style.display='';e.style.left=side+'px';e.style.width=(W-side*2)+'px';e.style.height='';e.style.bottom='auto'});
    pl.classList.remove('sm','xs');
    let y=top+rowH*2+10;pl.style.top=y+'px';y+=pl.offsetHeight+10;
    aw.style.top=y+'px';y+=aw.offsetHeight+10;
    cm.style.top=y+'px';y+=cm.offsetHeight+10;
    MY=y;
  }else{
    const leftX=Math.round(W*.035),leftW=Math.min(W*.57,860),top=46,dock=100;
    aw.style.display='';cm.style.display='';pl.style.display='';aw.style.top='auto';$('#mspacer').style.height='0';
    aw.style.left=leftX+'px';aw.style.width=leftW+'px';aw.style.bottom=dock+'px';
    const aboutH=aw.offsetHeight,bandB=H-dock-aboutH-18,gap=Math.max(70,(bandB-top)/3),cw=leftW/3;gapY=gap;
    sc=clamp(Math.min(cw*.8,170)/(FW*ppu),.3,1.5);sc=Math.min(sc,gap*.82/(FH*ppu));
    cx=i=>leftX+cw*((i<3?0:1)+.5);cy=i=>top+gap*((i<3?i:i-3)+.5);
    cm.style.left=(leftX+cw*2+8)+'px';cm.style.top=(top+8)+'px';cm.style.width=(cw-8)+'px';cm.style.height=(gap*2-16)+'px';
    pl.style.left=(leftX+cw*2+8)+'px';pl.style.top=(top+gap*2+8)+'px';pl.style.width=(cw-8)+'px';pl.style.height='';pl.classList.toggle('sm',cw-8<262);pl.classList.toggle('xs',cw-8<190);
  }
  folders.forEach((f,i)=>{
    f.home.set((cx(i)-W/2)/ppu,(H/2-cy(i))/ppu,0);f.sc=sc;f.g.scale.setScalar(sc);f.half=FW*sc*ppu/2;
    f.hit.position.set(f.home.x,f.home.y,.3);f.hit.scale.setScalar(sc);
    f.glow.position.set(f.home.x,f.home.y-FH*.62*sc,-.4);f.glow.scale.setScalar(sc)});
  if(wall){const v=vis(-7);
    if(m){const k=v.h/H,wpx=W*.98,hp=wpx*1200/674,docY=MY;MW={cy:docY+hp*.5,k};
      wall.scale.set(wpx*k,hp*k,1);wall.position.set((W*.02)*k*.5,0,-7);
      if(aura){aura.scale.set(wpx*k*1.4,hp*k*.9,1);aura.position.x=wall.position.x}
      $('#mspacer').style.height=(docY+hp*.86)+'px'}
    else{MW=null;const hh=v.h*1.12,ww=hh*(674/1200);wall.scale.set(ww,hh,1);wall.position.set(v.w*.28,-v.h*.06,-7);
      if(aura){aura.scale.set(ww*1.5,hh*.95,1);aura.position.set(wall.position.x,wall.position.y+hh*.05,-7.6)}}}
}
let aura=null,PPU=60,MW=null,MY=0,LW=0,LH=0;
let flowers=[];
function makeFlowers(){
  const cols=['#ffffff','#fbe4de','#f6d3cd','#f3ead8'];
  const pg=new THREE.SphereGeometry(1,14,10);pg.scale(.4,.58,.07);pg.translate(0,.62,0);
  const cg=new THREE.SphereGeometry(.3,14,10);
  const cm=new THREE.MeshStandardMaterial({color:'#e9b878',roughness:.5});
  for(let i=0;i<22;i++){
    const near=false,g=new THREE.Group(),inner=new THREE.Group(),col=cols[i%cols.length];
    const pm=new THREE.MeshStandardMaterial({color:col,roughness:.55,side:THREE.DoubleSide});
    const np=i%2===0?6:5;
    for(let k=0;k<np;k++){const pt=new THREE.Mesh(pg,pm),a=new THREE.Group();a.rotation.z=k/np*Math.PI*2;pt.rotation.x=-.28;a.add(pt);inner.add(a)}
    inner.add(new THREE.Mesh(cg,cm));g.add(inner);
    const f={g,inner,near,sp:.35+Math.random()*.5,sw:Math.random()*6,sa:.3+Math.random()*.5,rs:new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(1.2),size:.4+Math.random()*.55,born:0,x0:0,y:0};
    resetFlower(f,true);scene.add(g);flowers.push(f)}
}
function resetFlower(f,first){
  const z=-15+Math.random()*3,v=vis(z);f.z=z;f.x0=(Math.random()-.5)*v.w*1.05;f.vh=v.h;
  f.y=first?(Math.random()-.5)*v.h:v.h/2+1;f.born=performance.now()-(first?Math.random()*2000:0);f.g.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3)}
function initGL(){
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true})}catch(e){return false}
  GL=true;renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;$('#gl').append(renderer.domElement);
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(FOV,innerWidth/innerHeight,4,60);camera.position.set(0,0,CAMZ);
  scene.add(new THREE.AmbientLight('#ffffff',1.9));const dl=new THREE.DirectionalLight('#fff4e6',2.1);dl.position.set(-3,6,10);scene.add(dl);
  const rim=new THREE.DirectionalLight('#fff3e6',.8);rim.position.set(6,-2,6);scene.add(rim);const rim2=new THREE.DirectionalLight('#ffe0d6',.7);rim2.position.set(-8,-4,5);scene.add(rim2);
  // wallpaper: your photo, fading into the desktop on its left edge
  const fade=ctex(256,4,(c,w,h)=>{const gr=c.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#000');gr.addColorStop(.42,'#fff');gr.addColorStop(1,'#fff');c.fillStyle=gr;c.fillRect(0,0,w,h)});fade.colorSpace=THREE.NoColorSpace;
  new THREE.TextureLoader().load('assets/me.png',tex=>{tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;wallMat=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:0,alphaTest:.02});wall=new THREE.Mesh(new THREE.PlaneGeometry(1,1),wallMat);scene.add(wall);layoutGL()});
  aura=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:ctex(256,256,(c,w,h)=>{const gr=c.createRadialGradient(w*.5,h*.45,6,w*.5,h*.5,w*.5);gr.addColorStop(0,'rgba(255,244,232,.95)');gr.addColorStop(.5,'rgba(247,214,204,.55)');gr.addColorStop(1,'rgba(240,200,190,0)');c.fillStyle=gr;c.fillRect(0,0,w,h)}),transparent:true,opacity:.9,depthWrite:false}));scene.add(aura);
  makeFlowers();
  folders=FS.kids.map((k,i)=>makeFolder(k,i));
  raycaster=new THREE.Raycaster();layoutGL();
  const cv=renderer.domElement;
  cv.addEventListener('pointermove',e=>mouse.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1));
  cv.addEventListener('pointerleave',()=>mouse.set(9,9));
  cv.addEventListener('click',e=>{mouse.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);raycaster.setFromCamera(mouse,camera);const h=raycaster.intersectObjects(folders.map(f=>f.hit),false)[0];const f=h&&folders.find(x=>x.hit===h.object);if(f)openInfo(f.node)});
  addEventListener('resize',layoutGL);
  return true}
const easeBounce=p=>{const n=7.5625,d=2.75;if(p<1/d)return n*p*p;if(p<2/d)return n*(p-=1.5/d)*p+.75;if(p<2.5/d)return n*(p-=2.25/d)*p+.9375;return n*(p-=2.625/d)*p+.984375};
let peekF=null;
const blurb=(id,sel,n=110)=>{const e=document.getElementById(id).content.querySelector(sel);const t=(e?e.textContent:'').trim();return t.length>n?t.slice(0,n-1).trim()+'…':t};
function peekHTML(i){
  if(i===0)return `<div class="pv about">${PASS}<div><b>Hi, I'm Fatin.</b><p>${blurb('p-about','.lead',130)}</p></div></div>`;
  if(i===1)return `<div class="pv"><b>The journey, year by year</b><div class="pj" style="--n:${MILES.length}">${MILES.map(m=>`<div><i></i><em>${m.l}</em><span>${m.t}</span></div>`).join('')}</div></div>`;
  if(i===2)return `<div class="pv"><b>What I've done</b><div class="ps"><div><em>50%</em><span>turned into A students</span></div><div><em>99%</em><span>passing grade</span></div></div><p class="pq" style="margin-top:10px!important">Led students in a university competition and ran entrepreneurship events for the public.</p></div>`;
  if(i===3)return `<div class="pv"><div class="p2"><div><b>Trading</b><p>${blurb('p-trading','.lead',80)}</p></div><div><b>Vibe coding</b><p>${blurb('p-vibe','.lead',80)}</p></div></div></div>`;
  if(i===5)return `<div class="pv"><b>Achievements</b><div class="p2"><div><b>Dean's List</b><p>Academic awardee</p></div><div><b>2nd place</b><p>Data Analytics: filtering spam, nudity and scam comments</p></div></div></div>`;
  return `<div class="pv"><b>Things I've built</b><div class="pt5">${PROJ.map(p=>`<div><strong>${p.n}</strong><span>${p.tags[p.tags.length-1]}</span></div>`).join('')}</div></div>`}
function peekUpdate(){
  const el=$('#peek');if(!el)return;const f=mobile()?null:hoverF;
  if(f!==peekF){peekF=f;if(f){el.innerHTML=peekHTML(FS.kids.indexOf(f.node));el.style.setProperty('--a',f.node.pal.b);el.style.setProperty('--f',f.node.pal.f);
    const v=f.g.position.clone().project(camera);el.style.left=((v.x+1)/2*innerWidth+f.half+16)+'px';el.style.top=Math.max(36,Math.min((1-v.y)/2*innerHeight-60,innerHeight-el.offsetHeight-96))+'px';
    el.classList.remove('on');void el.offsetWidth;el.classList.add('on')}else el.classList.remove('on')}}
function tick(now){
  requestAnimationFrame(tick);if(!GL)return;const t=now/1000;
  if(document.documentElement.clientWidth!==LW||innerHeight!==LH)layoutGL();
  camera.position.x+=((px*.55)-camera.position.x)*.06;camera.position.y+=((py*.32)-camera.position.y)*.06;camera.lookAt(0,0,0);
  if(wallMat)wallMat.opacity=Math.min(1,wallMat.opacity+.012);
  if(wall){wall.rotation.y=-px*.025;wall.rotation.x=py*.012}
  flowers.forEach(f=>{f.y-=f.sp*.011;if(f.y<-f.vh/2-1)resetFlower(f,false);
    const b=clamp((now-f.born)/1400),bl=b*b*(3-2*b);f.g.scale.setScalar(f.size*bl);f.inner.scale.set(1,1,.6+.4*bl);
    f.g.position.set(f.x0+Math.sin(t*.7+f.sw)*f.sa,f.y,f.z);f.g.rotation.x+=f.rs.x*.006;f.g.rotation.y+=f.rs.y*.006;f.g.rotation.z+=f.rs.z*.006});
  raycaster.setFromCamera(mouse,camera);hoverF=null;
  const ready=folders.filter(f=>now>f.t0+900);const hit=raycaster.intersectObjects(ready.map(f=>f.hit),false)[0];if(hit)hoverF=folders.find(f=>f.hit===hit.object);
  if(hoverF!==tick.prev){if(hoverF)snd.tick();tick.prev=hoverF}
  renderer.domElement.style.cursor=hoverF?'pointer':'';
  peekUpdate();
  const sy=mobile()?scrollY:0;
  if(MW&&wall){wall.position.y=(innerHeight/2-(MW.cy-sy))*MW.k;if(aura)aura.position.y=wall.position.y+MW.k*20}
  folders.forEach((f,i)=>{
    const p=clamp((now-f.t0)/900),drop=p<=0?9:(1-easeBounce(p))*8;
    f.g.visible=f.glow.visible=now>f.t0-50;f.h+=((f===hoverF?1:0)-f.h)*.1;
    const fl=Math.sin(t*1.2+i*1.7);
    const oy=sy/PPU;f.hit.position.y=f.home.y+oy;f.glow.position.y=f.home.y+oy-FH*.62*f.sc;
    f.g.position.set(f.home.x,f.home.y+oy+drop+fl*.09+f.h*.1,f.h*.5);
    f.g.rotation.set((f===hoverF?-mouse.y*.08:0)-.02+Math.sin(t*.8+i)*.012,(f===hoverF?mouse.x*.1:0)+Math.sin(t*.6+i*2)*.03,0);
    f.pivot.rotation.x=-f.h*.34;f.papers.position.y=f.h*.2;f.g.scale.setScalar(f.sc*(1+.05*f.h));
    f.glow.material.opacity=(.22+.08*f.h)*(1-fl*.2);f.glow.scale.setScalar(f.sc*(1-fl*.06+f.h*.1));
  });
  renderer.render(scene,camera);
}
addEventListener('pointermove',e=>{px=e.clientX/innerWidth*2-1;py=-(e.clientY/innerHeight)*2+1;document.documentElement.style.setProperty('--rx',(py*2.4).toFixed(2)+'deg');document.documentElement.style.setProperty('--ry',(px*3.2).toFixed(2)+'deg')});
addEventListener('keydown',e=>{if(e.key==='Escape'&&wins.length)closeWin(wins[wins.length-1])});

(async()=>{
  if(!initGL()){document.body.classList.add('nogl');$('#fallback').innerHTML=FS.kids.map((k,i)=>`<button class="fb" data-i="${i}"><span class="fi"></span><span>${k.n}</span></button>`).join('');document.querySelectorAll('#fallback .fb').forEach(b=>b.onclick=()=>openInfo(FS.kids[+b.dataset.i]))}
  else requestAnimationFrame(tick);
  document.body.classList.add('ready');
})();
