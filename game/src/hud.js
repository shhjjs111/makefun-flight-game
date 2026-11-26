// The head-up layer and the post's paper: the surplus reflector sight (speed, altitude, heading
import{clamp}from"./util.js";import{projectPoint}from"./camera.js";const CREAM="#F6EBD2";const AMBER="#E0A33E";const WARN="#D8482F";const INK="#22201B"
;const PAPER="#E8DFC8";const VERMILION="#C2452D";const HUD_FONT='"Consolas", "Courier New", monospace';const SERIF='Georgia, "Times New Roman", serif'
;function mono(ctx,value,x,y,size,color,align="left",weight="700",spacing="0px"){ctx.font=`${weight} ${size}px ${HUD_FONT}`;ctx.fillStyle=color
;ctx.textAlign=align;ctx.textBaseline="alphabetic";ctx.letterSpacing=spacing;ctx.fillText(value,x,y);ctx.letterSpacing="0px"}function glow(ctx,on){
ctx.shadowColor=on?"rgba(246,235,210,0.5)":"rgba(0,0,0,0.85)";ctx.shadowBlur=on?5:3}function compassLetter(heading){const h=(heading%360+360)%360
;if(h<8||h>352)return"N";if(Math.abs(h-90)<8)return"E";if(Math.abs(h-180)<8)return"S";if(Math.abs(h-270)<8)return"W";return null}
export function drawHeadingTape(ctx,readouts,x,y,width){const heading=readouts.heading;ctx.save();glow(ctx,true);ctx.strokeStyle="rgba(246,235,210,0.7)"
;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-width/2,y);ctx.lineTo(x+width/2,y);ctx.stroke();for(let delta=-50;delta<=50;delta+=5){
const value=Math.round((heading+delta)/5)*5;const px=x+(value-heading)/100*width;if(px<x-width/2||px>x+width/2)continue;const major=value%10===0
;ctx.strokeStyle=major?"rgba(246,235,210,0.9)":"rgba(246,235,210,0.38)";ctx.beginPath();ctx.moveTo(px,y);ctx.lineTo(px,y-(major?9:5));ctx.stroke()
;if(value%30===0){const letter=compassLetter(value);const label=letter??String(Math.round((value%360+360)%360/10)*10).padStart(3,"0")
;mono(ctx,label,px,y-15,letter?14:10,letter?CREAM:"rgba(246,235,210,0.72)","center")}}ctx.fillStyle=AMBER;ctx.beginPath();ctx.moveTo(x,y+3);ctx.lineTo(x-5,y+11)
;ctx.lineTo(x+5,y+11);ctx.fill();ctx.restore()}export function drawTargetRing(ctx,camera,target,flight){if(!target)return
;const point=projectPoint(camera,target);if(!point.visible)return;const distance=Math.hypot(target.x-flight.p.x,target.y-flight.p.y,target.z-flight.p.z)
;const fovRad=camera.fov*Math.PI/180;const radiusPx=clamp(target.radius/Math.max(1,point.distance)*(camera.height/2)/Math.tan(fovRad/2),7,160);ctx.save()
;ctx.translate(point.x,point.y);ctx.strokeStyle=target.kind==="drop"?VERMILION:AMBER;ctx.lineWidth=2.2
;ctx.shadowColor=target.kind==="drop"?"rgba(194,69,45,0.85)":"rgba(224,163,62,0.7)";ctx.shadowBlur=10;if(target.kind==="land"){
const size=clamp(radiusPx*.9,12,26);ctx.beginPath();ctx.moveTo(-size,-size*.5);ctx.lineTo(-size,0);ctx.lineTo(-size*.5,0);ctx.moveTo(size,-size*.5)
;ctx.lineTo(size,0);ctx.lineTo(size*.5,0);ctx.moveTo(-size,size*.5);ctx.lineTo(-size,0);ctx.moveTo(size,size*.5);ctx.lineTo(size,0);ctx.stroke()}else{
ctx.beginPath();ctx.arc(0,0,radiusPx,0,Math.PI*2);ctx.stroke();ctx.setLineDash([5,6]);ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,radiusPx*.62,0,Math.PI*2)
;ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(-radiusPx-7,0);ctx.lineTo(-radiusPx+3,0);ctx.moveTo(radiusPx-3,0);ctx.lineTo(radiusPx+7,0)
;ctx.stroke()}ctx.shadowBlur=3;const label=`${target.label} · ${(distance/1e3).toFixed(1)} KM`;mono(ctx,label,0,-radiusPx-10,12,CREAM,"center","700","1px")
;ctx.restore()}export function drawWarnings(ctx,rdo,target,distanceToStrip){const warnings=[];if(rdo.stalled)warnings.push("STALL")
;if(rdo.aglFt<120&&rdo.vsiFpm<-1400)warnings.push("PULL UP");if(rdo.fuelMin<10)warnings.push("FUEL 10 MIN")
;if(target&&target.kind==="land"&&!rdo.gearDown&&rdo.aglFt<500&&distanceToStrip<3e3)warnings.push("GEAR");if(rdo.damage.engine<30)warnings.push("OIL")
;if(warnings.length===0)return;ctx.save();glow(ctx,true);const text=warnings.slice(0,3).join("   ");ctx.font=`700 20px ${HUD_FONT}`;ctx.textAlign="center"
;const width=ctx.measureText(text).width+26;const pulse=.72+Math.sin(performance.now()*.008)*.18;ctx.globalAlpha=pulse;ctx.strokeStyle=WARN;ctx.lineWidth=1.6
;ctx.strokeRect(640-width/2,96,width,32);ctx.fillStyle=WARN;ctx.fillText(text,640,119);ctx.restore()}function drawReticle(ctx,camera,flight){ctx.save()
;glow(ctx,true);ctx.strokeStyle="rgba(246,235,210,0.72)";ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(640,400,9,0,Math.PI*2);ctx.moveTo(640-22,400)
;ctx.lineTo(640-13,400);ctx.moveTo(640+13,400);ctx.lineTo(640+22,400);ctx.moveTo(640,400-22);ctx.lineTo(640,400-13);ctx.stroke()
;const speed=Math.hypot(flight.v.x,flight.v.y,flight.v.z);if(speed>5){const fpm=projectPoint(camera,{x:camera.eye.x+flight.v.x/speed*300,
y:camera.eye.y+flight.v.y/speed*300,z:camera.eye.z+flight.v.z/speed*300});if(fpm.visible){ctx.strokeStyle="rgba(224,163,62,0.85)";ctx.beginPath()
;ctx.arc(fpm.x,fpm.y,5,0,Math.PI*2);ctx.moveTo(fpm.x-11,fpm.y);ctx.lineTo(fpm.x-5,fpm.y);ctx.moveTo(fpm.x+5,fpm.y);ctx.lineTo(fpm.x+11,fpm.y)
;ctx.moveTo(fpm.x,fpm.y-11);ctx.lineTo(fpm.x,fpm.y-5);ctx.stroke()}}ctx.restore()}function drawApproachBars(ctx,flight,target,rdo){
if(!target||target.kind!=="land"||!target.strip)return;const strip=target.strip;const dx=flight.p.x-strip.x;const dz=flight.p.z-strip.z
;const distance=Math.hypot(dx,dz);if(distance>3e3)return;const lateral=clamp(dz/(strip.width/2),-3,3);const glide=clamp((rdo.aglFt-distance*.12)/300,-1,1)
;ctx.save();glow(ctx,true);ctx.strokeStyle="rgba(246,235,210,0.5)";ctx.lineWidth=1;ctx.strokeRect(824,226,12,148);ctx.strokeRect(1e3,226,12,148)
;ctx.strokeStyle=AMBER;ctx.fillStyle=AMBER;const latY=226+74+lateral*46;ctx.fillRect(826,latY-1.5,8,3);const glY=226+74+glide*46;ctx.fillRect(1002,glY-1.5,8,3)
;mono(ctx,"LOC",830,218,9,"rgba(246,235,210,0.65)","center");mono(ctx,"GS",1006,218,9,"rgba(246,235,210,0.65)","center");ctx.restore()}
function drawDust(ctx,camera,particles){if(!particles||particles.length===0)return;ctx.save();for(const particle of particles){if(particle.life<=0)continue
;const point=projectPoint(camera,particle.p);if(!point.visible)continue;const radius=clamp(particle.size*666/Math.max(2,point.distance),3,110)
;const alpha=clamp(particle.life,0,1)*.2;const puff=ctx.createRadialGradient(point.x,point.y,0,point.x,point.y,radius)
;puff.addColorStop(0,`rgba(214,198,164,${alpha})`);puff.addColorStop(.55,`rgba(196,180,146,${alpha*.55})`);puff.addColorStop(1,"rgba(196,180,146,0)")
;ctx.fillStyle=puff;ctx.beginPath();ctx.arc(point.x,point.y,radius,0,Math.PI*2);ctx.fill()}ctx.restore()}function drawRain(ctx,sky,time){if(sky.rain<=.02)return
;ctx.save();ctx.strokeStyle=`rgba(200,218,222,${.12+sky.rain*.18})`;ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<130;i+=1){
const x=(i*137.3+time*420*(.7+i%5*.08))%1400-60;const y=(i*91.7+time*900)%900-50;const length=14+i%7*5;ctx.moveTo(x,y);ctx.lineTo(x-8,y+length)}ctx.stroke()
;ctx.restore()}function drawLightning(ctx,sky){if(sky.flash<.12)return;ctx.save();ctx.globalAlpha=clamp(sky.flash,0,1)
;const bolt=[[742,40],[716,150],[742,170],[700,286],[728,300],[672,430]];ctx.strokeStyle="#F6EBD2";ctx.lineWidth=2.4;ctx.shadowColor="#F6EBD2";ctx.shadowBlur=16
;ctx.beginPath();ctx.moveTo(bolt[0][0],bolt[0][1]);for(let i=1;i<bolt.length;i+=1)ctx.lineTo(bolt[i][0],bolt[i][1]);ctx.stroke();ctx.lineWidth=1.1
;ctx.beginPath();ctx.moveTo(bolt[2][0],bolt[2][1]);ctx.lineTo(770,224);ctx.lineTo(758,252);ctx.moveTo(bolt[3][0],bolt[3][1]);ctx.lineTo(640,372);ctx.stroke()
;ctx.fillStyle="rgba(246,235,210,0.08)";ctx.fillRect(0,0,1280,800);ctx.restore()}function drawCockpitFrame(ctx){ctx.save();ctx.strokeStyle="rgba(30,32,27,0.92)"
;ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(0,120);ctx.quadraticCurveTo(300,4,640,0);ctx.quadraticCurveTo(980,4,1280,120);ctx.stroke();ctx.lineWidth=10
;ctx.beginPath();ctx.moveTo(70,36);ctx.lineTo(210,350);ctx.moveTo(1210,36);ctx.lineTo(1070,350);ctx.stroke();ctx.fillStyle="#C9B98A";ctx.beginPath()
;ctx.moveTo(450,700);ctx.lineTo(520,594);ctx.quadraticCurveTo(640,578,760,594);ctx.lineTo(830,700);ctx.closePath();ctx.fill()
;ctx.fillStyle="rgba(194,69,45,0.92)";ctx.fillRect(528,618,224,7);ctx.fillStyle="rgba(34,32,27,0.9)";ctx.fillRect(516,590,248,7);ctx.fillStyle="#E8DFC8"
;ctx.beginPath();ctx.moveTo(0,690);ctx.lineTo(215,585);ctx.lineTo(215,612);ctx.lineTo(0,730);ctx.fill();ctx.beginPath();ctx.moveTo(1280,690)
;ctx.lineTo(1065,585);ctx.lineTo(1065,612);ctx.lineTo(1280,730);ctx.fill();ctx.restore()}export function drawHud(ctx,flight,rdo,sortie,sky,camera,opts={}){
const target=sortie?sortie.target:opts.target;ctx.clearRect(0,0,1280,800);const vignette=ctx.createRadialGradient(640,380,260,640,380,820)
;vignette.addColorStop(0,"rgba(0,0,0,0)");vignette.addColorStop(1,"rgba(12,10,8,0.38)");ctx.fillStyle=vignette;ctx.fillRect(0,0,1280,800)
;if(opts.cockpit)drawCockpitFrame(ctx);drawDust(ctx,camera,opts.dust);drawRain(ctx,sky,sky.time);drawLightning(ctx,sky);ctx.save();glow(ctx,true)
;ctx.textAlign="left";mono(ctx,"SPD",42,42,10,"rgba(246,235,210,0.65)","left","700","2px")
;mono(ctx,String(Math.round(rdo.speedKt)).padStart(2,"0"),42,78,34,CREAM);mono(ctx,"KT",108,78,12,"rgba(246,235,210,0.72)","left","700","1px")
;mono(ctx,`AO ${rdo.alphaDeg.toFixed(0)}°  ${rdo.gLoad.toFixed(1)} G`,42,96,10,AMBER,"left","600","0.5px");if(sortie){
mono(ctx,`${sortie.mission.code} · ${sortie.mission.name.toUpperCase()}`,42,120,10,AMBER,"left","700","1px");const objective=sortie.objectives[sortie.index]
;if(objective)mono(ctx,objective.label,42,136,10,"rgba(246,235,210,0.85)","left","600","0.5px")}ctx.textAlign="right"
;mono(ctx,"ALT",1238,42,10,"rgba(246,235,210,0.65)","right","700","2px");mono(ctx,Math.round(rdo.altFt).toLocaleString("en-US"),1238,78,34,CREAM,"right")
;mono(ctx,"FT",1238,96,11,"rgba(246,235,210,0.72)","right","700","1px");mono(ctx,`AGL ${Math.round(rdo.aglFt)} FT`,1238,116,11,"rgba(246,235,210,0.85)","right")
;const vsiSign=rdo.vsiFpm>=0?"+":""
;mono(ctx,`VSI ${vsiSign}${Math.round(rdo.vsiFpm)} FPM`,1238,134,11,Math.abs(rdo.vsiFpm)>1200?WARN:"rgba(246,235,210,0.85)","right")
;drawHeadingTape(ctx,rdo,640,58,420);const wind=sky.weather
;mono(ctx,`WIND ${String(wind.from).padStart(3,"0")}/${Math.round(wind.wind)}`,920,42,10,"rgba(246,235,210,0.7)","left","600","0.5px")
;drawWindArrow(ctx,1005,40,wind.from,wind.wind);drawReticle(ctx,camera,flight);drawTargetRing(ctx,camera,target,flight);drawApproachBars(ctx,flight,target,rdo)
;drawWarnings(ctx,rdo,target,target&&target.strip?Math.hypot(flight.p.x-target.strip.x,flight.p.z-target.strip.z):9999)
;if(sortie&&sortie.messageTimer>0&&sortie.message){ctx.save();ctx.textAlign="center";ctx.font=`700 24px ${SERIF}`
;const width=ctx.measureText(sortie.message).width+56;ctx.fillStyle="rgba(34,32,27,0.72)";ctx.fillRect(640-width/2,558,width,42);ctx.strokeStyle=AMBER
;ctx.lineWidth=1;ctx.strokeRect(640-width/2+4,562,width-8,34);ctx.fillStyle=CREAM;ctx.fillText(sortie.message,640,587);ctx.restore()}if(opts.ribbon){ctx.save()
;ctx.textAlign="center";mono(ctx,opts.ribbon,640,604,17,CREAM,"center","700","1px");ctx.strokeStyle="rgba(224,163,62,0.8)";ctx.beginPath();ctx.moveTo(430,612)
;ctx.lineTo(850,612);ctx.stroke();ctx.restore()}ctx.restore()}function drawWindArrow(ctx,x,y,from){ctx.save();ctx.translate(x,y)
;ctx.rotate((from+180)*Math.PI/180);ctx.strokeStyle="rgba(246,235,210,0.8)";ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(0,8);ctx.moveTo(0,8)
;ctx.lineTo(-4,2);ctx.moveTo(0,8);ctx.lineTo(4,2);ctx.stroke();ctx.restore()}function card(ctx,x,y,width,height,rotate=0){ctx.save();ctx.translate(x,y)
;ctx.rotate(rotate);ctx.fillStyle="rgba(0,0,0,0.35)";ctx.fillRect(8,10,width,height);ctx.fillStyle=PAPER;ctx.fillRect(0,0,width,height)
;ctx.strokeStyle="#B9AC8C";ctx.lineWidth=1;ctx.strokeRect(.5,.5,width-1,height-1);ctx.strokeStyle="rgba(34,32,27,0.18)";ctx.strokeRect(10,10,width-20,height-20)
;ctx.restore()}export function drawTitle(ctx,time){ctx.save();const grad=ctx.createLinearGradient(0,0,0,800);grad.addColorStop(0,"rgba(20,24,24,0.42)")
;grad.addColorStop(.55,"rgba(20,24,24,0.08)");grad.addColorStop(1,"rgba(20,24,24,0.55)");ctx.fillStyle=grad;ctx.fillRect(0,0,1280,800);ctx.textAlign="center"
;ctx.font=`700 84px ${SERIF}`;ctx.fillStyle=CREAM;ctx.shadowColor="rgba(0,0,0,0.75)";ctx.shadowBlur=10;ctx.fillText("MONSOON POST",640,260);ctx.shadowBlur=0
;ctx.fillStyle=VERMILION;ctx.fillRect(390,282,500,5);ctx.font=`600 15px ${HUD_FONT}`;ctx.letterSpacing="5px";ctx.fillStyle="#E8DFC8"
;ctx.fillText("THE LAST AIRMAIL INTO THE KHARUN HIGHLANDS",640,314);ctx.letterSpacing="0px";ctx.font=`italic 19px ${SERIF}`;ctx.fillStyle="#F2C9A0"
;ctx.fillText("One aircraft. Six sorties. The pass closes in four months.",640,354);const pulse=.65+Math.sin(time*2.4)*.25;ctx.globalAlpha=pulse
;ctx.font=`700 18px ${HUD_FONT}`;ctx.fillStyle=CREAM;ctx.fillText("PRESS ENTER TO FLY SORTIE 01",640,514);ctx.font=`600 13px ${HUD_FONT}`
;ctx.fillStyle="rgba(246,235,210,0.8)";ctx.fillText("B  ROUTE BOARD      H  HELP      K  MUTE",640,544);ctx.globalAlpha=1;ctx.font=`600 11px ${HUD_FONT}`
;ctx.fillStyle="rgba(246,235,210,0.55)";ctx.fillText("KP-04 · KHARUN POST · 1962",640,748);ctx.restore()}
export function drawBoard(ctx,missions,selected,progress,time){ctx.save();ctx.fillStyle="rgba(18,22,21,0.62)";ctx.fillRect(0,0,1280,800)
;card(ctx,190,84,900,632,-.005);ctx.textAlign="left";ctx.font=`700 36px ${SERIF}`;ctx.fillStyle=INK;ctx.fillText("Kharun Post · route board",232,150)
;ctx.font=`600 12px ${HUD_FONT}`;ctx.fillStyle="#6B604C";ctx.fillText("ONE AIRCRAFT · NO AUTOPILOT · NO RELOAD",232,174);ctx.strokeStyle=VERMILION
;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(232,188);ctx.lineTo(1048,188);ctx.stroke();for(let i=0;i<missions.length;i+=1){const mission=missions[i]
;const y=226+i*68;const chosen=i===selected;if(chosen){ctx.fillStyle="rgba(194,69,45,0.1)";ctx.fillRect(222,y-26,836,58);ctx.fillStyle=VERMILION
;ctx.fillRect(222,y-26,5,58)}ctx.font=`700 11px ${HUD_FONT}`;ctx.fillStyle="#8A7A5C";ctx.fillText(mission.code,246,y-8);ctx.font=`700 20px ${SERIF}`
;ctx.fillStyle=INK;ctx.fillText(mission.name,246,y+14);ctx.font=`600 11px ${HUD_FONT}`;ctx.fillStyle="#5E5442";ctx.fillText(mission.weatherLine,610,y-4)
;ctx.fillText(`PAR ${Math.round(mission.par/60)} MIN · ${Math.round(mission.fuelPct*210)} KG FUEL`,610,y+16);const grade=progress[mission.id]
;ctx.textAlign="right";ctx.font=`700 13px ${HUD_FONT}`;ctx.fillStyle=grade?VERMILION:"#B4A98E";ctx.fillText(grade?`POSTMARK ${grade}`:"UNFLOWN",1042,y+8)
;ctx.textAlign="left"}ctx.font=`600 12px ${HUD_FONT}`;ctx.fillStyle="#6B604C"
;ctx.fillText("↑ ↓  choose sortie      ENTER  read the postcard      ESC  back to title",232,668);const pulse=.6+Math.sin(time*2.6)*.25;ctx.globalAlpha=pulse
;ctx.fillStyle=VERMILION;ctx.font=`700 13px ${HUD_FONT}`;ctx.fillText("THE PASS CLOSES IN FOUR MONTHS",842,96);ctx.globalAlpha=1;ctx.restore()}
export function drawPostcard(ctx,mission,opts={}){ctx.save();ctx.fillStyle="rgba(18,22,21,0.58)";ctx.fillRect(0,0,1280,800);card(ctx,300,96,680,608,.008)
;ctx.fillStyle="rgba(194,69,45,0.92)";ctx.fillRect(838,126,96,116);ctx.strokeStyle=PAPER;ctx.lineWidth=3;ctx.strokeRect(846,134,80,100);ctx.fillStyle=PAPER
;ctx.font=`700 12px ${HUD_FONT}`;ctx.textAlign="center";ctx.fillText("KHARUN",886,172);ctx.fillText("POST",886,190);ctx.font=`700 10px ${HUD_FONT}`
;ctx.fillText("AIR MAIL",886,214);ctx.textAlign="left";ctx.font=`700 38px ${SERIF}`;ctx.fillStyle=INK;ctx.fillText(mission.name,342,168)
;ctx.font=`700 12px ${HUD_FONT}`;ctx.fillStyle=VERMILION;ctx.fillText(mission.code,342,194);ctx.strokeStyle="rgba(34,32,27,0.25)";ctx.lineWidth=1
;ctx.beginPath();ctx.moveTo(342,216);ctx.lineTo(938,216);ctx.stroke();ctx.font=`italic 18px ${SERIF}`;ctx.fillStyle="#3A3428"
;wrapText(ctx,mission.brief,342,252,590,26);ctx.font=`700 11px ${HUD_FONT}`;ctx.fillStyle="#6B604C";ctx.fillText("WEATHER",342,452)
;ctx.fillText("CARGO",342,486);ctx.fillText("FUEL",342,520);ctx.fillText("PAR TIME",342,554);ctx.fillStyle=INK;ctx.font=`600 13px ${HUD_FONT}`
;ctx.fillText(mission.weatherLine,452,452);ctx.fillText(`${mission.cargo} KG · MAIL`,452,486)
;ctx.fillText(`${Math.round(mission.fuelPct*210)} KG · ${Math.round(mission.fuelPct*210/7.3)} MIN`,452,520)
;ctx.fillText(`${Math.round(mission.par/60)} MIN`,452,554);ctx.font=`italic 15px ${SERIF}`;ctx.fillStyle="#5E5442"
;ctx.fillText("“The pass is a promise the mountain keeps only in good weather.”",342,626);if(opts.result)drawResultStamp(ctx,opts.result);else{
const pulse=.65+Math.sin((opts.time??0)*2.7)*.25;ctx.globalAlpha=pulse;ctx.font=`700 16px ${HUD_FONT}`;ctx.fillStyle=VERMILION
;ctx.fillText("ENTER  FLY      ESC  BACK TO BOARD",342,670);ctx.globalAlpha=1}ctx.restore()}function drawResultStamp(ctx,result){ctx.save()
;ctx.translate(886,392);ctx.rotate(-.12);ctx.strokeStyle=result.grade==="NONE"?"#6B604C":VERMILION;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,66,0,Math.PI*2)
;ctx.stroke();ctx.beginPath();ctx.arc(0,0,58,0,Math.PI*2);ctx.stroke();ctx.textAlign="center";ctx.fillStyle=result.grade==="NONE"?"#6B604C":VERMILION
;ctx.font=`700 26px ${SERIF}`;ctx.fillText(result.postmark,0,-4);ctx.font=`700 11px ${HUD_FONT}`;ctx.fillText(`${Math.round(result.total)} PTS`,0,22)
;ctx.restore();ctx.textAlign="left";ctx.font=`700 12px ${HUD_FONT}`;ctx.fillStyle=VERMILION;ctx.fillText("POSTED · KHARUN POST",342,448)
;ctx.font=`600 12px ${HUD_FONT}`;ctx.fillStyle=INK;const lines=result.lines??[];for(let i=0;i<lines.length;i+=1)ctx.fillText(lines[i],342,470+i*21)
;const pulse=.65+Math.sin(performance.now()*.005)*.25;ctx.globalAlpha=pulse;ctx.font=`700 15px ${HUD_FONT}`;ctx.fillStyle=VERMILION
;ctx.fillText("R  RETRY      B  ROUTE BOARD",342,660);ctx.globalAlpha=1}function wrapText(ctx,value,x,y,maxWidth,lineHeight){const words=value.split(" ")
;let line="";let row=0;for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){
ctx.fillText(line,x,y+row*lineHeight);line=word;row+=1}else{line=test}}if(line)ctx.fillText(line,x,y+row*lineHeight)}export function drawPaused(ctx,selected){
ctx.save();ctx.fillStyle="rgba(18,22,21,0.66)";ctx.fillRect(0,0,1280,800);card(ctx,380,150,520,470,0);ctx.textAlign="left";ctx.font=`700 34px ${SERIF}`
;ctx.fillStyle=INK;ctx.fillText("Paused",420,208);ctx.font=`600 12px ${HUD_FONT}`;ctx.fillStyle="#6B604C";ctx.fillText("THE AIRCRAFT WILL WAIT.",420,232)
;const items=["Resume        P","Restart       R","Route board   B","Sensitivity   [ ]","Invert Y      I","Mute          K"];for(let i=0;i<items.length;i+=1){
ctx.font=`600 14px ${HUD_FONT}`;ctx.fillStyle=i===selected?VERMILION:INK;ctx.fillText(items[i],420,286+i*40)}ctx.font=`600 11px ${HUD_FONT}`
;ctx.fillStyle="#6B604C";ctx.fillText("Esc also resumes. The panel flood and view stay as they were.",420,570);ctx.restore()}export function drawHelp(ctx){
ctx.save();ctx.fillStyle="rgba(18,22,21,0.72)";ctx.fillRect(0,0,1280,800);card(ctx,220,80,840,640,0);ctx.textAlign="left";ctx.font=`700 30px ${SERIF}`
;ctx.fillStyle=INK;ctx.fillText("How to fly KP-04",262,136);ctx.font=`600 11px ${HUD_FONT}`;ctx.fillStyle="#6B604C"
;ctx.fillText("THE STICK IS THE AIRCRAFT. THE THROTTLE IS THE ENERGY. THE RIDGE IS THE CLOCK.",262,162)
;const rows=[["Mouse / arrows","virtual stick: pitch and roll"],["W / S","throttle up / down, wheel also"],["A / D","rudder, crosswind and ground steering"],["F","flaps up, 10, 20, 35 degrees"],["G","landing gear"],["B","brakes on the ground"],["Space","drop the mail sack"],["M","lean the mixture: less fuel, less power"],["C","chase / cockpit view"],["L","panel flood"],["P / H","pause / this card"],["K","mute"]]
;for(let i=0;i<rows.length;i+=1){const col=i<6?0:1;const row=i%6;const x=262+col*400;const y=216+row*58;ctx.font=`700 13px ${HUD_FONT}`;ctx.fillStyle=VERMILION
;ctx.fillText(rows[i][0],x,y);ctx.font=`600 12px ${HUD_FONT}`;ctx.fillStyle=INK;ctx.fillText(rows[i][1],x,y+20)}ctx.font=`italic 16px ${SERIF}`
;ctx.fillStyle="#3A3428";ctx.fillText("Speed is life: keep 50 to 60 kt on approach and never hold a bank you cannot afford.",262,640)
;ctx.font=`700 13px ${HUD_FONT}`;ctx.fillStyle=VERMILION;ctx.fillText("ANY KEY  BACK TO THE COCKPIT",262,686);ctx.restore()}
export{CREAM,AMBER,WARN,PAPER,VERMILION,INK};