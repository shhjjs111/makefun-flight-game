// The Koel KP-04: a strut-braced high-wing mail plane built from boxes, cylinders and cones with
import{createMeshBuilder,hex,mat4Model,mat4Multiply,quatAxisAngle,quatFromYawPitchRoll}from"./util.js";const CREAM=hex("#F3E6C8");const VERMILION=hex("#C2452D")
;const BRASS=hex("#C9A24A");const INK=hex("#22201B");const METAL=hex("#4A443C");const GLASS=hex("#2B3A3E");const TYRE=hex("#262421");const HUB=hex("#8C8578")
;function buildBody(){const b=createMeshBuilder();b.box({x:0,y:.15,z:.35},{x:1.55,y:1.35,z:4.3},CREAM);b.cylinderBetween({x:0,y:.15,z:2.4},{x:0,y:.2,z:4.15
},.62,CREAM,10);b.coneBetween({x:0,y:.2,z:3.6},{x:0,y:.22,z:4.55},.44,CREAM,8);b.cylinderBetween({x:0,y:.12,z:-1.85},{x:0,y:.12,z:-3.55},.84,CREAM,12)
;b.cylinderBetween({x:0,y:.12,z:-3.55},{x:0,y:.12,z:-3.72},.9,VERMILION,12);b.cylinderBetween({x:0,y:.12,z:-3.74},{x:0,y:.12,z:-3.8},.5,INK,12)
;b.cylinderBetween({x:-.55,y:-.42,z:-2.4},{x:-.8,y:-.62,z:-1.8},.09,METAL,5);b.box({x:-3.2,y:1.02,z:.15},{x:6.2,y:.22,z:2},CREAM,0,0,-.035);b.box({x:3.2,y:1.02,
z:.15},{x:6.2,y:.22,z:2},CREAM,0,0,.035);b.box({x:0,y:1.14,z:.15},{x:1.3,y:.3,z:2},CREAM);b.box({x:0,y:1.04,z:-.8},{x:12.2,y:.1,z:.18},VERMILION);b.box({
x:-6.05,y:1.12,z:.15},{x:.18,y:.34,z:2},VERMILION);b.box({x:6.05,y:1.12,z:.15},{x:.18,y:.34,z:2},VERMILION);b.cylinderBetween({x:-.72,y:-.6,z:.5},{x:-2.7,y:.92,
z:.2},.07,METAL,6);b.cylinderBetween({x:.72,y:-.6,z:.5},{x:2.7,y:.92,z:.2},.07,METAL,6);b.cylinderBetween({x:-.72,y:-.6,z:.5},{x:-2.7,y:.92,z:1.1},.05,METAL,5)
;b.cylinderBetween({x:.72,y:-.6,z:.5},{x:2.7,y:.92,z:1.1},.05,METAL,5);b.box({x:0,y:-.98,z:.55},{x:1.05,y:.82,z:2.5},CREAM);b.box({x:0,y:-1.02,z:.55},{x:1.1,
y:.2,z:2.55},VERMILION);b.box({x:.56,y:-.98,z:.4},{x:.06,y:.5,z:1.3},INK);b.box({x:-.79,y:-.02,z:.2},{x:.06,y:.2,z:5.1},VERMILION);b.box({x:.79,y:-.02,z:.2},{
x:.06,y:.2,z:5.1},VERMILION);b.box({x:.8,y:.35,z:1.15},{x:.04,y:.95,z:1.05},INK);b.box({x:0,y:.62,z:-1.86},{x:1.4,y:.62,z:.12},GLASS);b.box({x:-.78,y:.58,z:-.75
},{x:.05,y:.56,z:1},GLASS);b.box({x:.78,y:.58,z:-.75},{x:.05,y:.56,z:1},GLASS);b.box({x:0,y:.9,z:-1.2},{x:1.2,y:.18,z:1.3},CREAM);b.box({x:0,y:.92,z:-.3},{
x:.95,y:.05,z:.8},GLASS);b.box({x:0,y:1.25,z:3.55},{x:.16,y:1.9,z:1.65},CREAM);b.box({x:-.095,y:1.3,z:3.72},{x:.05,y:1.25,z:.95},VERMILION);b.box({x:.095,y:1.3,
z:3.72},{x:.05,y:1.25,z:.95},VERMILION);b.box({x:-.1,y:1.55,z:3.25},{x:.04,y:.3,z:.5},INK);b.box({x:.1,y:1.55,z:3.25},{x:.04,y:.3,z:.5},INK);b.box({x:0,y:.5,
z:3.5},{x:4.3,y:.14,z:1.15},CREAM);b.box({x:0,y:.52,z:4},{x:4.35,y:.08,z:.12},VERMILION);b.cylinderBetween({x:0,y:1.18,z:.9},{x:0,y:1.55,z:3.6},.02,INK,4)
;b.cylinderBetween({x:-2.6,y:.7,z:-.8},{x:-3.5,y:.7,z:-1.2},.03,METAL,4);b.cylinderBetween({x:-1,y:-.55,z:-.55},{x:-1.38,y:-1.5,z:-.55},.075,METAL,6)
;b.cylinderBetween({x:1,y:-.55,z:-.55},{x:1.38,y:-1.5,z:-.55},.075,METAL,6);b.cylinderBetween({x:1.15,y:-1.5,z:-.55},{x:1.62,y:-1.5,z:-.55},.3,TYRE,10)
;b.cylinderBetween({x:-1.62,y:-1.5,z:-.55},{x:-1.15,y:-1.5,z:-.55},.3,TYRE,10);b.cylinderBetween({x:1.62,y:-1.5,z:-.55},{x:1.66,y:-1.5,z:-.55},.12,HUB,8)
;b.cylinderBetween({x:-1.66,y:-1.5,z:-.55},{x:-1.62,y:-1.5,z:-.55},.12,HUB,8);b.cylinderBetween({x:0,y:0,z:3.2},{x:0,y:-1.32,z:3.5},.05,METAL,5)
;b.cylinderBetween({x:-.14,y:-1.36,z:3.5},{x:.14,y:-1.36,z:3.5},.16,TYRE,8);b.box({x:-6.08,y:1.05,z:-.05},{x:.14,y:.14,z:.3},hex("#D8482F"));b.box({x:6.08,
y:1.05,z:-.05},{x:.14,y:.14,z:.3},hex("#4FA36A"));b.box({x:-.42,y:-.16,z:-2},{x:.45,y:.26,z:.08},hex("#F2C96A"));b.box({x:0,y:.82,z:.3},{x:1.58,y:.02,z:.03
},INK);b.box({x:-.8,y:.15,z:2.1},{x:.02,y:1,z:.03},INK);b.box({x:.8,y:.15,z:2.1},{x:.02,y:1,z:.03},INK);return b.build()}function buildSurface(parts){
const b=createMeshBuilder();for(const part of parts)b.box(part.center,part.size,part.color,0,0,part.roll??0);return b.build()}export function buildAircraft(){
const body=buildBody();const propBlades=(()=>{const b=createMeshBuilder();for(let i=0;i<3;i+=1){const a=i/3*Math.PI*2;const cx=Math.cos(a)*.72
;const cy=Math.sin(a)*.72;b.box({x:cx,y:cy,z:0},{x:.14,y:1.5,z:.05},INK,0,0,a);b.box({x:Math.cos(a)*1.38,y:Math.sin(a)*1.38,z:0},{x:.15,y:.18,z:.06
},BRASS,0,0,a)}b.coneBetween({x:0,y:0,z:0},{x:0,y:0,z:-.55},.34,VERMILION,10);return b.build()})();const propDisc=(()=>{const b=createMeshBuilder()
;for(let i=0;i<18;i+=1){const a0=i/18*Math.PI*2;const a1=(i+1)/18*Math.PI*2;const ring=[{x:0,y:0,z:0}];b.tri(ring[0],{x:Math.cos(a0)*1.5,y:Math.sin(a0)*1.5,z:0
},{x:Math.cos(a1)*1.5,y:Math.sin(a1)*1.5,z:0},hex("#5B554A"))}return b.build()})();return{body:body,propBlades:propBlades,propDisc:propDisc,propAngle:0,
parts:[],surface:{aileronL:{mesh:buildSurface([{center:{x:0,y:0,z:.28},size:{x:1.9,y:.1,z:.5},color:CREAM}]),hinge:{x:-3.4,y:1.02,z:1},axis:"x",angle:0},
aileronR:{mesh:buildSurface([{center:{x:0,y:0,z:.28},size:{x:1.9,y:.1,z:.5},color:CREAM}]),hinge:{x:3.4,y:1.02,z:1},axis:"x",angle:0},elevator:{
mesh:buildSurface([{center:{x:0,y:0,z:.32},size:{x:4,y:.1,z:.55},color:CREAM}]),hinge:{x:0,y:.5,z:3.9},axis:"x",angle:0},rudder:{mesh:buildSurface([{center:{
x:0,y:.75,z:.18},size:{x:.12,y:1.4,z:.55},color:CREAM}]),hinge:{x:0,y:.55,z:4.15},axis:"y",angle:0}}}}export function setSurfaces(aircraft,flight){
const roll=flight.controls?.roll??0;const pitch=flight.controls?.pitch??0;const yaw=flight.controls?.yaw??0;aircraft.surface.aileronL.angle=roll*.35
;aircraft.surface.aileronR.angle=-roll*.35;aircraft.surface.elevator.angle=-pitch*.3;aircraft.surface.rudder.angle=yaw*.4}
export function updateAircraft(aircraft,flight,dt,cockpit=false){aircraft.propAngle+=(flight.rpm??0)*dt*.42;setSurfaces(aircraft,flight)
;const bodyModel=mat4Model(flight.p,flight.q);const parts=[];parts.push({name:"body",mesh:aircraft.bodyMesh,model:bodyModel,alpha:1,cockpit:!cockpit})
;for(const key of["aileronL","aileronR","elevator","rudder"]){const surface=aircraft.surface[key];const angle=key==="rudder"?surface.angle:surface.angle
;const quat=quatAxisAngle(surface.axis==="x"?1:0,surface.axis==="y"?1:0,0,angle);const local=mat4Model(surface.hinge,quat);parts.push({name:key,
mesh:surface.mesh,model:mat4Multiply(bodyModel,local),alpha:1,cockpit:true})}const propQuat=quatAxisAngle(0,0,1,aircraft.propAngle);const propLocal=mat4Model({
x:0,y:.12,z:-3.86},propQuat);const disc=(flight.rpm??0)>1100;if(disc){parts.push({name:"propDisc",mesh:aircraft.propDiscMesh,
model:mat4Multiply(bodyModel,propLocal),alpha:.32,cockpit:true})}else{parts.push({name:"prop",mesh:aircraft.propMesh,model:mat4Multiply(bodyModel,propLocal),
alpha:1,cockpit:true})}
const visible=cockpit?parts.filter(part=>part.name!=="body"&&part.name!=="aileronL"&&part.name!=="aileronR"&&part.name!=="propDisc"&&part.name!=="prop"):parts
;aircraft.parts=visible;return visible}export function damageVisuals(aircraft,flight){const state=flight.damage;aircraft.smoke=state.engine<60
;aircraft.tornPatch=state.leftWing<60;aircraft.bentProp=flight.crashed===true;aircraft.oilStreak=state.engine<30}export function smokeOrigin(flight){
const fx=Math.sin(flight.heading);const fz=-Math.cos(flight.heading);return{x:flight.p.x-fx*2.2,y:flight.p.y+.3,z:flight.p.z-fz*2.2}}
export function placeOnRunway(flight,strip,distance=0){flight.p={x:strip.x+strip.length/2+distance,y:strip.elev+1.55,z:strip.z};flight.v={x:0,y:0,z:0}
;flight.q=quatFromYawPitchRoll(-(strip.heading*Math.PI)/180,.02,0);flight.heading=strip.heading;flight.onGround=true;flight.rpm=700;flight.throttle=0
;flight.fuel=210;flight.flaps=0;flight.gear=true;flight.crashed=false;flight.engineRunning=true;flight.stalled=false;flight.impactCause=null}export{CREAM,VERMILION,BRASS,INK};