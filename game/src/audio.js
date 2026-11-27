import{clamp}from'./util.js';
function noiseBuffer(ctx,seconds=2){const buffer=ctx.createBuffer(1,ctx.sampleRate*seconds,ctx.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i+=1){const white=Math.random()*2-1;last=last*.72+white*.28;data[i]=last}return buffer}
function filter(ctx,type,frequency,q){const node=ctx.createBiquadFilter();node.type=type;node.frequency.value=frequency;if(q)node.Q.value=q;return node}
function gainNode(ctx,value){const node=ctx.createGain();node.gain.value=value;return node}
export class CockpitAudio{constructor(){this.ctx=null;this.ready=false;this.muted=false;this.rpmValue=0;this.hornOn=false}
unlock(){if(this.ctx){if(this.ctx.state==="suspended")this.ctx.resume();return}const AC=window.AudioContext??window.webkitAudioContext;if(!AC)return;try{this.ctx=new AC}catch{return}
const ctx=this.ctx;this.master=gainNode(ctx,.55);this.master.connect(ctx.destination);this.noise=noiseBuffer(ctx);
const engineGain=gainNode(ctx,0),engineFilter=filter(ctx,"lowpass",420,1.4);engineGain.connect(engineFilter);engineFilter.connect(this.master);
const oscs=[];for(const[type,ratio]of[["sawtooth",1],["square",1.5],["sine",.5]]){const osc=ctx.createOscillator(),gain=gainNode(ctx,ratio===2?.12:.2);osc.type=type;osc.frequency.value=52*ratio;osc.connect(gain);gain.connect(engineGain);osc.start();oscs.push({osc:osc,ratio:ratio})}
this.engine={gain:engineGain,filter:engineFilter,oscs:oscs};
const windSource=ctx.createBufferSource(),windFilter=filter(ctx,"bandpass",700,.6),windGain=gainNode(ctx,0);windSource.buffer=this.noise;windSource.loop=true;windSource.connect(windFilter);windFilter.connect(windGain);windGain.connect(this.master);windSource.start();this.wind={gain:windGain,filter:windFilter};
const rainSource=ctx.createBufferSource(),rainFilter=filter(ctx,"highpass",2200),rainGain=gainNode(ctx,0);rainSource.buffer=this.noise;rainSource.loop=true;rainSource.connect(rainFilter);rainFilter.connect(rainGain);rainGain.connect(this.master);rainSource.start();this.rain={gain:rainGain};
const hornOsc=ctx.createOscillator(),hornGain=gainNode(ctx,0);hornOsc.type="square";hornOsc.frequency.value=640;hornOsc.connect(hornGain);hornGain.connect(this.master);hornOsc.start();this.horn={osc:hornOsc,gain:hornGain};
this.ready=true}
setMuted(muted){this.muted=muted;if(this.master)this.master.gain.value=muted?0:.55}
update(flight,sky,_dt){if(!this.ready)return;const ctx=this.ctx,now=ctx.currentTime,rpm=flight.rpm??0,speed=flight.airspeed??0,engineOn=flight.engineRunning&&flight.fuel>0;
this.engine.gain.gain.setTargetAtTime(engineOn?.08+clamp(rpm/2600,0,1)*.2:0,now,.15);
for(const{osc,ratio}of this.engine.oscs)osc.frequency.setTargetAtTime((30+rpm*.035)*ratio,now,.12);
this.engine.filter.frequency.setTargetAtTime(280+rpm*.32,now,.2);
this.wind.gain.gain.setTargetAtTime(clamp((speed-8)/60,0,1)*.12,now,.2);
this.wind.filter.frequency.setTargetAtTime(480+speed*22,now,.2);
this.rain.gain.gain.setTargetAtTime(sky.rain*.11,now,.4);
const hornOn=Boolean(flight.stalled);if(hornOn!==this.hornOn){this.hornOn=hornOn;this.horn.gain.gain.setTargetAtTime(hornOn?.05:0,now,.03)}
if(hornOn)this.horn.gain.gain.setTargetAtTime(Math.sin(now*12)>0?.05:0,now,.02)}
blip(frequency,duration,type="square",volume=.06){if(!this.ready)return;const ctx=this.ctx,osc=ctx.createOscillator(),gain=gainNode(ctx,0);osc.type=type;osc.frequency.value=frequency;gain.gain.setValueAtTime(volume,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);osc.connect(gain);gain.connect(this.master);osc.start();osc.stop(ctx.currentTime+duration)}
noiseBurst(duration,frequency,volume=.1,type="bandpass"){if(!this.ready)return;const ctx=this.ctx,source=ctx.createBufferSource(),band=filter(ctx,type,frequency),gain=gainNode(ctx,0);source.buffer=this.noise;gain.gain.setValueAtTime(volume,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);source.connect(band);band.connect(gain);gain.connect(this.master);source.start();source.stop(ctx.currentTime+duration)}
sweep(from,to,volume,duration,type="sine"){if(!this.ready)return;const ctx=this.ctx,osc=ctx.createOscillator(),gain=gainNode(ctx,0),at=ctx.currentTime;osc.type=type;osc.frequency.setValueAtTime(from,at);osc.frequency.exponentialRampToValueAtTime(to,at+duration*.65);gain.gain.setValueAtTime(volume,at);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(gain);gain.connect(this.master);osc.start();osc.stop(at+duration+.01)}
gearMotor(){this.blip(90,.5,"sawtooth",.035)}
gearClunk(){this.noiseBurst(.16,180,.16,"lowpass")}
touchdownThump(sink=1.2){this.sweep(95,38,clamp(.12+sink*.05,.1,.4),.34);this.noiseBurst(.12,900,.09)}
tyreChirp(){this.noiseBurst(.3,2400,.07)}
drop(){this.blip(320,.08,"square",.04);this.noiseBurst(.2,300,.08,"lowpass")}
radio(){this.blip(1200,.03,"square",.025)}
thunder(distance=.5){this.noiseBurst(1.4+distance,120,.12,"lowpass")}
result(grade){if(!this.ready)return;const notes=grade==="GOLD"?[523,659,784]:grade==="SILVER"?[523,659]:[392],ctx=this.ctx;
notes.forEach((frequency,index)=>{const osc=ctx.createOscillator(),gain=gainNode(ctx,0),at=ctx.currentTime+index*.18;osc.type="sine";osc.frequency.value=frequency;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.08,at+.02);gain.gain.exponentialRampToValueAtTime(.0001,at+1.4);osc.connect(gain);gain.connect(this.master);osc.start(at);osc.stop(at+1.5)})}}
export function engineLoop(audio,flight,sky,dt){audio.update(flight,sky,dt)}
