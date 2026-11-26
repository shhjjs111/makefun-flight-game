// The flight model: every force on the KP-04, the wing's lift curve and its stall, the engine's
import{bodyAxes,clamp,lerp,quatAxisAngle,quatMul,quatNormalize,quatFromYawPitchRoll,vlen,vnorm}from"./util.js";export const MASS_EMPTY=1340
;export const FUEL_MAX=210;export const CARGO_MAX=120;export const WING_AREA=21;export const STALL_ALPHA=16*Math.PI/180;const GRAVITY=9.81
;const PITCH_RATE=50*Math.PI/180;const ROLL_RATE=95*Math.PI/180;const YAW_RATE=20*Math.PI/180;const CLEARANCE=1.55
;const ZONES=["engine","leftWing","rightWing","tail","gear","tank"]
;export function createFlight({strip:strip,fuel:fuel=210,cargo:cargo=120,damage:damage=null}={}){const flight={p:{x:strip?strip.x+strip.length/2:0,
y:strip?strip.elev+CLEARANCE:600,z:strip?strip.z:0},v:{x:0,y:0,z:0},q:quatFromYawPitchRoll(strip?-(strip.heading*Math.PI)/180:0,0,0),w:{x:0,y:0,z:0},controls:{
pitch:0,roll:0,yaw:0},throttle:0,fuel:fuel,fuelStart:fuel,cargo:cargo,damage:{engine:100,leftWing:100,rightWing:100,tail:100,gear:100,tank:100},flaps:0,
gear:true,brakes:0,lean:false,heading:strip?strip.heading:0,onGround:true,stalled:false,stallTimer:0,crashed:false,groundSpeed:0,rpm:700,propAngle:0,airspeed:0,
alpha:0,bank:0,pitch:0,gLoad:1,vsi:0,buffet:0,sink:0,engineRunning:true,leanFullTimer:0,touchdownTick:0,time:0,lastDamage:""}
;if(damage)Object.assign(flight.damage,damage);return flight}export function fuelBurn(throttle,lean){return(.012+.11*clamp(throttle,0,1))*(lean?.85:1)}
export function stallFactor(alpha){return alpha>STALL_ALPHA?.9:1}export function applyDamage(flight,zone,amount){if(!ZONES.includes(zone))return
;flight.damage[zone]=clamp(flight.damage[zone]-amount,0,100);flight.lastDamage=zone;if(flight.damage[zone]<=0&&zone==="engine")flight.engineRunning=false}
export function structuralDamage(flight){let total=0;for(const zone of ZONES)total+=flight.damage[zone];return 100-total/ZONES.length}
function engineFactor(flight,time){if(!flight.engineRunning||flight.fuel<=0)return 0;const engine=flight.damage.engine;let factor=1;if(engine<=0)return 0
;else if(engine<30)factor=.4*(.65+.35*Math.sin(time*23+1.7));else if(engine<60)factor=.7;return factor*(flight.lean?.9:1)}function wingLiftScale(flight){let scale=1
;if(flight.damage.leftWing<30)scale*=.93;if(flight.damage.rightWing<30)scale*=.93;return scale}function bankRollBias(flight){let bias=0
;if(flight.damage.leftWing<60)bias-=8*Math.PI/180;if(flight.damage.leftWing<30)bias-=8*Math.PI/180;if(flight.damage.rightWing<60)bias+=8*Math.PI/180
;if(flight.damage.rightWing<30)bias+=8*Math.PI/180;return bias}function windVector(env,p){if(!env.windAt)return{x:0,z:0,lift:0};return env.windAt(p.x,p.y,p.z)}
export function stepFlight(flight,controls,env,dt){flight.time+=dt;flight.throttle=clamp(controls.throttle??flight.throttle,0,1)
;flight.lean=controls.lean??false;flight.brakes=controls.brakes??0;flight.flaps=controls.flaps??flight.flaps;flight.gear=controls.gear??flight.gear
;flight.controls.pitch=clamp(controls.pitch??0,-1,1);flight.controls.roll=clamp(controls.roll??0,-1,1);flight.controls.yaw=clamp(controls.yaw??0,-1,1)
;const burn=fuelBurn(flight.throttle,flight.lean)*(flight.engineRunning&&flight.fuel>0?1:0);flight.fuel=clamp(flight.fuel-burn*dt,0,FUEL_MAX)
;if(flight.damage.tank<60)flight.fuel=clamp(flight.fuel-.03*dt,0,FUEL_MAX);if(flight.damage.tank<30)flight.fuel=clamp(flight.fuel-.06*dt,0,FUEL_MAX)
;if(flight.lean&&flight.throttle>.85){flight.leanFullTimer+=dt;if(flight.leanFullTimer>20)applyDamage(flight,"engine",.6*dt)}else{
flight.leanFullTimer=Math.max(0,flight.leanFullTimer-dt*2)}if(flight.fuel<=0)flight.engineRunning=false;const wind=windVector(env,flight.p)
;const ground=env.groundHeight(flight.p.x,flight.p.z);if(flight.onGround){stepGround(flight,controls,env,dt,ground,wind);return}const axes=bodyAxes(flight.q)
;const air={x:flight.v.x-wind.x,y:flight.v.y-wind.lift,z:flight.v.z-wind.z};const speed=vlen(air);const vhat=speed>1?{x:air.x/speed,y:air.y/speed,z:air.z/speed
}:axes.fwd;const rho=1.225*Math.exp(-flight.p.y/8500);const qd=.5*rho*speed*speed
;const alpha=Math.asin(clamp(-(axes.up.x*vhat.x+axes.up.y*vhat.y+axes.up.z*vhat.z),-1,1));flight.alpha=alpha;flight.airspeed=speed
;const stalled=alpha>STALL_ALPHA&&speed>4;if(stalled)flight.stallTimer+=dt;else flight.stallTimer=Math.max(0,flight.stallTimer-dt*2.5)
;flight.stalled=flight.stallTimer>.12;const clMax=1.72*wingLiftScale(flight);let cl=clamp(.32+5.2*alpha,-.4,clMax);if(alpha>STALL_ALPHA)cl=.9*clMax
;const liftDir=vnorm({x:axes.right.y*vhat.z-axes.right.z*vhat.y,y:axes.right.z*vhat.x-axes.right.x*vhat.z,z:axes.right.x*vhat.y-axes.right.y*vhat.x})
;liftDir.x=axes.right.y*vhat.z-axes.right.z*vhat.y;liftDir.y=axes.right.z*vhat.x-axes.right.x*vhat.z;liftDir.z=axes.right.x*vhat.y-axes.right.y*vhat.x
;const liftNorm=vnorm(liftDir);const liftMag=qd*WING_AREA*cl;const dragMag=qd*WING_AREA*(.036+.052*cl*cl)
;const beta=Math.asin(clamp(axes.right.x*vhat.x+axes.right.y*vhat.y+axes.right.z*vhat.z,-1,1));const sideMag=-qd*WING_AREA*.9*Math.sin(beta)
;const mass=MASS_EMPTY+flight.fuel+flight.cargo;const thrust=4800*Math.max(.22,1-speed/125)*flight.throttle*engineFactor(flight,flight.time)
;const gust=(Math.sin(flight.time*3.1+flight.p.x*.004)+Math.sin(flight.time*5.3+flight.p.z*.003))*.5*(env.turbulence??0)*3
;let fx=thrust*axes.fwd.x+liftNorm.x*liftMag-vhat.x*dragMag+axes.right.x*sideMag
;let fy=thrust*axes.fwd.y+liftNorm.y*liftMag-vhat.y*dragMag+axes.right.y*sideMag-mass*GRAVITY
;let fz=thrust*axes.fwd.z+liftNorm.z*liftMag-vhat.z*dragMag+axes.right.z*sideMag;fy+=gust*mass*.15;flight.v.x+=fx/mass*dt;flight.v.y+=fy/mass*dt
;flight.v.z+=fz/mass*dt;flight.gLoad=lerp(flight.gLoad,clamp(liftMag/(mass*GRAVITY),-2,6),clamp(dt*6,0,1))
;const authority=clamp(speed/50,.35,1.2)*(flight.stalled?.55:1);const pitchTarget=flight.controls.pitch*PITCH_RATE*authority
;const rollTarget=flight.controls.roll*ROLL_RATE*authority+bankRollBias(flight)+Math.sin(flight.time*9.1)*(flight.stalled?.1:0)
;const yawTarget=flight.controls.yaw*YAW_RATE*(.4+authority*.6)-beta*1.8;const lag=clamp(dt/.12,0,1);flight.w.x=lerp(flight.w.x,pitchTarget,lag)
;flight.w.y=lerp(flight.w.y,yawTarget,lag);flight.w.z=lerp(flight.w.z,rollTarget,lag);let q=quatMul(flight.q,quatAxisAngle(1,0,0,flight.w.x*dt))
;q=quatMul(q,quatAxisAngle(0,0,1,flight.w.z*dt));q=quatMul(q,quatAxisAngle(0,1,0,flight.w.y*dt));flight.q=quatNormalize(q);flight.p.x+=flight.v.x*dt
;flight.p.y+=flight.v.y*dt;flight.p.z+=flight.v.z*dt;const next=bodyAxes(flight.q);flight.heading=(Math.atan2(next.fwd.x,-next.fwd.z)*180/Math.PI+360)%360
;flight.pitch=Math.asin(clamp(next.fwd.y,-1,1));flight.bank=Math.atan2(-next.right.y,next.up.y);flight.vsi=lerp(flight.vsi,flight.v.y,clamp(dt/.4,0,1))
;flight.sink=flight.v.y;flight.rpm=flight.engineRunning&&flight.fuel>0?700+flight.throttle*1750+speed*3.2:0
;flight.buffet=flight.stalled?.6:flight.stormBuffet??0;if(structuralDamage(flight)>=100)flight.crashed=true;if(flight.p.y<ground-2)flight.crashed=true}
function stepGround(flight,controls,env,dt,ground,wind){flight.p.y=ground+CLEARANCE;flight.v.y=0;const speed=Math.max(0,flight.groundSpeed)
;flight.heading=(flight.heading+flight.controls.yaw*16*dt*clamp(.35+speed/26,0,1.4)+360)%360;const rad=flight.heading*Math.PI/180;const dirX=Math.sin(rad)
;const dirZ=-Math.cos(rad);const pitch=clamp((speed-23)/25,0,1)*.16;flight.q=quatFromYawPitchRoll(-rad,pitch,0);flight.alpha=pitch*.7;flight.airspeed=speed
;flight.bank=0;flight.pitch=pitch;const rho=1.225*Math.exp(-flight.p.y/8500);const qd=.5*rho*speed*speed
;const cl=clamp(.32+5.2*flight.alpha,-.4,1.72)*wingLiftScale(flight);const lift=qd*WING_AREA*cl;const mass=MASS_EMPTY+flight.fuel+flight.cargo
;const thrust=4800*Math.max(.22,1-speed/125)*flight.throttle*engineFactor(flight,flight.time);const drag=qd*WING_AREA*(.036+.052*cl*cl)
;const rolling=mass*GRAVITY*(.018+flight.brakes*.34);const accel=(thrust-drag-rolling)/mass;flight.groundSpeed=Math.max(0,speed+accel*dt)
;if(flight.groundSpeed<.15&&flight.throttle<.05)flight.groundSpeed=0;flight.v.x=dirX*flight.groundSpeed+wind.x*.25;flight.v.z=dirZ*flight.groundSpeed+wind.z*.25
;flight.p.x+=flight.v.x*dt;flight.p.z+=flight.v.z*dt;flight.vsi=0;flight.rpm=flight.engineRunning&&flight.fuel>0?650+flight.throttle*1800:0;flight.buffet=0
;flight.gLoad=1;if(speed>31&&lift>mass*GRAVITY*.98&&flight.throttle>.35){flight.onGround=false;flight.v.y=Math.max(flight.v.y,1.1);flight.w.x=.08}
if(flight.p.y<ground-2)flight.crashed=true}export function readouts(flight,ground){const speedKt=flight.airspeed*1.94384;const altFt=flight.p.y*3.28084
;const aglFt=Math.max(0,(flight.p.y-CLEARANCE-ground)*3.28084);const vsiFpm=flight.vsi*196.85;const heading=(flight.heading%360+360)%360
;const fuelPct=flight.fuel/FUEL_MAX*100;const burn=fuelBurn(flight.throttle,flight.lean)*60;const fuelMin=burn>0?flight.fuel/burn:0
;const oilPressure=flight.engineRunning?18+flight.damage.engine*.52:0;const oilTemp=68+flight.throttle*38+(flight.lean?8:0)+(flight.damage.engine<60?14:0)
;const structural=structuralDamage(flight);return{speedKt:speedKt,altFt:altFt,aglFt:aglFt,vsiFpm:vsiFpm,heading:heading,fuelKg:flight.fuel,fuelPct:fuelPct,
fuelMin:fuelMin,oilPressure:oilPressure,oilTemp:oilTemp,rpm:flight.rpm,alphaDeg:flight.alpha*180/Math.PI,bankDeg:flight.bank*180/Math.PI,
pitchDeg:flight.pitch*180/Math.PI,gLoad:flight.gLoad,structural:structural,gearDown:flight.gear,flaps:flight.flaps,stalled:flight.stalled,
onGround:flight.onGround,crashed:flight.crashed,fuelLow:fuelPct<15,oilLow:oilPressure<40,damage:{...flight.damage},vsiLean:vsiFpm}}