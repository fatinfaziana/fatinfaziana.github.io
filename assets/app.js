import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const INK='#4a2f4d',CREAM='#fffaf5',BUTTER='#fde38a',PINK='#ef95b0',LILAC='#cfc2ea',PEACH='#f8c4a4';
const TREE={id:'root',title:'Fatin Faziana',cap:'Choose a card.',kids:[
 {id:'about',title:'About myself',sub:'Who I am',c:BUTTER,sym:'sun',panel:'p-about'},
 {id:'exp',title:'Experience',sub:'A timeline',c:PINK,sym:'path',panel:'p-exp'},
 {id:'impact',title:'Contributions',sub:'Struggling to A',c:LILAC,sym:'star',panel:'p-impact'},
 {id:'beyond',title:'Beyond teaching',sub:'Trading & building',c:PEACH,sym:'candles',panel:'p-beyond',within:2},
 {id:'projects',title:'Projects',sub:'Built & shipped',c:PINK,sym:'cube',panel:'p-projects',within:5}
]};
const ROMAN=['I','II','III','IV','V','VI','VII'];
(function link(n,p){n.parent=p;(n.kids||[]).forEach((k,i)=>{k.num=ROMAN[i];link(k,n)})})(TREE,null);

const $=s=>document.querySelector(s);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
let cur=TREE,busy=false,locked=null,hovered=null,cards=[],GL=false,dealt=false;

