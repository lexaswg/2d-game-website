const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const startButton = document.getElementById('startButton');
const keys = {};
const W = canvas.width, H = canvas.height;
const world = { width: 3300, floor: 465 };
const player = { x:120, y:390, w:28, h:58, vx:0, vy:0, speed:235, jump:485, grounded:false, facing:1, attack:0, invincible:0 };
let running=false, score=0, lives=5, camera=0, last=0;
let enemies=[], motes=[], particles=[], platforms=[];

function buildWorld() {
  platforms = [
    {x:0,y:465,w:700,h:75},{x:820,y:465,w:620,h:75},{x:1540,y:465,w:780,h:75},{x:2460,y:465,w:840,h:75},
    {x:300,y:375,w:180,h:22},{x:610,y:315,w:190,h:22},{x:930,y:370,w:180,h:22},{x:1210,y:300,w:220,h:22},
    {x:1500,y:380,w:175,h:22},{x:1780,y:325,w:190,h:22},{x:2110,y:265,w:200,h:22},{x:2380,y:370,w:180,h:22},
    {x:2650,y:315,w:180,h:22},{x:2940,y:250,w:210,h:22}
  ];
  motes = Array.from({length:42}, (_,i)=>({x:80+Math.random()*3150,y:80+Math.random()*330,r:1+Math.random()*3,phase:i}));
  enemies = [
    {x:540,y:420,w:32,h:34,vx:42,alive:true}, {x:1030,y:420,w:32,h:34,vx:-38,alive:true},
    {x:1660,y:420,w:32,h:34,vx:45,alive:true}, {x:2010,y:420,w:32,h:34,vx:-40,alive:true},
    {x:2740,y:420,w:32,h:34,vx:42,alive:true}, {x:3060,y:205,w:32,h:34,vx:-32,alive:true}
  ];
}
function reset() { score=0; lives=5; camera=0; player.x=120; player.y=390; player.vx=0; player.vy=0; player.attack=0; player.invincible=0; buildWorld(); updateHud(); running=true; overlay.classList.remove('visible'); }
function updateHud(){ scoreEl.textContent=score; livesEl.textContent=lives; }
function hitbox(a){ return {x:a.x,y:a.y,w:a.w,h:a.h}; }
function overlaps(a,b){ return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
function hurt(){ if(player.invincible>0)return; lives--; player.invincible=1.2; player.vy=-270; updateHud(); if(lives<=0) endGame('The hollow claims you'); }
function attack(){ if(running && player.attack<=0) player.attack=.28; }
function update(dt) {
  if(!running)return;
  const left=keys.a||keys.A, right=keys.d||keys.D;
  player.vx=(right-left)*player.speed; if(player.vx) player.facing=player.vx>0?1:-1;
  if((keys.w||keys.W) && player.grounded){ player.vy=-player.jump; player.grounded=false; keys.w=keys.W=false; }
  player.vy += 1200*dt; player.x += player.vx*dt; player.y += player.vy*dt; player.grounded=false;
  for(const p of platforms){ if(player.x+player.w>p.x&&player.x<p.x+p.w&&player.y+player.h>=p.y&&player.y+player.h<=p.y+Math.max(24,player.vy*dt+25)&&player.vy>=0){player.y=p.y-player.h;player.vy=0;player.grounded=true;} }
  player.x=Math.max(0,Math.min(world.width-player.w,player.x)); if(player.y>H+100){hurt();player.x=Math.max(80,player.x-160);player.y=300;}
  if(player.attack>0)player.attack-=dt; if(player.invincible>0)player.invincible-=dt;
  for(const e of enemies){ if(!e.alive)continue; e.x+=e.vx*dt; const floor=platforms.find(p=>e.x+e.w>p.x&&e.x<p.x+p.w&&Math.abs(p.y-(e.y+e.h))<4); if(!floor||e.x<floor.x||e.x+e.w>floor.x+floor.w)e.vx*=-1; if(overlaps(hitbox(player),hitbox(e))){ if(player.attack>0&&((player.facing>0&&e.x>player.x)||(player.facing<0&&e.x<player.x))){e.alive=false;score+=25;updateHud(); burst(e.x,e.y,'#d6ad63');}else hurt(); } }
  if(player.attack>0) for(const e of enemies) if(e.alive&&Math.abs(e.y-player.y)<55&&((player.facing>0&&e.x>player.x-5&&e.x<player.x+75)||(player.facing<0&&e.x<player.x+player.w+5&&e.x>player.x-75))){e.alive=false;score+=25;updateHud();burst(e.x,e.y,'#d6ad63');}
  for(const q of particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=500*dt;q.life-=dt;} particles=particles.filter(q=>q.life>0);
  camera += ((player.x-W*.38)-camera)*Math.min(1,dt*5); camera=Math.max(0,Math.min(world.width-W,camera));
}
function burst(x,y,color){for(let i=0;i<12;i++)particles.push({x,y,vx:(Math.random()-.5)*180,vy:-Math.random()*180,life:.5,color});}
function draw() {
  ctx.clearRect(0,0,W,H); ctx.save(); ctx.translate(-camera,0); drawScene(); ctx.restore();
}
function drawScene(){
  const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#182d3a');grad.addColorStop(.55,'#101d29');grad.addColorStop(1,'#080d14');ctx.fillStyle=grad;ctx.fillRect(camera,0,W,H);
  ctx.fillStyle='#243b45'; for(let x=0;x<world.width;x+=180){ctx.beginPath();ctx.moveTo(x,465);ctx.lineTo(x+85,110+(x%290));ctx.lineTo(x+190,465);ctx.fill();}
  for(const m of motes){ctx.globalAlpha=.25+.2*Math.sin(performance.now()/900+m.phase);ctx.fillStyle='#c9e1d2';ctx.beginPath();ctx.arc(m.x,m.y,m.r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  for(const p of platforms){ctx.fillStyle='#0b1219';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle='#40535a';ctx.fillRect(p.x,p.y,p.w,5);ctx.fillStyle='#18262e';for(let x=p.x+15;x<p.x+p.w;x+=37){ctx.fillRect(x,p.y+15,3,p.h-15);}}
  ctx.fillStyle='#7d8580';ctx.beginPath();ctx.arc(140,105,42,0,Math.PI*2);ctx.fill();ctx.fillStyle='#172733';ctx.beginPath();ctx.arc(130,100,42,0,Math.PI*2);ctx.fill();
  for(const e of enemies)if(e.alive)drawEnemy(e); drawPlayer(); for(const q of particles){ctx.globalAlpha=Math.max(0,q.life*2);ctx.fillStyle=q.color;ctx.fillRect(q.x,q.y,4,4);}ctx.globalAlpha=1;
}
function drawEnemy(e){ctx.fillStyle='#5f7775';ctx.beginPath();ctx.arc(e.x+16,e.y+15,17,Math.PI,0);ctx.fill();ctx.fillRect(e.x,e.y+15,e.w,e.h-15);ctx.fillStyle='#d6ad63';ctx.fillRect(e.x+8,e.y+15,4,4);ctx.fillRect(e.x+21,e.y+15,4,4);ctx.strokeStyle='#304449';ctx.strokeRect(e.x+4,e.y+27,6,8);ctx.strokeRect(e.x+22,e.y+27,6,8);}
function drawPlayer(){if(player.invincible>0&&Math.floor(player.invincible*12)%2===0)return;const x=player.x,y=player.y;ctx.save();ctx.translate(x+player.w/2,y);ctx.fillStyle='#e8e9dd';ctx.beginPath();ctx.arc(14,15,17,Math.PI,0);ctx.lineTo(29,45);ctx.lineTo(0,45);ctx.closePath();ctx.fill();ctx.fillStyle='#101923';ctx.beginPath();ctx.arc(8,17,3,0,Math.PI*2);ctx.arc(21,17,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#aabfc0';ctx.beginPath();ctx.moveTo(3,3);ctx.lineTo(-10,-13);ctx.lineTo(2,-8);ctx.moveTo(25,3);ctx.lineTo(38,-13);ctx.lineTo(27,-8);ctx.fill();ctx.strokeStyle='#b9c8bd';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,43);ctx.lineTo(0,57);ctx.moveTo(28,43);ctx.lineTo(28,57);ctx.stroke();if(player.attack>0){ctx.strokeStyle='#d6ad63';ctx.lineWidth=4;ctx.beginPath();ctx.arc(15,35,42,player.facing>0?-1.1:2.1,player.facing>0?1.1:4.2);ctx.stroke();}ctx.restore();}
function endGame(message){running=false;overlay.innerHTML=`<p class="eyebrow">${message}</p><h1>Moonveil Hollow</h1><p>Echoes gathered: <b>${score}</b></p><button id="startButton">Return to the Hollow</button>`;overlay.classList.add('visible');document.getElementById('startButton').onclick=reset;}
window.addEventListener('keydown',e=>{keys[e.key]=true;keys[e.code]=true;if(e.code==='Space'||e.key==='j'||e.key==='J'){e.preventDefault();attack();}});
window.addEventListener('keyup',e=>{keys[e.key]=false;keys[e.code]=false;});
startButton.onclick=reset;buildWorld();function loop(t){const dt=Math.min((t-last)/1000||.016,.033);last=t;update(dt);draw();requestAnimationFrame(loop);}requestAnimationFrame(loop);
