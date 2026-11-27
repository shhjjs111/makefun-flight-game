import{clamp,hex,makeRng}from'./util.js';
import{heightAt}from'./terrain.js';
export const WEATHER={
CLEAR:{id:'CLEAR',storm:0,wind:3,from:250,gust:0.3,rain:0,visibility:9000,label:'clear, light westerly'},
GUST:{id:'GUST',storm:0.18,wind:6,from:240,gust:0.7,rain:0,visibility:7500,label:'noon gust 6 m/s'},
SQUALL:{id:'SQUALL',storm:0.62,wind:9,from:235,gust:1.1,rain:0.55,visibility:4200,label:'squall line, 9 m/s'},
STORM:{id:'STORM',storm:1,wind:12,from:240,gust:1.6,rain:1,visibility:2400,label:'storm wall, 12 m/s crosswind'},};
export function setWeather(sky,name){
const preset=WEATHER[name]??WEATHER.CLEAR;
sky.weather=preset;
sky.storm=preset.storm;
sky.rain=preset.rain;
sky.time=0;
sky.flash=0;
sky.thunderIn=0;}

export function buildSky(seed=7){
const rng=makeRng(seed);
const sky={
weather:WEATHER.CLEAR,
storm:0,
rain:0,
time:0,
dawn:0.85,
night:0,
flash:0,
thunderIn:0,
sunDir:{x:0.96,y:0.2,z:0.12},
fog:hex('#8FA3A0'),
clouds:[],};
for(let i=0;i<15;i+=1){
const angle=rng()*Math.PI*2;
const radius=700+rng()*2400;
sky.clouds.push({
x:Math.cos(angle)*radius,
y:780+rng()*720,
z:Math.sin(angle)*radius,
size:320+rng()*480,
alpha:0.45+rng()*0.35,
drift:0.4+rng()*0.5,});}
return sky;}

export function setSkyLight(sky,{dawn=0,night=0}={}){
sky.dawn=dawn;
sky.night=night;
sky.sunDir=dawn>0.4?{x:0.72,y:0.23,z:0.58}:night>0.4?{x:-0.4,y:0.55,z:0.72}:{x:0.45,y:0.78,z:0.42};}
export function updateSky(sky,dt,cameraPosition){
sky.time+=dt;
for(const cloud of sky.clouds){
cloud.x+=cloud.drift*dt*(2+sky.weather.wind*0.4);
if(cloud.x>3000)cloud.x=-3000;}
if(sky.storm>0.7){
sky.flash=Math.max(0,sky.flash-dt*2.8);
sky.thunderIn-=dt;
if(sky.thunderIn<=0&&Math.sin(sky.time*0.37)>0.996){
sky.flash=1;
sky.thunderIn=6+(sky.time*7.1)%9;}}
if(cameraPosition&&sky.night>0.5)sky.fog=hex('#1E2A30');}

export function windAt(sky,x,y,z){
const w=sky.weather;
const toward=(w.from+180)*(Math.PI/180);
const dirX=Math.sin(toward);
const dirZ=-Math.cos(toward);
const gust=Math.sin(sky.time*1.7+x*0.0013)*Math.sin(sky.time*0.63+z*0.0011)*w.gust;
const speed=w.wind+gust*w.wind*0.28;
let lift=0;
const agl=y-heightAt(x,z);
if(agl<220){
const ahead=heightAt(x+dirX*70,z+dirZ*70);
const behind=heightAt(x-dirX*70,z-dirZ*70);
const slope=(ahead-behind)/140;
const ridge=slope*speed*1.35;
lift=clamp(ridge,-4.2,3.2)*(1-clamp(agl/220,0,1));}
return{x:dirX*speed,z:dirZ*speed,lift,speed,from:w.from};}

export function windHeading(sky){
return sky.weather.from;}