/* ---------- sound ---------- */
const snd=(()=>{let ctx,on=true;
 const ensure=()=>{if(!ctx){try{ctx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(ctx&&ctx.state==='suspended')ctx.resume();return ctx};
 const env=(t,d,pk)=>{const g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(pk,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);g.connect(ctx.destination);return g};
 const noise=d=>{const b=ctx.createBuffer(1,Math.max(1,ctx.sampleRate*d|0),ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;const n=ctx.createBufferSource();n.buffer=b;return n};
 const osc=(t,type,f0,f1,d,pk)=>{const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+d);o.connect(env(t,d,pk));o.start(t);o.stop(t+d+.02)};
 const sweep=(d,f0,f1,pk)=>{const t=ctx.currentTime,n=noise(d),f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=.8;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+d*.7);n.connect(f);f.connect(env(t,d,pk));n.start(t)};
 return{unlock:ensure,ctx:()=>ensure(),get on(){return on},toggle(){on=!on;return on},
  click(){if(!on||!ensure())return;const t=ctx.currentTime;osc(t,'triangle',1700,520,.06,.2);osc(t,'sine',240,110,.09,.16)},
  tick(){if(!on||!ensure())return;osc(ctx.currentTime,'sine',2600,2300,.025,.035)},
  deal(){if(!on||!ensure())return;sweep(.16,1500,3600,.13)},
  riffle(n=6){if(!on||!ensure())return;const t0=ctx.currentTime;for(let i=0;i<n;i++){const t=t0+i*.085,nz=noise(.035),f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=2300+Math.random()*1800;f.Q.value=1.3;nz.connect(f);f.connect(env(t,.035,.14));nz.start(t)}},
  flip(){if(!on||!ensure())return;sweep(.5,600,2600,.2);osc(ctx.currentTime+.05,'sine',420,200,.2,.05)}}})();
document.addEventListener('pointerdown',()=>snd.unlock(),{capture:true});
document.addEventListener('click',e=>{if(e.target.closest('.btn,.chip2:not(.snd),#x'))snd.click()});
$('#snd').onclick=()=>{const o=snd.toggle();$('#snd').textContent=o?'Sound on':'Sound off';if(o)snd.click()};

/* ---------- music: chill lo-fi loops synthesised in the browser ---------- */
const midi=m=>440*Math.pow(2,(m-69)/12);
// 16 sixteenth-steps per bar, 4 bars per loop. mel events: [step, note, lengthInSteps]
const TRACKS=[
 {name:'Café',bpm:76,bell:true,
  chords:[[52,55,59,62],[55,57,60,64],[53,57,60,62],[53,55,59,62]],bass:[36,33,38,43],
  mel:[[[0,76,3],[4,74,2],[6,72,2],[10,76,4]],[[0,72,3],[4,69,2],[8,72,2],[11,74,4]],[[0,69,3],[4,72,2],[6,74,3],[10,72,4]],[[0,67,2],[3,71,2],[6,74,3],[10,79,5]]]},
 {name:'Cozy Game',bpm:84,bell:false,
  chords:[[53,57,60,64],[52,55,59,62],[53,57,60,62],[55,59,62,64]],bass:[41,40,38,36],
  mel:[[[0,81,2],[3,77,2],[6,79,2],[8,81,4]],[[0,79,2],[3,76,2],[6,74,2],[8,76,4]],[[0,74,2],[3,77,2],[6,81,3],[10,79,4]],[[0,76,2],[3,79,2],[6,84,4],[11,81,4]]]}
];
const music=(()=>{
  let ctx,bus,timer,step=0,next=0,idx=-1,started=false;
  const pref=()=>{const v=localStorage.getItem('fz-music');return v===null?0:+v};
  function chain(){
    if(bus)return;bus=ctx.createGain();bus.gain.value=0;
    const warm=ctx.createBiquadFilter();warm.type='lowpass';warm.frequency.value=2300;warm.Q.value=.4;
    const dly=ctx.createDelay(1);dly.delayTime.value=.39;const fb=ctx.createGain();fb.gain.value=.36;
    const dl=ctx.createBiquadFilter();dl.type='lowpass';dl.frequency.value=1500;const wet=ctx.createGain();wet.gain.value=.34;
    bus.connect(warm);warm.connect(ctx.destination);
    bus.connect(dly);dly.connect(dl);dl.connect(fb);fb.connect(dly);dl.connect(wet);wet.connect(warm);
  }
  const env=(t,d,v,a)=>{const g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+d);g.connect(bus);return g};
  const osc=(t,type,f,d,v,a=.01)=>{const o=ctx.createOscillator();o.type=type;o.frequency.value=f;o.connect(env(t,d,v,a));o.start(t);o.stop(t+d+.05)};
  const rhodes=(t,m,d,v)=>{const f=midi(m);osc(t,'sine',f,d,v,.012);osc(t,'sine',f*2,d*.55,v*.28,.006);osc(t,'triangle',f*4.01,.25,v*.07,.003)};
  const noise=(t,d,v,type,f,q=1)=>{const b=ctx.createBuffer(1,Math.max(1,ctx.sampleRate*d|0),ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;const n=ctx.createBufferSource(),fl=ctx.createBiquadFilter();n.buffer=b;fl.type=type;fl.frequency.value=f;fl.Q.value=q;n.connect(fl);fl.connect(env(t,d,v,.002));n.start(t)};
  const kick=(t,v)=>{const o=ctx.createOscillator();o.frequency.setValueAtTime(115,t);o.frequency.exponentialRampToValueAtTime(46,t+.14);o.connect(env(t,.28,v,.003));o.start(t);o.stop(t+.3)};
  function play(st,t0){
    const T=TRACKS[idx],bar=(st>>4)&3,k=st&15,sd=60/T.bpm/4;
    let t=t0+(k%4===2?sd*.42:k%2?sd*.08:0)+(Math.random()-.5)*.012;       // lazy swing + human feel
    const ch=T.chords[bar];
    if(k===0||k===7||k===10){const long=k===0;ch.forEach((m,i)=>rhodes(t+i*.012,m,long?1.9:.8,long?.04:.03))}   // electric-piano comping
    if(k===0||k===7||k===10){osc(t,'sine',midi(T.bass[bar]+(k===7?7:0)),k===0?.9:.35,.2,.015)}              // round bass
    if(k===0||k===10)kick(t,.17);
    if(k===4||k===12){noise(t,.16,.05,'bandpass',1700,.7);osc(t,'sine',190,.09,.04)}                          // soft snare
    if(k%2===0)noise(t,.045,k%4===0?.022:.014,'highpass',7500);                                                // brushed hat
    if(Math.random()<.18)noise(t+Math.random()*sd,.006,.03,'highpass',3000);                                   // vinyl crackle
    T.mel[bar].forEach(([ms,m,len])=>{if(ms!==k)return;const d=len*sd*1.1;
      if(T.bell){osc(t,'sine',midi(m),d+.5,.07,.006);osc(t,'sine',midi(m)*3,.35,.014,.003)}
      else{osc(t,'triangle',midi(m),d+.3,.06,.01);osc(t,'square',midi(m)*2,.18,.008,.005)}})
  }
  function pump(){const sd=60/TRACKS[idx].bpm/4;while(next<ctx.currentTime+.35){play(step,next);next+=sd;step=(step+1)%64}}
  function begin(i){
    if(!(ctx=snd.ctx()))return;chain();clearInterval(timer);idx=i;step=0;next=ctx.currentTime+.1;
    bus.gain.cancelScheduledValues(ctx.currentTime);bus.gain.setValueAtTime(bus.gain.value,ctx.currentTime);bus.gain.linearRampToValueAtTime(.85,ctx.currentTime+2);
    timer=setInterval(pump,60);pump();
  }
  function stop(){if(!ctx)return;clearInterval(timer);timer=null;bus.gain.cancelScheduledValues(ctx.currentTime);bus.gain.setValueAtTime(bus.gain.value,ctx.currentTime);bus.gain.linearRampToValueAtTime(0,ctx.currentTime+.5);idx=-1}
  const label=()=>{$('#mus').textContent=idx<0?'Music off':'♪ '+TRACKS[idx].name};
  document.addEventListener('visibilitychange',()=>{if(!ctx)return;document.hidden?ctx.suspend():ctx.resume()});
  return{
    firstGesture(){if(started)return;started=true;const p=pref();if(p>=0&&p<TRACKS.length)begin(p);label()},
    cycle(){const n=idx+1;if(n>=TRACKS.length){stop();localStorage.setItem('fz-music','-1')}else{begin(n);localStorage.setItem('fz-music',String(n))}started=true;label()},
    label,get idx(){return idx}
  };
})();
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#mus'))music.firstGesture()},{capture:true});
$('#mus').onclick=()=>{snd.click();music.cycle()};

/* ---------- UI ---------- */
function renderUI(){
  const path=[];for(let n=cur;n;n=n.parent)path.unshift(n);
  $('#crumb').innerHTML=path.map((n,i)=>i===path.length-1?`<b>${n.id==='root'?'Home':n.title}</b>`:`<span>${n.id==='root'?'Home':n.title}</span>`).join('<span>/</span>');
  $('#cap').textContent=cur.cap||'';
  const ch=$('#chips');ch.innerHTML='';
  if(cur.parent){const b=document.createElement('button');b.className='chip2 back';b.textContent='← Back';b.onclick=back;ch.append(b)}
  cur.kids.forEach(k=>{const b=document.createElement('button');b.className='chip2';b.textContent=k.title;b.onclick=()=>choose(k);ch.append(b)});
}
function openPanel(id,c){
  const t=document.getElementById(id);$('#pc').innerHTML='';$('#pc').append(t.content.cloneNode(true));
  $('#panel').style.setProperty('--c',t.dataset.c||c);$('#panel').classList.toggle('wide',!!t.dataset.wide);$('#veil').classList.add('on');$('#panel').scrollTop=0;$('#x').focus();
}
function closePanel(){
  if(!$('#veil').classList.contains('on'))return;$('#veil').classList.remove('on');
  if(locked)closeCard()
}
$('#x').onclick=closePanel;$('#veil').onclick=e=>{if(e.target.id==='veil')closePanel()};
addEventListener('keydown',e=>{if(e.key==='Escape')closePanel()});

/* ---------- textures ---------- */
function tex(w,h,draw){
  const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
const rr=(g,x,y,w,h,r)=>{g.beginPath();g.roundRect(x,y,w,h,r)};
const SERIF='"Cormorant Garamond", serif',SANS='Nunito, sans-serif';
function wrap(g,t,x,y,w,lh){const ws=t.split(' ');let l='';const out=[];ws.forEach(wd=>{const q=l?l+' '+wd:wd;if(g.measureText(q).width>w&&l){out.push(l);l=wd}else l=q});out.push(l);out.forEach((s,i)=>g.fillText(s,x,y+i*lh));return out.length}
const SYM={
 sun:(g,x,y,r)=>{g.beginPath();g.arc(x,y,r*.36,0,7);g.fillStyle=BUTTER;g.fill();g.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6,r2=r*(i%2?.7:.86);g.beginPath();g.moveTo(x+Math.cos(a)*r*.5,y+Math.sin(a)*r*.5);g.lineTo(x+Math.cos(a)*r2,y+Math.sin(a)*r2);g.stroke()}},
 path:(g,x,y,r)=>{const P=[[-.7,.6],[-.2,.2],[.25,-.1],[.7,-.6]];g.beginPath();P.forEach(([a,b],i)=>i?g.lineTo(x+a*r,y+b*r):g.moveTo(x+a*r,y+b*r));g.stroke();P.forEach(([a,b],i)=>{g.beginPath();g.arc(x+a*r,y+b*r,r*.13,0,7);g.fillStyle=i%2?BUTTER:CREAM;g.fill();g.stroke()})},
 star:(g,x,y,r)=>{g.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8-Math.PI/2,d=i%2?r*.36:r*.88;g.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d)}g.closePath();g.fillStyle=BUTTER;g.fill();g.stroke()},
 candles:(g,x,y,r)=>{[[-.6,.55,.2,PINK],[-.2,.8,.3,BUTTER],[.2,.45,.35,PINK],[.6,.9,.25,BUTTER]].forEach(([a,h,w,c])=>{const cx=x+a*r;g.beginPath();g.moveTo(cx,y-h*r*.9);g.lineTo(cx,y+h*r*.9);g.stroke();g.fillStyle=c;rr(g,cx-w*r*.3,y-h*r*.45,w*r*.6,h*r*.9,6);g.fill();g.stroke()})},
 cube:(g,x,y,r)=>{const P=[0,1,2,3,4,5].map(i=>{const a=Math.PI/6+i*Math.PI/3;return[x+Math.cos(a)*r*.8,y+Math.sin(a)*r*.8]});g.beginPath();P.forEach(([a,b],i)=>i?g.lineTo(a,b):g.moveTo(a,b));g.closePath();g.fillStyle=BUTTER;g.fill();g.stroke();
  g.beginPath();g.moveTo(P[4][0],P[4][1]);g.lineTo(x,y);g.lineTo(P[2][0],P[2][1]);g.moveTo(x,y);g.lineTo(P[0][0],P[0][1]);g.stroke();g.beginPath();g.moveTo(P[3][0],P[3][1]);g.lineTo(x,y);g.lineTo(P[5][0],P[5][1]);g.fillStyle='rgba(239,149,176,.7)';g.fill()},
 code:(g,x,y,r)=>{g.fillStyle=INK;g.textAlign='center';g.font=`700 ${r*.95}px ${SERIF}`;g.fillText('</>',x,y+r*.3)},
 moon:(g,x,y,r)=>{g.beginPath();g.arc(x,y,r*.62,0,7);g.fillStyle=BUTTER;g.fill();g.stroke();g.beginPath();g.arc(x+r*.28,y-r*.08,r*.52,0,7);g.fillStyle=BUTTER;g.fill();g.beginPath();g.arc(x+r*.2,y-r*.05,r*.5,0,7);g.fillStyle=CREAM;g.globalAlpha=0;g.fill();g.globalAlpha=1;
  g.beginPath();g.arc(x,y,r*.62,.45,Math.PI*2-.45);g.stroke();g.beginPath();g.arc(x+r*.3,y,r*.5,Math.PI*2-.75,.75,true);g.stroke()},
 check:(g,x,y,r)=>{g.beginPath();g.arc(x,y,r*.7,0,7);g.fillStyle=BUTTER;g.fill();g.stroke();g.beginPath();g.moveTo(x-r*.32,y+r*.02);g.lineTo(x-r*.08,y+r*.28);g.lineTo(x+r*.38,y-r*.26);g.lineWidth=9;g.stroke();g.lineWidth=5},
 chart:(g,x,y,r)=>{g.beginPath();g.moveTo(x-r*.8,y-r*.7);g.lineTo(x-r*.8,y+r*.7);g.lineTo(x+r*.85,y+r*.7);g.stroke();const P=[[-.6,.4],[-.2,.05],[.1,.25],[.55,-.4]];g.beginPath();P.forEach(([a,b],i)=>i?g.lineTo(x+a*r,y+b*r):g.moveTo(x+a*r,y+b*r));g.stroke();P.forEach(([a,b])=>{g.beginPath();g.arc(x+a*r,y+b*r,r*.1,0,7);g.fillStyle=PINK;g.fill();g.stroke()})},
 aster:(g,x,y,r)=>{g.lineCap='round';g.lineWidth=16;for(let i=0;i<3;i++){const a=i*Math.PI/3+Math.PI/6;g.beginPath();g.moveTo(x-Math.cos(a)*r*.75,y-Math.sin(a)*r*.75);g.lineTo(x+Math.cos(a)*r*.75,y+Math.sin(a)*r*.75);g.stroke()}g.lineWidth=5;g.lineCap='butt';g.beginPath();g.arc(x,y,r*.16,0,7);g.fillStyle=BUTTER;g.fill();g.stroke()},
 branch:(g,x,y,r)=>{const N=[[-.5,.62],[-.5,-.55],[.45,-.1]];g.beginPath();g.moveTo(x+N[0][0]*r,y+N[0][1]*r);g.lineTo(x+N[1][0]*r,y+N[1][1]*r);g.moveTo(x+N[0][0]*r,y+N[0][1]*r);g.bezierCurveTo(x-.5*r,y+.1*r,x+.45*r,y+.3*r,x+N[2][0]*r,y+N[2][1]*r);g.stroke();N.forEach(([a,b],i)=>{g.beginPath();g.arc(x+a*r,y+b*r,r*.15,0,7);g.fillStyle=i===2?PINK:BUTTER;g.fill();g.stroke()})}
};
const RED='#d9537f';
const SUITS={
 heart:(g,x,y,s)=>{g.beginPath();g.moveTo(x,y+.95*s);g.bezierCurveTo(x-1.25*s,y+.1*s,x-.95*s,y-.95*s,x,y-.35*s);g.bezierCurveTo(x+.95*s,y-.95*s,x+1.25*s,y+.1*s,x,y+.95*s);g.fill()},
 diamond:(g,x,y,s)=>{g.beginPath();g.moveTo(x,y-s);g.lineTo(x+.7*s,y);g.lineTo(x,y+s);g.lineTo(x-.7*s,y);g.closePath();g.fill()},
 spade:(g,x,y,s)=>{g.beginPath();g.moveTo(x,y-.95*s);g.bezierCurveTo(x-1.25*s,y-.1*s,x-.95*s,y+.95*s,x,y+.35*s);g.bezierCurveTo(x+.95*s,y+.95*s,x+1.25*s,y-.1*s,x,y-.95*s);g.fill();g.beginPath();g.moveTo(x-.12*s,y+.2*s);g.lineTo(x+.12*s,y+.2*s);g.lineTo(x+.38*s,y+.98*s);g.lineTo(x-.38*s,y+.98*s);g.fill()},
 club:(g,x,y,s)=>{[[0,-.5],[-.52,.2],[.52,.2]].forEach(([a,b])=>{g.beginPath();g.arc(x+a*s,y+b*s,.42*s,0,7);g.fill()});g.beginPath();g.moveTo(x-.12*s,y);g.lineTo(x+.12*s,y);g.lineTo(x+.36*s,y+.98*s);g.lineTo(x-.36*s,y+.98*s);g.fill()},
 star:(g,x,y,s)=>{g.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,d=i%2?s*.42:s;g.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d)}g.closePath();g.fill()}
};
const isRed=k=>k==='heart'||k==='diamond'||k==='star';
const pip=(g,k,x,y,s)=>{g.fillStyle=isRed(k)?RED:INK;SUITS[k](g,x,y,s)};
function corners(g,w,h,rank,suit){[0,1].forEach(r=>{g.save();if(r){g.translate(w,h);g.rotate(Math.PI)}g.fillStyle=isRed(suit)?RED:INK;g.textAlign='center';g.font=`700 ${rank.length>1?56:68}px ${SERIF}`;g.fillText(rank,76,112);pip(g,suit,76,158,24);g.restore()})}
function cardBase(g,w,h){g.fillStyle='#fffaf5';rr(g,0,0,w,h,34);g.fill();g.strokeStyle=INK;g.lineWidth=6;rr(g,14,14,w-28,h-28,26);g.stroke();g.lineWidth=2;rr(g,30,30,w-60,h-60,16);g.stroke()}
function wrapCount(g,t,w){const ws=t.split(' ');let l='',c=1;ws.forEach(wd=>{const q=l?l+' '+wd:wd;if(g.measureText(q).width>w&&l){c++;l=wd}else l=q});return c}
const CARDINFO={about:['A','heart'],exp:['K','spade'],impact:['Q','diamond'],beyond:['J','club'],projects:['★','star'],trading:['2','diamond'],vibe:['3','club'],learn:['2','heart'],mark:['3','spade'],tdesk:['4','diamond'],ast:['5','club'],gh:['6','heart']};
function faceTex(n){const [rank,suit]=CARDINFO[n.id];return tex(512,870,(g,w,h)=>{
  cardBase(g,w,h);corners(g,w,h,rank,suit);
  g.fillStyle=n.c;rr(g,70,210,w-140,390,18);g.fill();g.strokeStyle=INK;g.lineWidth=4;rr(g,70,210,w-140,390,18);g.stroke();
  g.lineWidth=1.5;g.globalAlpha=.35;for(let i=1;i<4;i++){rr(g,70+i*7,210+i*7,w-140-i*14,390-i*14,12);g.stroke()}g.globalAlpha=1;
  g.lineWidth=5;g.lineJoin='round';SYM[n.sym](g,w/2,405,140);
  g.fillStyle=INK;g.textAlign='center';g.font=`700 52px ${SERIF}`;const lines=wrapCount(g,n.title,300);
  if(lines>1){g.font=`700 46px ${SERIF}`;wrap(g,n.title,w/2,664,300,44)}else g.fillText(n.title,w/2,680);
  g.fillStyle='#7d6580';g.font=`800 17px ${SANS}`;g.fillText(n.sub.toUpperCase().split('').join(' '),w/2,lines>1?768:748);
  if(n.within||n.href){g.fillStyle=INK;g.font=`800 14px ${SANS}`;g.fillText(n.within?'✦  '+n.within+' CARDS WITHIN  ✦':'✦  OPENS GITHUB  ✦',w/2,h-52)}
})}
function plainFace(rank,suit){return tex(512,870,(g,w,h)=>{cardBase(g,w,h);corners(g,w,h,rank,suit);
  const big=rank==='K'||rank==='Q'||rank==='J';pip(g,suit,w/2,h/2,big?120:105);
  if(big){g.strokeStyle=isRed(suit)?RED:INK;g.lineWidth=4;rr(g,110,230,w-220,h-460,14);g.stroke()}
  else{[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>pip(g,suit,w/2+a*100,h/2+b*190,36))}})}
