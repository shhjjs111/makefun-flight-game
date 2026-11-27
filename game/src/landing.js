// The ground: touchdown detection, the landing grade, the rollout and the plain cause of a crash.
import{clamp}from'./util.js';
const CLEARANCE=1.55;

function stripAt(strips,x,z){for(const strip of strips){const lateral=z-strip.z,along=strip.x-x;if(Math.abs(lateral)<=strip.width/2+2&&Math.abs(along)<=strip.length/2+6)return{strip,offset:lateral,along}}return null}
export function groundContact(flight,env){
if(flight.onGround||flight.crashed)return null;
const ground=env.groundHeight(flight.p.x,flight.p.z);
const wheelY=flight.p.y-CLEARANCE;
if(wheelY>ground+0.12||flight.v.y>0.6)return null;
const hit=stripAt(env.strips,flight.p.x,flight.p.z);
const slopeA=env.groundHeight(flight.p.x+10,flight.p.z);
const slopeB=env.groundHeight(flight.p.x-10,flight.p.z);
const slope=Math.abs((slopeA-slopeB)/20);
const contact={
sink:Math.max(0,-flight.v.y),
speedKt:flight.airspeed*1.94384,
bankDeg:Math.abs((flight.bank*180)/Math.PI),
pitchDeg:(flight.pitch*180)/Math.PI,
offset:hit?Math.abs(hit.offset):0,
along:hit?hit.along:0,
strip:hit?hit.strip:null,
onRunway:hit!==null,
slope,
surface:hit?'runway':'meadow',
point:{x:flight.p.x,y:flight.p.y,z:flight.p.z},};
contact.grade=gradeLanding(contact);
return contact;}
export function gradeLanding(contact){
const{sink,bankDeg,offset,speedKt,onRunway,pitchDeg,slope}=contact;
if(pitchDeg<-2)return{grade:'CRASH',points:0,cause:'the prop struck the ground'};
if(!onRunway){
if(slope<0.18&&sink<2.5&&bankDeg<15&&speedKt<62){
return{grade:'HEAVY',points:30,cause:'a forced landing in the meadow'};}
return{grade:'CRASH',points:0,cause:'the ground came up outside the strip'};}
if(sink<1.2&&bankDeg<5&&offset<4&&speedKt>=32&&speedKt<=46){
return{grade:'GREASED',points:100,cause:'a greased arrival'};}
if(sink<2.6&&bankDeg<10&&offset<8&&speedKt>=28&&speedKt<=52){
return{grade:'FIRM',points:75,cause:'a firm arrival'};}
if(sink<4.2&&bankDeg<14&&speedKt>=24&&speedKt<=58){
return{grade:'HEAVY',points:40,cause:'a heavy arrival'};}
return{grade:'CRASH',points:0,cause:'the undercarriage gave way'};}

export function rollOut(flight,contact){
flight.onGround=true;
flight.v.y=0;
flight.groundSpeed=Math.max(0,contact.speedKt/1.94384);
flight.heading=((flight.heading%360)+360)%360;
flight.v={x:Math.sin((flight.heading*Math.PI)/180)*flight.groundSpeed,y:0,z:-Math.cos((flight.heading*Math.PI)/180)*flight.groundSpeed};
flight.brakes=0;
flight.touchdownTick=0.4;}

export function applyLandingDamage(flight,contact){
if(contact.grade==='CRASH'){
flight.crashed=true;
flight.impactCause=crashCause(flight,contact);
return;}
if(contact.grade==='HEAVY'){
flight.damage.gear=clamp(flight.damage.gear-20-contact.sink*8,0,100);
flight.damage.leftWing=clamp(flight.damage.leftWing-4,0,100);
if(flight.damage.gear<30){
flight.crashed=true;
flight.impactCause='gear collapsed on a '+contact.sink.toFixed(1)+' m/s arrival';}}
flight.touchdownTick=0.45;}

export function crashCause(flight,contact){
if(!contact)return'the aircraft was lost';
const kt=Math.round(contact.speedKt);
if(contact.pitchDeg<-2)return`the prop struck the strip at ${kt} kt`;
if(!contact.onRunway)return`struck the hillside at ${kt} kt, ${Math.round(contact.bankDeg)}° bank`;
if(contact.sink>=4.2)return`the gear folded on a ${contact.sink.toFixed(1)} m/s arrival`;
if(contact.bankDeg>=14)return`the wingtip caught the strip at ${kt} kt, ${Math.round(contact.bankDeg)}° bank`;
return`ran off the strip at ${kt} kt`;}

export function landingRibbon(contact){
if(!contact)return'';
return`TOUCHDOWN · ${contact.grade.grade} · ${Math.round(contact.speedKt)} KT · ${contact.offset.toFixed(0)} M LEFT`;}
