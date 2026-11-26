// The KP-04's panel, drawn as an instrument board rather than a UI: brass bezels, ivory faces with
import{clamp}from"./util.js";const PANEL_TOP=632;const PANEL_HEIGHT=168;const IVORY="#E8DFC8";const IVORY_DIM="#C9BE9F";const INK="#2A2620"
;const BRASS="#B08A3E";const BRASS_DARK="#6E5524";const PANEL="#2E3430";const LAMP_GREEN="#6FA36A";const LAMP_AMBER="#E0A33E";const LAMP_RED="#D8482F"
;const FONT_LABEL='600 9px "Consolas", "Courier New", monospace';const FONT_SMALL='600 8px "Consolas", "Courier New", monospace';function circle(ctx,x,y,r){
ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2)}function text(ctx,value,x,y,font,color,align="center",baseline="middle"){ctx.font=font;ctx.fillStyle=color
;ctx.textAlign=align;ctx.textBaseline=baseline;ctx.fillText(value,x,y)}export function createInstruments(){return{lags:{},time:0,fuelSamples:[]}}
export function needleLag(lags,key,target,seconds,dt){const current=lags[key]??target;const next=current+(target-current)*clamp(dt/Math.max(.001,seconds),0,1)
;lags[key]=next;return next}function bezel(ctx,cx,cy,r){const grad=ctx.createRadialGradient(cx-r*.3,cy-r*.35,r*.2,cx,cy,r);grad.addColorStop(0,"#D8B96A")
;grad.addColorStop(.55,BRASS);grad.addColorStop(1,BRASS_DARK);ctx.fillStyle=grad;circle(ctx,cx,cy,r);ctx.fill();ctx.strokeStyle="#3A2E16";ctx.lineWidth=1.5
;ctx.stroke();const face=ctx.createRadialGradient(cx-r*.25,cy-r*.3,r*.1,cx,cy,r*.9);face.addColorStop(0,"#F2EAD6");face.addColorStop(.7,IVORY)
;face.addColorStop(1,IVORY_DIM);ctx.fillStyle=face;circle(ctx,cx,cy,r*.83);ctx.fill();ctx.strokeStyle="rgba(42,38,32,0.5)";ctx.lineWidth=1;ctx.stroke()}
function needle(ctx,cx,cy,angle,length,width=2.2,color=INK){ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);ctx.strokeStyle="rgba(0,0,0,0.28)"
;ctx.lineWidth=width+1.4;ctx.beginPath();ctx.moveTo(0,2);ctx.lineTo(length,2);ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath()
;ctx.moveTo(-6,0);ctx.lineTo(length,0);ctx.stroke();ctx.strokeStyle="#D8482F";ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(length*.72,0);ctx.lineTo(length,0)
;ctx.stroke();ctx.restore();ctx.fillStyle=BRASS;circle(ctx,cx,cy,3.4);ctx.fill();ctx.fillStyle="#3A2E16";circle(ctx,cx,cy,1.5);ctx.fill()}
function glass(ctx,cx,cy,r){ctx.save();ctx.globalAlpha=.34;ctx.strokeStyle="#FFFFFF";ctx.lineWidth=r*.08;ctx.beginPath();ctx.arc(cx,cy,r*.72,-2.35,-1.55)
;ctx.stroke();ctx.globalAlpha=.12;ctx.fillStyle="#FFFFFF";ctx.beginPath();ctx.moveTo(cx-r*.5,cy-r*.75);ctx.lineTo(cx+r*.1,cy-r*.8);ctx.lineTo(cx-r*.55,cy+r*.4)
;ctx.closePath();ctx.fill();ctx.restore()}function arcs(ctx,cx,cy,r,from,to,valueFrom,valueTo,color,width){ctx.strokeStyle=color;ctx.lineWidth=width
;ctx.beginPath();ctx.arc(cx,cy,r,from+(to-from)*valueFrom,from+(to-from)*valueTo);ctx.stroke()}
function ticks(ctx,cx,cy,r,count,start,sweep,majorEvery,labels,labelRadius,font=FONT_SMALL){for(let i=0;i<=count;i+=1){const t=i/count;const angle=start+sweep*t
;const major=i%majorEvery===0;ctx.strokeStyle=INK;ctx.lineWidth=major?1.6:.8;ctx.beginPath()
;ctx.moveTo(cx+Math.cos(angle)*(r-(major?7:4)),cy+Math.sin(angle)*(r-(major?7:4)));ctx.lineTo(cx+Math.cos(angle)*r,cy+Math.sin(angle)*r);ctx.stroke()
;if(major&&labels){const value=labels(i,count);if(value!==null){text(ctx,value,cx+Math.cos(angle)*labelRadius,cy+Math.sin(angle)*labelRadius,font,INK)}}}}
function lamp(ctx,x,y,label,on,color=LAMP_RED){ctx.fillStyle="#191D1A";circle(ctx,x,y,7.5);ctx.fill();ctx.strokeStyle="#4B4F49";ctx.lineWidth=1;ctx.stroke()
;if(on){ctx.save();ctx.shadowColor=color;ctx.shadowBlur=9;ctx.fillStyle=color;circle(ctx,x,y,5.4);ctx.fill();ctx.restore()}else{ctx.fillStyle="#333A34"
;circle(ctx,x,y,5.2);ctx.fill()}text(ctx,label,x,y+13,'600 7px "Consolas", monospace',on?"#F0E7CF":"#8A9188")}function asi(ctx,cx,cy,r,rdo){bezel(ctx,cx,cy,r)
;const start=Math.PI*.75;const sweep=Math.PI*1.5;arcs(ctx,cx,cy,r*.78,start,start+sweep,40/200,85/200,"#F2EAD6",6)
;arcs(ctx,cx,cy,r*.78,start,start+sweep,45/200,120/200,"#6FA36A",4);arcs(ctx,cx,cy,r*.78,start,start+sweep,120/200,160/200,"#D6B24A",4)
;arcs(ctx,cx,cy,r*.78,start,start+sweep,178/200,180/200,"#D8482F",3);ticks(ctx,cx,cy,r*.69,20,start,sweep,2,i=>String(i*10),r*.55)
;text(ctx,"AIRSPEED",cx,cy+r*.36,FONT_LABEL,INK);text(ctx,"KT",cx,cy+r*.52,FONT_SMALL,INK);const angle=start+sweep*clamp(rdo.speedKt/200,0,1)
;needle(ctx,cx,cy,angle,r*.68);glass(ctx,cx,cy,r)}function horizon(ctx,cx,cy,r,rdo){bezel(ctx,cx,cy,r);ctx.save();circle(ctx,cx,cy,r*.72);ctx.clip()
;const pitch=clamp(rdo.pitchDeg,-30,30)*(r/40);const roll=rdo.bankDeg*Math.PI/180;ctx.translate(cx,cy+pitch);ctx.rotate(roll);ctx.fillStyle="#7D99A4"
;ctx.fillRect(-r,-r*2,r*2,r*2);ctx.fillStyle="#8A6644";ctx.fillRect(-r,0,r*2,r*2);ctx.strokeStyle="#F2EAD6";ctx.lineWidth=1.4;ctx.beginPath()
;ctx.moveTo(-r*.9,0);ctx.lineTo(r*.9,0);ctx.stroke();ctx.lineWidth=.8;for(let i=-2;i<=2;i+=1){if(i===0)continue;ctx.beginPath();ctx.moveTo(-r*.22,i*10)
;ctx.lineTo(r*.22,i*10);ctx.stroke()}ctx.restore();ctx.strokeStyle="#F2EAD6";ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r*.66,Math.PI*1.1,Math.PI*1.9)
;ctx.stroke();ctx.fillStyle="#F2EAD6";ctx.beginPath();ctx.moveTo(cx,cy-r*.62);ctx.lineTo(cx-3,cy-r*.52);ctx.lineTo(cx+3,cy-r*.52);ctx.fill()
;ctx.strokeStyle="#E8DFC8";ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(cx,cy+r*.55,r*.28,.25,Math.PI-.25);ctx.stroke();const ball=clamp(-rdo.bankDeg/20,-1,1)*r*.2
;ctx.fillStyle=INK;circle(ctx,cx+ball,cy+r*.55+r*.12,2.8);ctx.fill();text(ctx,"HORIZON",cx,cy+r*.46,FONT_LABEL,"#D9CFB2");glass(ctx,cx,cy,r)}
function altimeter(ctx,cx,cy,r,rdo){bezel(ctx,cx,cy,r);ticks(ctx,cx,cy,r*.7,50,Math.PI*.75,Math.PI*1.5,5,i=>String(i),r*.55)
;text(ctx,"ALT",cx,cy-r*.35,FONT_LABEL,INK);text(ctx,"100 FT",cx,cy-r*.52,FONT_SMALL,INK);const alt=rdo.altFt
;needle(ctx,cx,cy,Math.PI*.75+Math.PI*1.5*(alt%1e3/1e3),r*.66,2.2);needle(ctx,cx,cy,Math.PI*.75+Math.PI*1.5*(alt%1e4/1e4),r*.48,3)
;needle(ctx,cx,cy,Math.PI*.75+Math.PI*1.5*(alt%1e5/1e5),r*.3,3.6);ctx.fillStyle="#1E211D";ctx.fillRect(cx-15,cy+r*.22,30,12)
;text(ctx,String(Math.round(alt)),cx,cy+r*.25,'700 9px "Consolas", monospace',"#E8DFC8");glass(ctx,cx,cy,r)}function vsi(ctx,cx,cy,r,rdo){bezel(ctx,cx,cy,r)
;const start=Math.PI*.75;const sweep=Math.PI*1.5;ticks(ctx,cx,cy,r*.7,8,start,sweep,2,i=>i===4?"0":String(Math.abs(i-4)*5),r*.5)
;text(ctx,"VERT",cx,cy-r*.34,FONT_LABEL,INK);text(ctx,"100 FT/MIN",cx,cy-r*.5,FONT_SMALL,INK);const angle=start+sweep*clamp(.5+rdo.vsiFpm/4e3,0,1)
;needle(ctx,cx,cy,angle,r*.64);glass(ctx,cx,cy,r)}function heading(ctx,cx,cy,r,rdo){bezel(ctx,cx,cy,r);ctx.save();circle(ctx,cx,cy,r*.7);ctx.clip()
;ctx.translate(cx,cy);ctx.rotate(-rdo.heading*Math.PI/180);for(let d=0;d<360;d+=10){const a=d*Math.PI/180-Math.PI/2;const major=d%30===0;ctx.strokeStyle=INK
;ctx.lineWidth=major?1.4:.7;ctx.beginPath();ctx.moveTo(Math.cos(a)*(r*.62),Math.sin(a)*(r*.62));ctx.lineTo(Math.cos(a)*(r*.7),Math.sin(a)*(r*.7));ctx.stroke()
;if(d%90===0){const label=["N","E","S","W"][d/90];text(ctx,label,Math.cos(a)*r*.46,Math.sin(a)*r*.46,'700 13px "Consolas", monospace',INK)}}ctx.restore()
;ctx.fillStyle="#D8482F";ctx.beginPath();ctx.moveTo(cx,cy-r*.72);ctx.lineTo(cx-4,cy-r*.82);ctx.lineTo(cx+4,cy-r*.82);ctx.fill()
;text(ctx,"HDG",cx,cy+r*.36,FONT_LABEL,INK);text(ctx,`${Math.round(rdo.heading).toString().padStart(3,"0")}°`,cx,cy+r*.55,'700 10px "Consolas", monospace',INK)
;glass(ctx,cx,cy,r)}function turn(ctx,cx,cy,r,rdo){bezel(ctx,cx,cy,r);ctx.save();ctx.translate(cx,cy);ctx.rotate(rdo.bankDeg*Math.PI/180);ctx.strokeStyle=INK
;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-r*.38,0);ctx.lineTo(r*.38,0);ctx.stroke();ctx.fillStyle=INK;ctx.beginPath();ctx.moveTo(r*.38,0)
;ctx.lineTo(r*.22,-4);ctx.lineTo(r*.22,4);ctx.fill();ctx.restore();ctx.strokeStyle=INK;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-r*.55,cy+r*.24)
;ctx.lineTo(cx+r*.55,cy+r*.24);ctx.stroke();const ball=clamp(-rdo.bankDeg/20,-1,1)*r*.36;ctx.fillStyle=INK;circle(ctx,cx+ball,cy+r*.24,3.2);ctx.fill()
;text(ctx,"TURN",cx,cy+r*.55,FONT_LABEL,INK);glass(ctx,cx,cy,r)}function roundGauge(ctx,cx,cy,r,rdo,spec){bezel(ctx,cx,cy,r)
;ticks(ctx,cx,cy,r*.68,spec.count,Math.PI*.75,Math.PI*1.5,spec.major,spec.labels,r*.46);text(ctx,spec.label,cx,cy-r*.28,FONT_LABEL,INK)
;const angle=Math.PI*.75+Math.PI*1.5*clamp((spec.value-spec.min)/(spec.max-spec.min),0,1);needle(ctx,cx,cy,angle,r*.6,2)
;if(spec.readout)text(ctx,spec.readout,cx,cy+r*.5,'700 10px "Consolas", monospace',INK);glass(ctx,cx,cy,r)}function fuelGauge(ctx,cx,cy,r,rdo){
bezel(ctx,cx,cy,r);arcs(ctx,cx,cy,r*.78,Math.PI*.75,Math.PI*.75+Math.PI*1.5*.2,"#D8482F",5)
;ticks(ctx,cx,cy,r*.68,12,Math.PI*.75,Math.PI*1.5,2,i=>String(i*20),r*.47);text(ctx,"FUEL",cx,cy-r*.32,FONT_LABEL,INK)
;const angle=Math.PI*.75+Math.PI*1.5*clamp(rdo.fuelKg/240,0,1);needle(ctx,cx,cy,angle,r*.62)
;text(ctx,`${Math.round(rdo.fuelKg)} KG`,cx,cy+r*.36,'700 10px "Consolas", monospace',INK)
;text(ctx,`${Math.round(rdo.fuelPct)}% · ${Math.round(rdo.fuelMin)} MIN`,cx,cy+r*.56,'700 9px "Consolas", monospace',rdo.fuelMin<12?"#B23A24":INK)
;glass(ctx,cx,cy,r)}function clock(ctx,cx,cy,r,flight){bezel(ctx,cx,cy,r);const minutes=7*60+12+Math.floor(flight.time/60)
;const hourAngle=minutes/60%12*(Math.PI/6)-Math.PI/2;const minuteAngle=minutes%60*(Math.PI/30)-Math.PI/2;ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath()
;ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(hourAngle)*r*.34,cy+Math.sin(hourAngle)*r*.34);ctx.stroke();ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(cx,cy)
;ctx.lineTo(cx+Math.cos(minuteAngle)*r*.5,cy+Math.sin(minuteAngle)*r*.5);ctx.stroke();text(ctx,"CLOCK",cx,cy+r*.55,FONT_LABEL,INK)}
function damageSchematic(ctx,cx,cy,damage){
const zones=[["leftWing",-17,-4,20,7],["rightWing",17,-4,20,7],["tail",0,22,12,8],["engine",0,-22,9,10],["gear",0,3,7,16],["tank",0,-9,9,8]]
;ctx.fillStyle="#232824";ctx.fillRect(cx-42,cy-36,84,72);ctx.strokeStyle="#6B5E3E";ctx.lineWidth=1;ctx.strokeRect(cx-42,cy-36,84,72)
;text(ctx,"AIRFRAME",cx,cy-43,FONT_LABEL,"#D9CFB2");for(const[zone,x,y,w,h]of zones){const value=damage[zone]??100
;const color=value>60?"#5E8A5A":value>30?"#D6A33E":"#C0452D";ctx.fillStyle=color;ctx.globalAlpha=.75;ctx.fillRect(cx+x-w/2,cy+y-h/2,w,h);ctx.globalAlpha=1}
ctx.strokeStyle="#E8DFC8";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(cx,cy-30);ctx.lineTo(cx,cy+30);ctx.stroke()}function panelNoise(ctx){ctx.fillStyle=PANEL
;ctx.fillRect(0,PANEL_TOP,1280,PANEL_HEIGHT);const grad=ctx.createLinearGradient(0,PANEL_TOP,0,800);grad.addColorStop(0,"rgba(255,255,255,0.045)")
;grad.addColorStop(.3,"rgba(0,0,0,0)");grad.addColorStop(1,"rgba(0,0,0,0.35)");ctx.fillStyle=grad;ctx.fillRect(0,PANEL_TOP,1280,PANEL_HEIGHT)
;ctx.strokeStyle="#0E120F";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,PANEL_TOP+1.5);ctx.lineTo(1280,PANEL_TOP+1.5);ctx.stroke()
;ctx.strokeStyle="rgba(255,255,255,0.08)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,PANEL_TOP+4);ctx.lineTo(1280,PANEL_TOP+4);ctx.stroke()
;for(let x=18;x<1280;x+=46){ctx.fillStyle="rgba(0,0,0,0.25)";circle(ctx,x,PANEL_TOP+12,1.6);ctx.fill();ctx.fillStyle="rgba(255,255,255,0.14)"
;circle(ctx,x-.6,PANEL_TOP+11.4,.7);ctx.fill()}ctx.strokeStyle="rgba(0,0,0,0.3)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,692);ctx.lineTo(1280,692)
;ctx.stroke()}export function drawPanel(ctx,flight,rdo,inst,dt,opts={}){inst.time+=dt;panelNoise(ctx);const mainY=706;const mainR=42
;const lag=(key,target,seconds)=>needleLag(inst.lags,key,target,seconds,dt);const smoothed={...rdo,speedKt:lag("asi",rdo.speedKt,.25),
altFt:lag("alt",rdo.altFt,.12),vsiFpm:lag("vsi",rdo.vsiFpm,.4),heading:lag("hdg",rdo.heading,.12),fuelKg:lag("fuel",rdo.fuelKg,.3),
fuelMin:lag("fuelMin",rdo.fuelMin,.3),bankDeg:lag("bank",rdo.bankDeg,.12),pitchDeg:lag("pitch",rdo.pitchDeg,.12),rpm:lag("rpm",rdo.rpm,.15)}
;const jitter=Math.sin(inst.time*31)*(rdo.rpm/3e3)*.5+Math.sin(inst.time*17)*(rdo.stalled?2:.3);asi(ctx,72,mainY,mainR,{...smoothed,
speedKt:smoothed.speedKt+jitter});horizon(ctx,180,mainY,mainR,smoothed);altimeter(ctx,288,mainY,mainR,smoothed);vsi(ctx,396,mainY,mainR,smoothed)
;heading(ctx,504,mainY,mainR,smoothed);turn(ctx,612,mainY,mainR,smoothed);fuelGauge(ctx,728,mainY,40,smoothed);roundGauge(ctx,826,mainY,32,smoothed,{
label:"RPM",min:0,max:3e3,value:smoothed.rpm,count:12,major:2,labels:i=>i%4===0?String(i*250):null,readout:`x100`});roundGauge(ctx,900,mainY,30,smoothed,{
label:"OIL PRESS",min:0,max:100,value:rdo.oilPressure,count:10,major:2,labels:i=>i%4===0?String(i*10):null})
;if(rdo.oilLow)text(ctx,"OIL PRESS",900,mainY-40,'700 8px "Consolas", monospace',LAMP_RED);roundGauge(ctx,970,mainY,30,smoothed,{label:"OIL TEMP",min:40,
max:140,value:rdo.oilTemp,count:10,major:2,labels:i=>i%4===0?String(40+i*10):null,readout:"°C"});clock(ctx,1040,mainY,28,flight)
;text(ctx,"OAT",1100,mainY-24,FONT_LABEL,"#D9CFB2");text(ctx,`${Math.round(-8+flight.p.y*.004)}°C`,1100,mainY-8,'700 14px "Consolas", monospace',"#E8DFC8")
;text(ctx,"PAX",1100,mainY+12,FONT_LABEL,"#D9CFB2");text(ctx,"0",1100,mainY+26,'700 14px "Consolas", monospace',"#E8DFC8")
;damageSchematic(ctx,1178,mainY-4,rdo.damage);const hurt=Object.entries(rdo.damage).filter(([,value])=>value<60).sort((a,b)=>a[1]-b[1])[0];if(hurt){
const label=hurt[0]==="leftWing"?"L WING":hurt[0]==="rightWing"?"R WING":hurt[0].toUpperCase()
;text(ctx,`${label} ${Math.round(hurt[1])}%`,1178,780,'700 9px "Consolas", monospace',LAMP_RED)}const lampY=648
;lamp(ctx,46,lampY,"STALL",rdo.stalled||rdo.alphaDeg>14,LAMP_RED);lamp(ctx,96,lampY,"FUEL",rdo.fuelLow,LAMP_AMBER);lamp(ctx,146,lampY,"OIL",rdo.oilLow,LAMP_RED)
;lamp(ctx,196,lampY,"GEAR",rdo.gearDown&&!rdo.onGround,LAMP_GREEN);lamp(ctx,246,lampY,"GEAR",rdo.gearDown&&!rdo.onGround,LAMP_GREEN)
;lamp(ctx,296,lampY,"GEAR",rdo.gearDown&&!rdo.onGround,LAMP_GREEN);lamp(ctx,346,lampY,"DOOR",Boolean(flight.cargoDoorOpen),LAMP_AMBER)
;lamp(ctx,396,lampY,"LEAN",flight.lean,LAMP_GREEN);lamp(ctx,446,lampY,"BRAKE",flight.brakes>.1,LAMP_RED);ctx.fillStyle="rgba(176,138,62,0.18)"
;ctx.fillRect(520,762,240,24);ctx.strokeStyle=BRASS;ctx.lineWidth=1;ctx.strokeRect(520,762,240,24)
;text(ctx,"MONSOON POST · KP-04",640,774,'700 11px "Consolas", monospace',"#D8B96A");if(opts.light!==false){ctx.save();ctx.globalCompositeOperation="lighter"
;const glow=ctx.createRadialGradient(500,700,40,500,700,700);glow.addColorStop(0,"rgba(255,196,110,0.10)");glow.addColorStop(1,"rgba(255,180,90,0)")
;ctx.fillStyle=glow;ctx.fillRect(0,PANEL_TOP,1280,PANEL_HEIGHT);ctx.restore()}ctx.save();ctx.globalAlpha=.05;ctx.strokeStyle="#FFFFFF";ctx.lineWidth=10
;ctx.beginPath();ctx.moveTo(30,742);ctx.lineTo(660,676);ctx.stroke();ctx.restore()}export{PANEL_TOP,PANEL_HEIGHT};
export { roundGauge as drawGauge, lamp as drawLamp };