function backTex(){return tex(512,870,(g,w,h)=>{
  g.fillStyle='#fffaf5';rr(g,0,0,w,h,34);g.fill();g.fillStyle='#e68aa9';rr(g,26,26,w-52,h-52,20);g.fill();
  g.save();rr(g,26,26,w-52,h-52,20);g.clip();g.strokeStyle='rgba(255,250,245,.55)';g.lineWidth=3;
  for(let i=-20;i<40;i++){g.beginPath();g.moveTo(i*52,0);g.lineTo(i*52+h*.6,h);g.moveTo(i*52+h*.6,0);g.lineTo(i*52,h);g.stroke()}g.restore();
  g.strokeStyle='#fffaf5';g.lineWidth=5;rr(g,42,42,w-84,h-84,14);g.stroke();
  g.fillStyle=INK;g.beginPath();g.arc(w/2,h/2,112,0,7);g.fill();g.strokeStyle=BUTTER;g.lineWidth=4;g.beginPath();g.arc(w/2,h/2,112,0,7);g.stroke();g.lineWidth=2;g.beginPath();g.arc(w/2,h/2,98,0,7);g.stroke();
  g.fillStyle=BUTTER;g.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8-Math.PI/2,d=i%2?26:70;g.lineTo(w/2+Math.cos(a)*d,h/2+Math.sin(a)*d)}g.closePath();g.fill()})}
