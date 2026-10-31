/* Lightweight orthographic 3D plots. Repaints on interaction only; no render loop. */
(function(){
  'use strict';
  class Chart3D {
    constructor(host,{labels,format,onSelect}={}){
      this.host=host;this.labels=labels;this.format=format;this.onSelect=onSelect;this.points=[];this.lines=[];this.yaw=-.65;this.pitch=.55;
      host.innerHTML='<div class="chart3d-controls"><label>Rotate <input type="range" min="-180" max="180" value="-37" aria-label="Rotate 3D chart"></label><label>Tilt <input type="range" min="10" max="80" value="32" aria-label="Tilt 3D chart"></label><button type="button">Reset view</button></div><canvas width="1000" height="470" tabindex="0" role="img"></canvas><p class="chart3d-readout" aria-live="polite">Drag to rotate; use the sliders or arrow keys. Point at a value to inspect it.</p>';
      this.canvas=host.querySelector('canvas');this.canvas.setAttribute('aria-label',labels.join(' versus '));this.ctx=this.canvas.getContext('2d');this.readout=host.querySelector('.chart3d-readout');const sliders=host.querySelectorAll('input');
      sliders[0].oninput=()=>{this.yaw=Number(sliders[0].value)*Math.PI/180;this.draw();};sliders[1].oninput=()=>{this.pitch=Number(sliders[1].value)*Math.PI/180;this.draw();};
      const sync=()=>{sliders[0].value=Math.round(this.yaw*180/Math.PI);sliders[1].value=Math.round(this.pitch*180/Math.PI);};
      host.querySelector('button').onclick=()=>{this.yaw=-.65;this.pitch=.55;sync();this.draw();};
      let drag=null,moved=false;
      this.canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};moved=false;this.canvas.setPointerCapture(e.pointerId);};
      this.canvas.onpointermove=e=>{if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>2)moved=true;this.yaw=Math.max(-Math.PI,Math.min(Math.PI,this.yaw+dx*.007));this.pitch=Math.max(.17,Math.min(1.39,this.pitch+dy*.005));drag={x:e.clientX,y:e.clientY};sync();this.draw();}else this.inspect(e);};
      this.canvas.onpointerup=e=>{drag=null;if(!moved){const p=this.inspect(e);if(p&&this.onSelect)this.onSelect(p);}};this.canvas.onpointercancel=()=>{drag=null;};
      this.canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')this.yaw-=.1;if(e.key==='ArrowRight')this.yaw+=.1;if(e.key==='ArrowUp')this.pitch+=.1;if(e.key==='ArrowDown')this.pitch-=.1;this.pitch=Math.max(.17,Math.min(1.39,this.pitch));this.yaw=Math.max(-Math.PI,Math.min(Math.PI,this.yaw));sync();this.draw();};
    }
    setData(points,lines=[]){this.points=points;this.lines=lines;this.selected=null;this.readout.textContent=points.length?'Drag to rotate; hover or tap to inspect. Arrow keys also rotate.':'No eligible data yet. Use the table and plan fields to see what is missing.';this.draw();}
    project(x,y,z){const a=x*Math.cos(this.yaw)-y*Math.sin(this.yaw),b=x*Math.sin(this.yaw)+y*Math.cos(this.yaw);return {x:500+a*205,y:235+(b*Math.sin(this.pitch)-z*Math.cos(this.pitch))*115,depth:b*Math.cos(this.pitch)+z*Math.sin(this.pitch)};}
    draw(){const ctx=this.ctx;ctx.clearRect(0,0,1000,470);ctx.fillStyle='#f6f9f7';ctx.fillRect(0,0,1000,470);ctx.font='13px system-ui';
      const ranges=['x','y','z'].map(k=>{let min=Infinity,max=-Infinity;this.points.forEach(p=>{min=Math.min(min,p[k]);max=Math.max(max,p[k]);});return min===Infinity?[0,1]:[min,max===min?min+1:max];});
      const norm=(v,i)=>-1+2*(v-ranges[i][0])/(ranges[i][1]-ranges[i][0]);const point=p=>this.project(norm(p.x,0),norm(p.y,1),norm(p.z,2));
      const origin=this.project(-1,-1,-1);[this.project(1,-1,-1),this.project(-1,1,-1),this.project(-1,-1,1)].forEach((end,i)=>{ctx.strokeStyle='#74887e';ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.fillStyle='#263f33';ctx.fillText(this.labels[i],Math.max(8,Math.min(820,end.x-35)),Math.max(20,end.y-12));ctx.fillText(ranges[i].map(v=>Number(v.toFixed(2)).toLocaleString('en-GB')).join(' → '),Math.max(8,Math.min(820,end.x-35)),end.y+6);});
      this.lines.forEach((line,i)=>{ctx.strokeStyle=`hsl(${150+i*5}, 42%, ${35+i*2}%)`;ctx.lineWidth=1.4;ctx.beginPath();line.forEach((p,j)=>{const q=point(p);j?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.stroke();});
      this.projected=this.points.map(p=>({...point(p),data:p})).sort((a,b)=>a.depth-b.depth);this.projected.forEach(q=>{ctx.fillStyle=q.data.color||'#087a55';ctx.beginPath();ctx.arc(q.x,q.y,this.lines.length?2.5:5,0,Math.PI*2);ctx.fill();});if(!this.points.length){ctx.fillStyle='#52655c';ctx.fillText('No eligible data to plot',400,220);}
    }
    inspect(e){const rect=this.canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*1000/rect.width,y=(e.clientY-rect.top)*470/rect.height;let best=null,distance=18;for(const q of this.projected||[]){const d=Math.hypot(x-q.x,y-q.y);if(d<distance){distance=d;best=q.data;}}if(best)this.readout.textContent=this.format(best);return best;}
  }
  window.Chart3D=Chart3D;
})();
