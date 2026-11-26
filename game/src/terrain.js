// The Kharun Highlands: one 6.1 km height grid with a carved river, terraced tea slopes, four
import{clamp,createMeshBuilder,fbm2,hex,lerp,mixColor,ridge2,smoothstep}from"./util.js";export const WORLD_SIZE=6100;export const WORLD_HALF=WORLD_SIZE/2
;export const GRID=320;const CELL=WORLD_SIZE/GRID;const GRID_N=GRID+1;export const STRIPS=[{id:"suli",name:"Suli",x:-1500,z:1550,elev:274,length:700,width:40,
heading:270,night:true,note:"home strip, valley floor"},{id:"tamsen",name:"Tamsen Ridge",x:900,z:-1100,elev:655,length:620,width:44,heading:270,approach:840,
padWidth:175,blend:340,note:"ridge strip, 3% uphill"},{id:"nimra",name:"Nimra Kot",x:-1950,z:-50,elev:579,length:420,width:30,heading:270,
note:"one-way, land uphill"},{id:"dzong",name:"Dzong Pass",x:350,z:-2400,elev:823,length:500,width:32,heading:270,note:"high pass, cloud base"}]
;export const SETTLEMENTS=[{id:"suli",name:"Suli",x:-1690,z:1740,radius:260,elev:274},{id:"tamsen",name:"Upper Tamsen",x:1060,z:-930,radius:170,elev:655},{
id:"nimra",name:"Nimra",x:-1700,z:260,radius:230,elev:585},{id:"maru",name:"Maru",x:1860,z:160,radius:280,elev:420},{id:"dzong",name:"Dzong",x:150,z:-2160,
radius:210,elev:810}];const RIVER=[[-2700,2200],[-1900,1750],[-1200,1300],[-700,800],[-150,100],[300,-600],[520,-1350],[380,-1900],[900,-2400],[1700,-2850]]
;const STREAM=[[220,-580],[620,-720],[1e3,-770],[1400,-740],[1800,-650],[2300,-520]];function segmentDistance(px,pz,ax,az,bx,bz){const dx=bx-ax;const dz=bz-az
;const length=dx*dx+dz*dz;const t=clamp(((px-ax)*dx+(pz-az)*dz)/length,0,1);const x=ax+dx*t-px;const z=az+dz*t-pz;return Math.sqrt(x*x+z*z)}
function pathDistance(path,x,z){let best=Infinity;for(let i=0;i<path.length-1;i+=1){const d=segmentDistance(x,z,path[i][0],path[i][1],path[i+1][0],path[i+1][1])
;if(d<best)best=d}return best}function riverDistance(x,z){return Math.min(pathDistance(RIVER,x,z),pathDistance(STREAM,x,z)*1.4)}function gauss(x,z,cx,cz,sigma){
const dx=x-cx;const dz=z-cz;return Math.exp(-(dx*dx+dz*dz)/(2*sigma*sigma))}function rawHeight(x,z){let h=300;h+=560*ridge2(x*55e-5+7.2,z*55e-5-3.1,4)
;h+=210*(fbm2(x*.0013+2.1,z*.0013+9.4,4)-.5);h+=230*gauss(x,z,1200,-1300,850);h+=170*gauss(x,z,250,-2500,750);h+=200*gauss(x,z,-1900,-50,700)
;h-=180*gauss(x,z,-1500,1500,950);h-=330*gauss(x,z,1900,-1150,560);h-=105*(1-smoothstep(35,320,pathDistance(RIVER,x,z)))
;h-=58*(1-smoothstep(22,180,pathDistance(STREAM,x,z)));h+=26*(fbm2(x*.006,z*.006,2)-.5);return h}function settlementWeight(x,z){let best=0
;for(const village of SETTLEMENTS){const d=Math.hypot(x-village.x,z-village.z);best=Math.max(best,1-smoothstep(village.radius*.7,village.radius*2.4,d))}
return best}export function stripPad(x,z){let best=null;for(const strip of STRIPS){const dx=x-strip.x;const dz=z-strip.z;const along=Math.abs(dx)
;const lateral=Math.abs(dz);const halfLength=strip.length/2+(strip.approach??130);const halfWidth=strip.padWidth??78;const qx=along-halfLength
;const qz=lateral-halfWidth;const outside=Math.max(qx,qz);const weight=1-smoothstep(-20,strip.blend??100,outside)
;if(weight>0&&(best===null||weight>best.weight))best={strip:strip,weight:weight,along:along,lateral:lateral}}return best}function shapedHeight(x,z){
let h=rawHeight(x,z);const terrace=settlementWeight(x,z);if(terrace>.01){const step=14;h=lerp(h,Math.round(h/step)*step,.82*terrace)}const pad=stripPad(x,z)
;if(pad!==null)h=lerp(h,pad.strip.elev,pad.weight);return h}const heights=new Float32Array(GRID_N*GRID_N);let built=false;function gridHeight(ix,iy){
return heights[iy*GRID_N+ix]}export function heightAt(x,z){if(!built)return shapedHeight(x,z);const fx=clamp((x+WORLD_HALF)/CELL,0,GRID-1e-4)
;const fz=clamp((z+WORLD_HALF)/CELL,0,GRID-1e-4);const ix=Math.floor(fx);const iy=Math.floor(fz);const tx=fx-ix;const tz=fz-iy;const h00=gridHeight(ix,iy)
;const h10=gridHeight(ix+1,iy);const h01=gridHeight(ix,iy+1);const h11=gridHeight(ix+1,iy+1);return lerp(lerp(h00,h10,tx),lerp(h01,h11,tx),tz)}
export function groundHeight(x,z){const pad=stripPad(x,z);if(pad!==null){const inside=pad.along<=pad.strip.length/2+4&&pad.lateral<=pad.strip.width/2+2
;if(inside)return Math.max(heightAt(x,z),pad.strip.elev+.12)}return heightAt(x,z)}export function stripFrame(strip,x,z){return{along:strip.x-x,lateral:z-strip.z
}}function terrainColor(h,slope,x,z,terrace){const tea=hex("#5C7A45");const teaLit=hex("#8FA35B");const teaDark=hex("#3C5233");const earth=hex("#A87B4F")
;const rock=hex("#7C7368");const dry=hex("#C9B98A");let color=mixColor(tea,dry,smoothstep(520,940,h));const patch=fbm2(x*.0021+3.7,z*.0021-1.3,3)
;color=mixColor(color,earth,smoothstep(.54,.74,patch)*.55);color=mixColor(color,rock,smoothstep(.5,.85,slope))
;color=mixColor(color,rock,smoothstep(1020,1320,h));if(terrace>.08){const band=Math.floor(h/14)%2===0?teaLit:teaDark;color=mixColor(color,band,.3*terrace)}
if(riverDistance(x,z)<95)color=mixColor(color,earth,.55);return color}function addRunway(builder,strip){const dark=hex("#56534B");const gravel=hex("#7E7259")
;const white=hex("#E8DFC8");const fade=hex("#8C8578");const cone=hex("#C2452D");const cx=strip.x;const cz=strip.z;const half=strip.length/2
;const hw=strip.width/2;const y=strip.elev+.14;const plane=(u0,u1,v0,v1,color,lift=0)=>{const a={x:cx+u0,y:y+lift,z:cz+v0};const b={x:cx+u0,y:y+lift,z:cz+v1}
;const c={x:cx+u1,y:y+lift,z:cz+v1};const d={x:cx+u1,y:y+lift,z:cz+v0};builder.quad4(a,b,c,d,[color,color,color,color])}
;plane(-half-55,half+55,-hw-16,hw+16,gravel,-.04);plane(-half,half,-hw,hw,dark,.02);for(let i=0;i<8;i+=1){const v=-hw+4+i*((strip.width-8)/7)
;plane(-half+7,-half+15,v-.7,v+.7,white,.035);plane(half-15,half-7,v-.7,v+.7,white,.035)}for(let u=-half+30;u<half-20;u+=32){plane(u,u+15,-.45,.45,fade,.035)}
plane(-half,half,-hw+.9,-hw+1.5,white,.04);plane(-half,half,hw-1.5,hw-.9,white,.04);for(const side of[-1,1]){
plane(-half+120,-half+150,side*(hw*.45)-2.4,side*(hw*.45),white,.045);plane(-half+160,-half+190,side*(hw*.45)-2.4,side*(hw*.45),white,.045)}
for(let i=0;i<5;i+=1){plane(-half+120+i*7,-half+124+i*7,-6.5+i*2.4,-5.7+i*2.4,fade,.04);plane(-half+120+i*7,-half+124+i*7,5.7+i*2.4,6.5+i*2.4,fade,.04)}
const digit=(n,u,v)=>{const segs={2:[[0,0,1,0],[1,0,1,.5],[0,.5,1,.5],[0,.5,0,1],[0,1,1,1]],7:[[0,0,1,0],[1,0,1,1]]}[n];for(const[x0,y0,x1,y1]of segs){
const u0=u+x0*5.4;const v0=v+y0*8.4;const u1=u+x1*5.4;const v1=v+y1*8.4;plane(u0-.35,u1+.35,v0-.35,v1+.35,white,.05)}};digit(2,-half+36,-9.5)
;digit(7,-half+44,-9.5);for(let i=0;i<7;i+=1){const u=-half+30+i*((strip.length-60)/6);builder.coneBetween({x:cx+u,y:y,z:cz-hw-3},{x:cx+u,y:y+.75,z:cz-hw-3
},.5,cone,5);builder.coneBetween({x:cx+u,y:y,z:cz+hw+3},{x:cx+u,y:y+.75,z:cz+hw+3},.5,cone,5)}for(let i=0;i<6;i+=1){const u=half+42+i*44
;for(const side of[-1,1]){builder.box({x:cx+u,y:y+.55,z:cz+side*(hw+9)},{x:.16,y:1.1,z:.16},white);builder.box({x:cx+u,y:y+1.15,z:cz+side*(hw+9)},{x:.3,y:.24,
z:.3},cone)}}for(const side of[-1,1]){plane(half+18,half+300,side*(hw+16),side*(hw+40),hex("#6E7C4E"),-.01)}const ws={x:cx+half+22,y:strip.elev,z:cz-hw-16}
;builder.cylinderBetween(ws,{x:ws.x,y:ws.y+7,z:ws.z},.18,white,6);builder.coneBetween({x:ws.x,y:ws.y+6.6,z:ws.z},{x:ws.x+3.6,y:ws.y+6.1,z:ws.z+.9},.75,cone,7)
;builder.cylinderBetween({x:ws.x+1.2,y:ws.y+6.5,z:ws.z+.3},{x:ws.x+1.8,y:ws.y+6.4,z:ws.z+.45},.62,white,6);const ws2={x:cx+half+110,y:strip.elev,z:cz+hw+34}
;builder.cylinderBetween(ws2,{x:ws2.x,y:ws2.y+7,z:ws2.z},.16,white,6);builder.coneBetween({x:ws2.x,y:ws2.y+6.6,z:ws2.z},{x:ws2.x+3.4,y:ws2.y+6.2,z:ws2.z+1.2
},.7,cone,7);builder.cylinderBetween({x:ws2.x+1.1,y:ws2.y+6.5,z:ws2.z+.35},{x:ws2.x+1.7,y:ws2.y+6.4,z:ws2.z+.55},.58,white,6);const board={x:cx+half+14,
y:strip.elev,z:cz+hw+12};const boardWhite=hex("#E8DFC8");const boardInk=hex("#22201B");builder.box({x:board.x-2.4,y:board.y+1.4,z:board.z},{x:.22,y:2.8,z:.22
},boardInk);builder.box({x:board.x+2.4,y:board.y+1.4,z:board.z},{x:.22,y:2.8,z:.22},boardInk);builder.box({x:board.x,y:board.y+3.3,z:board.z},{x:7,y:2.2,z:.3
},boardWhite);builder.box({x:board.x,y:board.y+2.4,z:board.z-.18},{x:6.2,y:.18,z:.05},boardInk);builder.box({x:board.x,y:board.y+3.3,z:board.z-.18},{x:5.2,
y:.18,z:.05},boardInk);for(let i=0;i<3;i+=1){builder.cylinderBetween({x:board.x-8-i*1.5,y:strip.elev,z:board.z+2.5},{x:board.x-8-i*1.5,y:strip.elev+1.1,
z:board.z+2.5},.55,hex("#A6533A"),8)}if(strip.night){const light=hex("#F2C96A");for(let i=0;i<12;i+=1){const u=-half+25+i*((strip.length-50)/11);builder.box({
x:cx+u,y:y+.5,z:cz-hw-1.2},{x:.25,y:.9,z:.25},light);builder.box({x:cx+u,y:y+.5,z:cz+hw+1.2},{x:.25,y:.9,z:.25},light)}}}function waterPath(builder,path,width){
const water=hex("#4E7C86");const light=hex("#A9C6C7");for(let i=0;i<path.length-1;i+=1){const[ax,az]=path[i];const[bx,bz]=path[i+1];const steps=14
;for(let s=0;s<steps;s+=1){const t0=s/steps;const t1=(s+1)/steps;const x0=lerp(ax,bx,t0);const z0=lerp(az,bz,t0);const x1=lerp(ax,bx,t1);const z1=lerp(az,bz,t1)
;const y0=heightAt(x0,z0)-1.4;const y1=heightAt(x1,z1)-1.4;const dx=x1-x0;const dz=z1-z0;const len=Math.hypot(dx,dz)||1;const rx=-dz/len*width
;const rz=dx/len*width;const c0=s%2===0?water:mixColor(water,light,.22);const a={x:x0-rx,y:y0,z:z0-rz};const b={x:x0+rx,y:y0,z:z0+rz};const c={x:x1+rx,y:y1,
z:z1+rz};const d={x:x1-rx,y:y1,z:z1-rz};builder.quad4(a,b,c,d,[c0,c0,c0,c0])}}}export function buildTerrain(){if(built)return{mesh:terrainMesh,
water:waterSurface,runway:runwayMesh,heightAt:heightAt,groundHeight:groundHeight,strips:STRIPS};for(let iy=0;iy<GRID_N;iy+=1){for(let ix=0;ix<GRID_N;ix+=1){
heights[iy*GRID_N+ix]=shapedHeight(-WORLD_HALF+ix*CELL,-WORLD_HALF+iy*CELL)}}built=true;const builder=createMeshBuilder();for(let iy=0;iy<GRID;iy+=1){
for(let ix=0;ix<GRID;ix+=1){const x0=-WORLD_HALF+ix*CELL;const z0=-WORLD_HALF+iy*CELL;const x1=x0+CELL;const z1=z0+CELL;const h00=gridHeight(ix,iy)
;const h10=gridHeight(ix+1,iy);const h01=gridHeight(ix,iy+1);const h11=gridHeight(ix+1,iy+1);const slope00=Math.hypot(h10-h00,h01-h00)/CELL
;const slope11=Math.hypot(h11-h01,h11-h10)/CELL;const terr=settlementWeight((x0+x1)/2,(z0+z1)/2);const c00=terrainColor(h00,slope00,x0,z0,terr)
;const c10=terrainColor(h10,slope00,x1,z0,terr);const c01=terrainColor(h01,slope00,x0,z1,terr);const c11=terrainColor(h11,slope11,x1,z1,terr);builder.quad4({
x:x0,y:h00,z:z0},{x:x0,y:h01,z:z1},{x:x1,y:h11,z:z1},{x:x1,y:h10,z:z0},[c00,c01,c11,c10])}}const terrainMesh=builder.build()
;const waterBuilder=createMeshBuilder();waterPath(waterBuilder,RIVER,34);waterPath(waterBuilder,STREAM,13);const waterSurface=waterBuilder.build()
;const runwayBuilder=createMeshBuilder();for(const strip of STRIPS)addRunway(runwayBuilder,strip);const runwayMesh=runwayBuilder.build();return{
mesh:terrainMesh,water:waterSurface,runway:runwayMesh,heightAt:heightAt,groundHeight:groundHeight,strips:STRIPS}}