function feltTex(){const t=tex(512,512,(g,w,h)=>{
  g.fillStyle='#1d4d3b';g.fillRect(0,0,w,h);
  for(let i=0;i<9000;i++){g.fillStyle=Math.random()<.5?'rgba(255,255,255,.03)':'rgba(0,25,15,.07)';g.fillRect(Math.random()*w,Math.random()*h,2,2)}
  g.strokeStyle='rgba(253,227,138,.16)';g.fillStyle='rgba(253,227,138,.2)';g.lineWidth=1.6;g.lineJoin='round';
  const spark=(x,y,r)=>{g.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,d=i%2?r*.26:r;g.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d)}g.closePath();g.fill()};
  const moon=(x,y,r)=>{g.beginPath();g.arc(x,y,r,.45*Math.PI,1.55*Math.PI);g.arc(x+r*.42,y,r*.82,1.55*Math.PI,.45*Math.PI,true);g.closePath();g.fill()};
  // constellation: little stars joined by a dotted thread, a crescent moon, and the four suits
  g.setLineDash([2,6]);g.beginPath();g.moveTo(40,70);g.lineTo(120,40);g.lineTo(190,95);g.lineTo(240,60);g.stroke();g.setLineDash([]);
  spark(40,70,9);spark(120,40,12);spark(190,95,8);spark(240,60,10);
  moon(380,80,26);spark(440,130,7);
  g.setLineDash([2,6]);g.beginPath();g.moveTo(300,330);g.lineTo(370,300);g.lineTo(440,350);g.lineTo(480,310);g.stroke();g.setLineDash([]);
  spark(300,330,10);spark(370,300,8);spark(440,350,12);spark(480,310,7);
  moon(90,360,22);spark(150,420,8);
  g.globalAlpha=.8;SUITS.heart(g,230,230,14);SUITS.spade(g,300,160,14);SUITS.diamond(g,160,200,14);SUITS.club(g,420,230,13);g.globalAlpha=1;
  g.beginPath();g.arc(256,420,34,0,7);g.stroke();g.beginPath();g.arc(256,420,26,0,7);g.stroke();spark(256,420,18);
});t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(9,6);return t}
function ringTex(){return tex(1024,640,(g,w,h)=>{g.strokeStyle='rgba(253,227,138,.55)';g.lineWidth=5;g.beginPath();g.ellipse(w/2,h/2,w/2-14,h/2-14,0,0,7);g.stroke();g.lineWidth=2;g.beginPath();g.ellipse(w/2,h/2,w/2-34,h/2-34,0,0,7);g.stroke()})}
function glowTex(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),gr=x.createRadialGradient(128,128,30,128,128,128);gr.addColorStop(0,'rgba(253,227,138,.9)');gr.addColorStop(.5,'rgba(253,227,138,.3)');gr.addColorStop(1,'rgba(253,227,138,0)');x.fillStyle=gr;x.fillRect(0,0,256,256);return new THREE.CanvasTexture(c)}

/* ---------- the table ---------- */
const CW=2.1,CH=3.6,T17=Math.tan(THREE.MathUtils.degToRad(17)),TILT0=.85,KEYS=['x','y','z','rz','s','flip','tl'],HKEYS=['x','y','z','rz','curl','tc','pt'];
let renderer,scene,camera,table,ring,raycaster,backT,glowT,live=[],hand=[],hands=[],decor=[],dirLight,dust,tilt=TILT0,tiltTg=TILT0,tiltRate=1.6,viewHW=7,viewHH=4,introTok=0;
const mouse=new THREE.Vector2(9,9);let mx=0,my=0,last=0;
const camBase=new THREE.Vector3(0,0,15);
const tw=(dur,fn)=>new Promise(res=>{const t0=performance.now();const f=now=>{const p=clamp((now-t0)/(dur*1000)),e=1-Math.pow(1-p,3);fn(e);p<1?requestAnimationFrame(f):res()};requestAnimationFrame(f)});
const std=c=>new THREE.MeshStandardMaterial({color:c,roughness:.8});

