// The reference's sculptural height-field material, ported from module 20109.
// The simulation stores height, velocity and stroke orientation in RGBA16F.
export const simulationVertex = `varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;

export const simulationFragment = `
precision highp float;
varying vec2 vUv;uniform sampler2D uState;
uniform vec2 uCell,uWorldCell,uDirection,uDrag;
uniform vec4 uStroke,uPulse,uGuards[4];uniform float uGuardWeight[4];
uniform float uAspect,uDt,uMotion,uPress,uScroll,uQuiet,uHorizontal;
vec2 point(vec2 uv){return (uv*2.-1.)*vec2(uAspect,1.);}
void main(){
 vec2 p=point(vUv),axis=normalize(uDirection+vec2(.00001,0.)),side=vec2(-axis.y,axis.x);
 vec2 segment=uStroke.zw-uStroke.xy;
 float t=clamp(dot(p-uStroke.xy,segment)/max(dot(segment,segment),.000001),0.,1.);
 vec2 nearest=mix(uStroke.xy,uStroke.zw,t),d=p-nearest;
 float width=mix(.21,.15,uMotion),crosswise=dot(d,side)/width;
 float longitudinal=dot(d,axis)/(mix(.25,.43,uMotion)+uPress*.1);
 float envelope=exp(-.5*crosswise*crosswise-longitudinal*longitudinal*1.8);
 float fold=-(1.-crosswise*crosswise)*envelope*(1.+.12*tanh(crosswise));
 float magnet=exp(-dot(p-uStroke.zw,p-uStroke.zw)/.30)*uPress;
 vec2 clickDelta=p-uPulse.xy;
 clickDelta+=vec2(sin(p.y*4.+p.x*1.7),sin(p.x*3.1-p.y*1.3))*.028;
 float kickZone=exp(-dot(clickDelta,clickDelta)/.34)*uPulse.z;
 float quiet=exp(-dot(p/vec2(.84,.75),p/vec2(.84,.75)))*uQuiet;
 float guard=1.;
 for(int i=0;i<4;i++){
  if(uGuardWeight[i]<.001)continue;
  vec2 r=max(uGuards[i].zw*vec2(uAspect,1.)*1.16,vec2(.05));
  vec2 g=(p-uGuards[i].xy*vec2(uAspect,1.))/r;
  guard*=1.-.96*uGuardWeight[i]*exp(-dot(g,g)*.8);
 }
 vec2 flow=uDrag*magnet*.23+clickDelta*kickZone*.70+p*quiet*.16+vec2(p.x,0.)*uHorizontal*.012;
 vec2 sampleUv=clamp(vUv-flow*uDt/vec2(2.*uAspect,2.),uCell*.5,1.-uCell*.5);
 vec4 state=texture2D(uState,sampleUv);
 vec4 left=texture2D(uState,sampleUv-vec2(uCell.x,0.)),right=texture2D(uState,sampleUv+vec2(uCell.x,0.));
 vec4 down=texture2D(uState,sampleUv-vec2(0.,uCell.y)),up=texture2D(uState,sampleUv+vec2(0.,uCell.y));
 vec2 lap=(left.rg+right.rg-2.*state.rg)/(uWorldCell.x*uWorldCell.x)+(down.rg+up.rg-2.*state.rg)/(uWorldCell.y*uWorldCell.y);
 vec2 slope=vec2(right.r-left.r,up.r-down.r)/(2.*uWorldCell);
 float pressure=fold*(uMotion*7.2+uPress*7.5);
 float pulseFold=-(1.-pow(dot(clickDelta,side)/.20,2.))*exp(-dot(clickDelta/vec2(.33,.26),clickDelta/vec2(.33,.26)));
 pressure+=pulseFold*uPulse.z*(8.5+min(3.,length(slope)*7.));
 pressure+=uScroll*.014*exp(-p.y*p.y*.22-p.x*p.x*.08);
 float force=pressure*guard*(1.-quiet*.88);
 float tension=10.0*state.r+2400.*state.r*state.r*state.r;
 float acceleration=0.09*lap.x-tension-(7.2+quiet*8.+(1.-guard)*8.)*state.g+0.0018*lap.y+force;
 float velocity=clamp(state.g+acceleration*uDt,-.65,.65);
 float height=clamp(state.r+velocity*uDt,-.13,.10);
 vec2 direction=mix(state.ba,axis,envelope*(uMotion+uPress)*uDt*5.);
 direction*=exp(-uDt*.7);
 gl_FragColor=vec4(height,velocity,direction);
}`;

export const environmentVertex = `
uniform sampler2D uState;uniform vec2 uCell;uniform float uAspect,uAmplitude,uStage,uTime;
varying vec2 vUv;
void main(){
 vUv=uv;float h=texture2D(uState,uv).r;
 vec2 slope=vec2(texture2D(uState,uv+vec2(uCell.x,0.)).r-texture2D(uState,uv-vec2(uCell.x,0.)).r,
 texture2D(uState,uv+vec2(0.,uCell.y)).r-texture2D(uState,uv-vec2(0.,uCell.y)).r)/(4.*uCell*vec2(uAspect,1.));
 vec2 p=position.xy-slope*.012*uAmplitude/vec2(uAspect,1.);
 if(uv.x==0.||uv.x==1.)p.x=position.x;
 if(uv.y==0.||uv.y==1.)p.y=position.y;
 gl_Position=vec4(p,-h*.4*uAmplitude,1.);
}`;

export const environmentFragment = `
uniform sampler2D uState;uniform vec2 uCell;uniform float uAspect,uAmplitude,uStage,uTime;
varying vec2 vUv;
void main(){
 vec4 state=texture2D(uState,vUv);
 float l=texture2D(uState,vUv-vec2(uCell.x,0.)).r,r=texture2D(uState,vUv+vec2(uCell.x,0.)).r;
 float d=texture2D(uState,vUv-vec2(0.,uCell.y)).r,u=texture2D(uState,vUv+vec2(0.,uCell.y)).r;
 vec2 low=max(vUv-uCell,uCell*.5),high=min(vUv+uCell,1.-uCell*.5);
 vec2 slope=vec2(r-l,u-d)/(2.*(high-low)*vec2(uAspect,1.))*uAmplitude;
 vec2 p=(vUv*2.-1.)*vec2(uAspect,1.);
 slope+=vec2(sin(p.y*1.8+p.x*.7+uTime*.071),cos(p.x*1.4-p.y*.8-uTime*.053))*.007;
 slope*=1.55;
 vec3 normal=normalize(vec3(-slope,1.));
 vec3 reflection=reflect(vec3(0.,0.,-1.),normal);
 float curvature=abs(l+r+d+u-4.*state.r);
 float roughness=.36+min(.025,curvature*2.)+min(.006,length(state.ba)*.006);
 vec3 key=normalize(vec3(-.55,.55+uStage*.05,1.));
 float spec=pow(max(dot(reflection,key),0.),mix(24.,17.,roughness));
 float rest=pow(key.z,mix(24.,17.,roughness));
 float fill=dot(normal,normalize(vec3(.35,.5,1.4)))-normalize(vec3(.35,.5,1.4)).z;
 float value=.00235+(spec-rest)*.026+fill*.006;
 value+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)*.00015;
 gl_FragColor=vec4(vec3(clamp(value,.0008,.022)),1.);
 #include <colorspace_fragment>
}`;