function newCard(map){
  const g=new THREE.Group(),flip=new THREE.Group();g.add(flip);
  const body=new THREE.Mesh(new RoundedBoxGeometry(CW,CH,.04,2,.06),std('#efe4d3'));body.castShadow=true;flip.add(body);
  const fm=new THREE.MeshBasicMaterial({map}),f=new THREE.Mesh(new THREE.PlaneGeometry(CW-.01,CH-.01),fm);f.position.z=.022;flip.add(f);
  const b=new THREE.Mesh(new THREE.PlaneGeometry(CW-.01,CH-.01),new THREE.MeshBasicMaterial({map:backT}));b.position.z=-.022;b.rotation.y=Math.PI;flip.add(b);
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(CW*2,CH*1.5),new THREE.MeshBasicMaterial({map:glowT,transparent:true,opacity:0,depthWrite:false}));glow.position.z=-.1;g.add(glow);
  const hit=new THREE.Mesh(new THREE.PlaneGeometry(CW,CH),new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}));hit.position.z=.03;flip.add(hit);
  table.add(g);
  const c={g,flip,fm,glow,hit,st:{x:0,y:0,z:0,rz:0,s:1,flip:0,tl:0},tg:{x:0,y:0,z:0,rz:0,s:1,flip:0,tl:0},rate:5,ready:false,tx:0,ty:0,go:0,free:false,home:null,node:null,ret:null};
  live.push(c);return c;
}
const place=(c,p)=>{c.st={x:0,y:0,z:0,rz:0,s:1,flip:0,tl:0,...p};c.tg={...c.st}};
const goto=(c,p,rate)=>{c.tg={x:0,y:0,z:0,rz:0,s:1,flip:0,tl:0,...p};if(rate)c.rate=rate};
function killCard(c){
  const i=live.indexOf(c);if(i>=0)live.splice(i,1);table.remove(c.g);scene.remove(c.g);
  c.g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map!==backT&&o.material.map!==glowT&&o.material.map)o.material.map.dispose();o.material.dispose()}});
}

/* --- human hands: skin, knuckles, three-joint fingers, nails, thumb, cuff and sleeve --- */
let toonGrad=null;
const toon=c=>{if(!toonGrad){toonGrad=new THREE.DataTexture(new Uint8Array([205,205,205,255,235,235,235,255,255,255,255,255]),3,1,THREE.RGBAFormat);toonGrad.minFilter=toonGrad.magFilter=THREE.NearestFilter;toonGrad.needsUpdate=true}
  return new THREE.MeshToonMaterial({color:c,gradientMap:toonGrad})};
// smooth tapered limb with round ends (no gaps, no hard joints)
function limb(r0,r1,l){const pts=[],N=8;
  for(let i=0;i<=N;i++){const a=-Math.PI/2+Math.PI/2*i/N;pts.push(new THREE.Vector2(Math.cos(a)*r0,Math.sin(a)*r0))}
  for(let i=0;i<=N;i++){const a=Math.PI/2*i/N;pts.push(new THREE.Vector2(Math.cos(a)*r1,l+Math.sin(a)*r1))}
  return new THREE.LatheGeometry(pts,18)}
const OUT=new THREE.MeshBasicMaterial({color:'#c98a78',side:THREE.BackSide});
function part(geo,mat,out=1.045){const m=new THREE.Mesh(geo,mat);m.castShadow=true;if(out){const o=new THREE.Mesh(geo,OUT);o.scale.setScalar(out);m.add(o)}return m}
function makeHand(side){
  const g=new THREE.Group(),skin=toon('#fbdcc9'),nail=new THREE.MeshStandardMaterial({color:'#f5c6c2',roughness:.12,metalness:.05}),crease=new THREE.MeshBasicMaterial({color:'#d9a08c'}),hi=new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.85}),cuff=toon('#fffdfa'),sleeve=toon('#6a4a70');
  const flat=(m,x,y,z)=>{m.scale.set(x,y,z);return m};
  const palm=flat(part(new THREE.SphereGeometry(1,24,18),skin),.46,.54,.17);palm.position.set(0,.05,0);g.add(palm);
  const heel=flat(part(new THREE.SphereGeometry(1,20,16),skin),.34,.36,.15);heel.position.set(side*.03,-.45,0);g.add(heel);
  const wrist=flat(part(limb(.25,.2,.55),skin),1,1,.72);wrist.position.set(0,-1.0,0);g.add(wrist);
  const cf=flat(part(limb(.42,.3,.4),cuff),1,1,.78);cf.position.set(0,-1.4,0);g.add(cf);
  const sl=flat(part(limb(.66,.44,3.3),sleeve),1,1,.85);sl.position.set(0,-5.3,0);g.add(sl);
  const LEN=[[.62,.42,.34],[.7,.46,.36],[.62,.42,.33],[.5,.33,.27]],R=[.088,.092,.085,.075],fingers=[];
  const mkNail=(r,l,parent,y,z)=>{const n=flat(part(new THREE.CapsuleGeometry(1,1.1,6,14),nail,0),r*.6,l*.5,r*.17);n.position.set(0,y,z);n.rotation.x=-.16;
    const h=flat(new THREE.Mesh(new THREE.SphereGeometry(1,8,6),hi),r*.16,l*.2,r*.05);h.position.set(-r*.15,l*.1,r*.2);n.add(h);
    const tip=flat(new THREE.Mesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshBasicMaterial({color:'#fff3ee'})),r*.52,l*.16,r*.16);tip.position.set(0,l*.62,0);n.add(tip);parent.add(n)};
  for(let i=0;i<4;i++){
    const [l1,l2,l3]=LEN[i],r=R[i];
    const f1=new THREE.Group();f1.position.set(-.29+i*.195,.5,0);f1.rotation.z=(1.5-i)*.1;g.add(f1);
    f1.add(part(limb(r,r*.88,l1),skin));
    const f2=new THREE.Group();f2.position.y=l1;f1.add(f2);
    f2.add(part(new THREE.SphereGeometry(r*.88,12,10),skin));f2.add(part(limb(r*.88,r*.78,l2),skin));
    const f3=new THREE.Group();f3.position.y=l2;f2.add(f3);
    f3.add(part(new THREE.SphereGeometry(r*.78,12,10),skin));f3.add(part(limb(r*.78,r*.62,l3),skin));
    mkNail(r,l3,f3,l3*.98,r*.55);
    [f2,f3].forEach(j=>{const c=flat(new THREE.Mesh(new THREE.SphereGeometry(1,8,6),crease),r*.62,.012,.012);c.position.set(0,0,r*.9);j.add(c);const c2=c.clone();c2.position.y=.04;c2.scale.x=r*.4;j.add(c2)});
    fingers.push({f1,f2,f3});
  }
  const t0=new THREE.Group();t0.position.set(-side*.34,-.2,.03);t0.rotation.z=side*.95;g.add(t0);
  t0.add(part(limb(.13,.11,.34),skin));
  const t1=new THREE.Group();t1.position.y=.34;t0.add(t1);t1.add(part(new THREE.SphereGeometry(.11,12,10),skin));t1.add(part(limb(.11,.095,.32),skin));
  const t2=new THREE.Group();t2.position.y=.32;t1.add(t2);t2.add(part(new THREE.SphereGeometry(.095,12,10),skin));t2.add(part(limb(.095,.075,.26),skin));
  mkNail(.1,.24,t2,.25,.075);
  g.scale.setScalar(1.12);table.add(g);
  const h={g,fingers,t0:t1,t1:t2,side,ph:Math.random()*6,st:{x:side*3.2,y:-10,z:.6,rz:0,curl:.2,tc:0,pt:0},tg:{x:side*3.2,y:-10,z:.6,rz:0,curl:.2,tc:0,pt:0},rate:5};hands.push(h);return h;
}
const hset=(h,p,rate)=>{if(!h)return;h.tg={...h.tg,...p};if(rate)h.rate=rate};
function updateHand(h,dt,t){
  const a=1-Math.exp(-dt*h.rate);for(const k of HKEYS)h.st[k]+=(h.tg[k]-h.st[k])*a;
  const s=h.st,w=t*1.3+h.ph;
  // a living hand never holds perfectly still: tiny drift and wrist roll
  h.g.position.set(s.x+Math.sin(w*.8)*.025,s.y+Math.cos(w*.6)*.02,s.z);h.g.rotation.z=s.rz+Math.sin(w*.5)*.012;h.g.rotation.y=Math.sin(w*.4)*.04;
  h.fingers.forEach((f,i)=>{
    const lead=1+(i===0?.12:i===3?-.1:0)+(i-1.5)*.02,c=(i===0?s.curl*(1-s.pt*.92):s.curl*(1+s.pt*.75))*lead,sw=Math.sin(w*1.4+i*.9)*.03;
    const rl=(.14+i*.07)*(1-s.pt*(i===0?1:0));f.f1.rotation.x=-(c*.6+rl)+sw;f.f2.rotation.x=-(c*.95+rl*1.4)+sw;f.f3.rotation.x=-(c*.65+rl)+sw*.5});
  h.t0.rotation.x=-s.tc*.55;h.t1.rotation.x=-s.tc*.7;
  h.g.visible=s.y>-9.6||h.tg.y>-9.6;
}

/* --- decor: chips, dust --- */
function chipStack(colors,fx,fy){
  const g=new THREE.Group();
  colors.forEach((c,i)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.1,24),std(c));m.rotation.x=Math.PI/2;m.position.z=.05+i*.105;m.castShadow=true;m.receiveShadow=true;g.add(m);
    const r=new THREE.Mesh(new THREE.TorusGeometry(.32,.022,6,24),std('#fffaf5'));r.position.z=.05+i*.105+.052;g.add(r)});
  g.rotation.z=Math.random()*3;table.add(g);decor.push({g,fx,fy});
}
function placeDecor(){decor.forEach(d=>d.g.position.set(d.fx*viewHW,d.fy*viewHH,0))}

/* --- layout: the reading (top) view --- */
function layoutHomes(n){
  const asp=innerWidth/innerHeight;
  const cols=asp>=1.45?n:asp>=.9?Math.min(n,3):Math.min(n,2),rows=Math.ceil(n/cols);
  const sx=2.55,sy=4.05;
  const halfW=(cols-1)*sx/2+CW/2+.9,halfH=(rows-1)*sy/2+CH/2+(asp<.9?3.3:1.9);
  const z=Math.max(halfW/(T17*asp),halfH/T17,12);
  camBase.set(0,-.1,z);
  viewHW=z*T17*asp;viewHH=z*T17;if(ring)ring.scale.set(2*viewHW*.94/30,2*viewHH*.9/18.7,1);placeDecor();
  return Array.from({length:n},(_,i)=>{const r=Math.floor(i/cols),inRow=Math.min(cols,n-r*cols),c=i-r*cols;
    return{x:(c-(inRow-1)/2)*sx,y:((rows-1)/2-r)*sy+(asp<.9?.9:.15),z:.05+i*.01,rz:(i%2?.025:-.025),s:1,flip:1,tl:0}});
}

/* --- the entry: first-person at the deck, one riffle, then deal one by one --- */
let skipBtn=null,fillers=[];
const rnd=(a,b)=>a+Math.random()*(b-a);
function dropCard(c,to,delay,dur){c.st={x:to.x+rnd(-3,3),y:to.y+rnd(2,6),z:rnd(15,24),rz:rnd(-1.5,1.5),s:1,flip:Math.floor(rnd(0,3))+.5,tl:rnd(-1.3,1.3)};c.tg={...c.st};
  c.fall={t0:performance.now()+delay,dur:dur*1000,from:{...c.st},to:{x:0,y:0,z:0,rz:0,s:1,flip:0,tl:0,...to}};c.g.visible=false;}
function finishIntro(){
  hand.forEach(c=>{c.st={...c.home};c.tg={...c.home}});tiltTg=0;tiltRate=2.2;
  hands.forEach(h=>hset(h,{y:-10,curl:.2,pt:0,tc:0},5));
  fillers.forEach(killCard);fillers=[];hand.forEach(c=>c.fall=null);
  if(skipBtn){skipBtn.remove();skipBtn=null}dealt=true;busy=false;
}
async function intro(){
  const tok=++introTok,gone=()=>tok!==introTok,sl=async ms=>{await sleep(ms);return gone()};
  const homes=layoutHomes(TREE.kids.length),Lh=hands[0],Rh=hands[1];
  hand=TREE.kids.map((k,i)=>{const c=newCard(faceTex(k));c.node=k;c.home=homes[i];place(c,{x:0,y:-2,z:30,rz:.8,s:.4,flip:0});return c});
  tiltTg=TILT0;tiltRate=1.8;dealt=false;
  skipBtn=document.createElement('button');skipBtn.className='chip2';skipBtn.textContent='Skip intro ›';skipBtn.onclick=()=>{introTok++;finishIntro()};$('#chips').append(skipBtn);
  // a shower of cards tumbles onto the table...
  const aces=['heart','spade','diamond','club'].map(k=>plainFace('A',k));
  fillers=Array.from({length:26},(_,i)=>{const c=newCard(aces[i%4]);c.node=null;dropCard(c,{x:rnd(-6,6),y:rnd(-3,3),z:.04+i*.012,rz:rnd(-3,3),flip:Math.random()<.55?1:0},i*85+rnd(0,120),rnd(.9,1.3));return c});
  // ...and our five land in the middle as one stack
  hand.forEach((c,i)=>dropCard(c,{x:0,y:0,z:.5+i*.03,rz:rnd(-.1,.1),flip:0},900+i*160,1.1));
  const landed=[...fillers.map(c=>c.fall.t0+c.fall.dur),...hand.map(c=>c.fall.t0+c.fall.dur)];
  landed.forEach(t=>setTimeout(()=>{if(!gone()&&Math.random()<.45)snd.tick()},Math.max(0,t-performance.now())));
  if(await sl(3300))return;
  // sweep the loose cards away
  fillers.forEach((c,i)=>{c.fall=null;goto(c,{...c.st,y:c.st.y+rnd(-1.2,-.4),z:c.st.z-.1,s:0,rz:c.st.rz+rnd(-.5,.5)},rnd(1.6,2.6))});snd.deal();
  hand.forEach((c,i)=>goto(c,{x:0,y:0,z:.06+i*.03,rz:0,flip:0},5));
  if(await sl(1300))return;
  fillers.forEach(killCard);fillers=[];
  if(await sl(300))return;
  // hands come in and take the deck
  hset(Lh,{x:-1.35,y:-3.1,z:.55,rz:.08,curl:.75,tc:.3},3.2);hset(Rh,{x:1.35,y:-3.1,z:.55,rz:-.08,curl:.75,tc:.3},3.2);
  if(await sl(1000))return;
  // ONE riffle: cut, bend, fall alternately, square
  const n=hand.length,half=Math.ceil(n/2),Lc=hand.slice(0,half),Rc=hand.slice(half),stack=k=>.06+k*.03;
  Lc.forEach((c,i)=>goto(c,{x:-1.9,y:-.1,z:.8+i*.07,rz:.42,tl:.22},6));Rc.forEach((c,i)=>goto(c,{x:1.9,y:-.1,z:.8+i*.07,rz:-.42,tl:.22},6));
  hset(Lh,{x:-2.0,y:-2.95,z:1.3,rz:.42,curl:.85},6);hset(Rh,{x:2.0,y:-2.95,z:1.3,rz:-.42,curl:.85},6);
  snd.deal();if(await sl(650))return;
  Lc.forEach(c=>goto(c,{...c.tg,x:-.62,rz:.2,tl:.36},7));Rc.forEach(c=>goto(c,{...c.tg,x:.62,rz:-.2,tl:.36},7));
  hset(Lh,{x:-.72,y:-2.95,z:1.4,rz:.2},7);hset(Rh,{x:.72,y:-2.95,z:1.4,rz:-.2},7);
  if(await sl(420))return;
  const order=[];for(let i=0;i<half;i++){if(Lc[i])order.push(Lc[i]);if(Rc[i])order.push(Rc[i])}
  snd.riffle(order.length);
  for(let k=0;k<order.length;k++){const c=order[k],hh=Lc.includes(c)?Lh:Rh;
    goto(c,{x:(k%2?.12:-.12),y:(Math.random()-.5)*.12,z:stack(k)+.3,rz:(k%2?-.07:.07),tl:.2},13);
    hset(hh,{tc:1},14);setTimeout(()=>{goto(c,{x:(k%2?.04:-.04),y:0,z:stack(k),rz:(k%2?-.03:.03),tl:0},9);hset(hh,{tc:.3},10)},150);
    if(await sl(100+Math.random()*30))return;}
  if(await sl(260))return;
  hand.forEach((c,k)=>goto(c,{x:0,y:0,z:.2+k*.05,rz:0,tl:.14},8));hset(Lh,{x:-.9,y:-2.3,z:.9,rz:.05,curl:1},8);hset(Rh,{x:.9,y:-2.3,z:.9,rz:-.05,curl:1},8);
  if(await sl(260))return;
  hand.forEach((c,k)=>goto(c,{x:0,y:-.28,z:stack(k),rz:0,tl:0},9));if(await sl(170))return;
  hand.forEach((c,k)=>goto(c,{x:0,y:0,z:stack(k),rz:0,tl:0},9));if(await sl(300))return;
  // left hand steadies the deck, right hand deals one card at a time
  hset(Lh,{x:-1.75,y:-1.5,z:.45,rz:.04,curl:.55,tc:.15},4);
  tiltTg=0;tiltRate=2.4;                                                                          // shuffle done: go to the top view right away, deal from there
  const top=[...hand].sort((a,b)=>b.tg.z-a.tg.z);
  for(let k=0;k<top.length;k++){
    const c=top[k],hm=c.home;
    hset(Rh,{x:1.3,y:-.55,z:.8,rz:-.5,curl:.65,tc:.95,pt:0},8);if(await sl(260))return;       // pinch the top card
    goto(c,{x:hm.x,y:hm.y,z:.55,rz:hm.rz,flip:0,tl:0},5.5);hset(Rh,{x:hm.x+.95,y:hm.y-1.1,z:.95,rz:-.5},5.5);snd.deal();
    if(await sl(560))return;                                                                    // slide it to its place
    goto(c,{...hm,flip:0},8);hset(Rh,{tc:.2,z:1.2},8);                                          // let go
    setTimeout(()=>{if(!gone()){goto(c,hm,3.2);snd.tick()}},140);                               // and turn it face-up
    if(await sl(150))return;
  }
  hands.forEach(h=>hset(h,{y:-10,curl:.2,pt:0,tc:0},3.4));
  if(await sl(500))return;
  if(await sl(600))return;
  finishIntro();
}
function relayout(){const homes=layoutHomes(hand.length);hand.forEach((c,i)=>{c.home=homes[i];if(!c.free&&dealt)goto(c,c.home,6)})}

function tick(now){
  requestAnimationFrame(tick);
  const dt=Math.min(.05,(now-last)/1000||.016);last=now;
  if(!GL)return;
  const t=now/1000;
  tilt+=(tiltTg-tilt)*(1-Math.exp(-dt*tiltRate));table.rotation.x=-tilt;table.position.y=-.5*tilt;
  const zf=.86+.14*(1-tilt/TILT0);
  camera.position.set(camBase.x+mx*.6,camBase.y+my*.4,camBase.z*zf);camera.lookAt(0,-.2,0);
  raycaster.setFromCamera(mouse,camera);
  const prev=hovered;hovered=null;
  if(!busy&&!locked&&dealt&&!$('#veil').classList.contains('on')){
    const h=raycaster.intersectObjects(hand.filter(c=>c.ready).map(c=>c.hit),false)[0];
    if(h)hovered=hand.find(c=>c.hit===h.object);
  }
  if(hovered!==prev){if(hovered)snd.tick();$('#cap').textContent=hovered?hovered.node.title+' — click to play it':(cur.cap||'')}
  document.body.style.cursor=hovered?'pointer':'';
  if(dealt&&hands.length){const Rh=hands[1];
    if(hovered)hset(Rh,{x:hovered.home.x+.3,y:hovered.home.y-CH/2-1.7,z:.5,rz:0,curl:1.15,pt:1,tc:1.1},7);
    else if(Rh.tg.y>-9.6&&!busy)hset(Rh,{y:-10,curl:.2,pt:0,tc:0},4);}
  hands.forEach(h=>updateHand(h,dt,t));
  live.forEach((c,idx)=>{
    if(c.free)return;
    if(c.fall){const f=c.fall,p=clamp((now-f.t0)/f.dur);if(p<=0){c.g.visible=false;return}c.g.visible=true;const e=p*p*(3-2*p*.6),bn=p>.9?Math.sin((p-.9)*31)*.06*(1-p)*10:0;for(const k of KEYS)c.st[k]=f.from[k]+(f.to[k]-f.from[k])*Math.min(e,1);c.st.z+=bn;c.tg={...c.st,z:f.to.z};c.g.position.set(c.st.x,c.st.y,c.st.z);c.g.rotation.z=c.st.rz;c.g.scale.setScalar(c.st.s);c.flip.rotation.set(c.st.tl,Math.PI*(1-c.st.flip),0);if(p>=1)c.fall=null;return}
    const hv=c===hovered;
    const tgt=hv?{...c.home,z:c.home.z+1.5,rz:c.home.rz*.3,s:1.07}:c.tg;
    const a=1-Math.exp(-dt*(hv?9:c.rate));
    for(const k of KEYS)c.st[k]+=((tgt[k]||0)-c.st[k])*a;
    const bob=(c.ready&&!locked&&!hv)?Math.sin(t*1.1+idx*1.4)*.05:0;
    c.g.position.set(c.st.x,c.st.y,c.st.z+bob);c.g.rotation.z=c.st.rz;c.g.scale.setScalar(c.st.s);
    c.tx+=((hv?-mouse.y*.2:0)-c.tx)*.12;c.ty+=((hv?mouse.x*.25:0)-c.ty)*.12;
    c.flip.rotation.set(c.st.tl+c.tx,Math.PI*(1-c.st.flip)+c.ty,0);
    c.go+=((hv?1:0)-c.go)*.12;c.glow.material.opacity=c.go*.7;
    c.ready=dealt&&c.st.flip>.88&&!locked;
  });
  dirLight.position.x=-5+Math.sin(t*.35)*1.6;dirLight.position.y=9+Math.sin(t*.27)*.8;      // the lamp over the table drifts a little
  dust.rotation.z=t*.012;dust.position.y=Math.sin(t*.25)*.4;
  renderer.render(scene,camera);
}
function initGL(){
  try{renderer=new THREE.WebGLRenderer({antialias:true})}catch(e){document.body.classList.add('nogl');return}
  GL=true;document.body.classList.add('felt');
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.setClearColor('#0f2a21');
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
  $('#gl').append(renderer.domElement);
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(34,innerWidth/innerHeight,.1,150);
  backT=backTex();glowT=glowTex();
  table=new THREE.Group();table.rotation.x=-TILT0;scene.add(table);
  const felt=new THREE.Mesh(new THREE.PlaneGeometry(120,80),new THREE.MeshStandardMaterial({map:feltTex(),roughness:1}));felt.receiveShadow=true;table.add(felt);
  ring=new THREE.Mesh(new THREE.PlaneGeometry(30,18.7),new THREE.MeshBasicMaterial({map:ringTex(),transparent:true,depthWrite:false}));ring.position.z=.01;table.add(ring);
  scene.add(new THREE.HemisphereLight('#ffffff','#4f8a70',1.1));
  dirLight=new THREE.DirectionalLight('#fff0d8',1.55);dirLight.position.set(-5,9,16);dirLight.castShadow=true;dirLight.shadow.mapSize.set(2048,2048);
  const sc=dirLight.shadow.camera;sc.left=-22;sc.right=22;sc.top=16;sc.bottom=-16;sc.near=1;sc.far=60;dirLight.shadow.radius=5;dirLight.shadow.bias=-.0004;scene.add(dirLight);
  const N=140,pos=new Float32Array(N*3);for(let i=0;i<N;i++){pos[i*3]=(Math.random()-.5)*22;pos[i*3+1]=(Math.random()-.5)*14;pos[i*3+2]=Math.random()*9}
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  dust=new THREE.Points(pg,new THREE.PointsMaterial({color:'#ffe9a8',size:.06,transparent:true,opacity:.55,depthWrite:false}));scene.add(dust);
  chipStack(['#ef95b0','#ef95b0','#fffaf5','#ef95b0','#fde38a'],-.86,.62);chipStack(['#fde38a','#fde38a','#fffaf5','#fde38a'],.88,.56);
  chipStack(['#cfc2ea','#fffaf5','#cfc2ea','#cfc2ea','#ef95b0','#ef95b0'],.84,-.62);chipStack(['#ef95b0','#fffaf5','#ef95b0'],-.82,-.6);chipStack(['#fde38a','#fffaf5'],-.5,.78);
  
  raycaster=new THREE.Raycaster();
  addEventListener('pointermove',e=>{mouse.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);mx=mouse.x;my=mouse.y});
  renderer.domElement.addEventListener('click',e=>{
    mouse.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);
    if(busy||locked||!dealt||$('#veil').classList.contains('on'))return;raycaster.setFromCamera(mouse,camera);
    const h=raycaster.intersectObjects(hand.filter(c=>c.ready).map(c=>c.hit),false)[0];
    if(h){choose(hand.find(c=>c.hit===h.object).node)}
  });
  addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();relayout()});
}

/* ---------- navigation: play a card, read it, it goes back to the table. no reshuffle. ---------- */
async function choose(n){
  if(busy||locked)return;
  if(n.href){snd.click();window.open(n.href,'_blank','noopener');return}
  const c=hand.find(x=>x.node===n);
  if(!GL||!c||!dealt){if(n.panel)openPanel(n.panel,n.c);return}
  busy=true;locked=c;snd.click();snd.flip();
  hand.forEach(o=>{if(o!==c)goto(o,{...o.home,y:o.home.y-1.2,z:-.2,s:.8,flip:1},3)});
  const wq=c.flip.getWorldQuaternion(new THREE.Quaternion()),wp=c.flip.getWorldPosition(new THREE.Vector3()),ws=c.g.getWorldScale(new THREE.Vector3()).x;
  c.ret={wq:wq.clone(),wp:wp.clone(),ws};
  scene.add(c.g);c.free=true;c.g.position.copy(wp);c.g.quaternion.copy(wq);c.g.scale.setScalar(ws);c.flip.rotation.set(0,0,0);c.glow.material.opacity=.9;
  const p1=new THREE.Vector3(0,.2,5.2),qI=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),qq=new THREE.Quaternion(),sp=new THREE.Quaternion();
  await tw(1.3,e=>{c.g.position.lerpVectors(wp,p1,e);qq.slerpQuaternions(wq,qI,e);sp.setFromAxisAngle(Y,Math.PI*2*e);c.g.quaternion.copy(sp).multiply(qq);c.g.scale.setScalar(ws+(1.15-ws)*e)});
  busy=false;openPanel(n.panel,n.c);
}
async function closeCard(){
  const c=locked;if(!c){return}busy=true;snd.flip();
  const p0=c.g.position.clone(),q0=c.g.quaternion.clone(),s0=c.g.scale.x,{wp,wq,ws}=c.ret;
  hand.forEach(o=>{if(o!==c)goto(o,o.home,4)});
  await tw(.75,e=>{c.g.position.lerpVectors(p0,wp,e);c.g.quaternion.slerpQuaternions(q0,wq,e);c.g.scale.setScalar(s0+(ws-s0)*e)});
  table.add(c.g);c.g.position.set(c.home.x,c.home.y,c.home.z);c.g.rotation.set(0,0,c.home.rz);c.g.scale.setScalar(c.home.s);
  c.free=false;c.st={...c.home};c.tg={...c.home};c.glow.material.opacity=0;locked=null;busy=false;
}
function back(){}
$('#fade').style.transition='opacity .36s ease';

(async()=>{
  try{await Promise.all([document.fonts.load('700 40px "Cormorant Garamond"'),document.fonts.load('800 20px Nunito')])}catch(e){}
  initGL();renderUI();if(GL){requestAnimationFrame(tick);busy=true;intro()}
})();
