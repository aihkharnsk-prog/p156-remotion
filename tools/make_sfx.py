import numpy as np, wave, sys, os
SR=44100
rng=np.random.default_rng(7)
out=sys.argv[1]
def save(name,x,peak=0.9):
    x=x/ (np.max(np.abs(x))+1e-9)*peak
    w=wave.open(os.path.join(out,name+'.wav'),'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x*32767).astype('<i2').tobytes()); w.close()
def t(d): return np.arange(int(SR*d))/SR
def lp(x,a):
    y=np.zeros_like(x); s=0
    for i,v in enumerate(x): s+=a*(v-s); y[i]=s
    return y
def env(n,a,d):
    e=np.ones(n); na=int(SR*a); e[:na]=np.linspace(0,1,na); e*=np.exp(-np.arange(n)/(SR*d)); return e
def noise(d): return rng.standard_normal(int(SR*d))
# whoosh: noise with moving lowpass (fast one-pole sweep via cumulative)
def whoosh(d,f0,f1):
    n=noise(d); N=len(n); y=np.zeros(N); s=0
    for i in range(N):
        a=np.interp(i,[0,N*0.5,N],[f0,f1,f0])
        s+=a*(n[i]-s); y[i]=s
    e=np.sin(np.pi*np.arange(N)/N)**2
    return y*e
save('whoosh',whoosh(0.5,0.02,0.3))
save('whoosh_long',whoosh(1.0,0.01,0.25))
# hit: pitch-drop sine + noise burst
tt=t(0.5); f=140*np.exp(-tt*9)+40
hit=np.sin(2*np.pi*np.cumsum(f)/SR)*env(len(tt),0.002,0.12)+0.6*lp(noise(0.5),0.35)*env(len(tt),0.001,0.05)
save('hit',hit)
# clang: inharmonic partials
tt=t(1.2); cl=sum(np.sin(2*np.pi*fr*tt)*np.exp(-tt*dc)*am for fr,dc,am in [(880,5,1),(1318,6,.7),(2093,8,.6),(2960,10,.4),(4180,14,.3)])
cl+=0.5*noise(1.2)*env(len(tt),0.0005,0.02)
save('clang',cl)
# boom
tt=t(2.0); f=70*np.exp(-tt*2.2)+25
boom=np.sin(2*np.pi*np.cumsum(f)/SR)*env(len(tt),0.003,0.5)+0.5*lp(noise(2.0),0.05)*env(len(tt),0.002,0.35)
save('boom',boom)
# zap: crackle
tt=t(0.9); z=noise(0.9)*(rng.random(len(tt))>0.93)*np.exp(-tt*3)
z=np.convolve(z,np.hanning(12),'same')+0.3*np.sin(2*np.pi*(1200+800*np.sin(2*np.pi*30*tt))*tt)*np.exp(-tt*6)
save('zap',z)
# rumble (dark aura)
tt=t(3.0); r=lp(noise(3.0),0.02)*np.sin(np.pi*tt/3.0)**1.5+0.4*np.sin(2*np.pi*48*tt)*np.sin(np.pi*tt/3.0)
save('rumble',r)
# charge: rising tone + noise
tt=t(2.0); f=200*np.exp(tt*1.6); ch=np.sin(2*np.pi*np.cumsum(f)/SR)*(tt/2.0)**1.5+0.3*lp(noise(2.0),0.2)*(tt/2.0)
save('charge',ch)
# shatter
tt=t(0.9); sh=noise(0.9)*np.exp(-tt*7); sh=sh-lp(sh,0.05)
save('shatter',sh)
# wind
tt=t(6.0); wd=lp(noise(6.0),0.03)*(0.6+0.4*np.sin(2*np.pi*0.3*tt))
save('wind',wd,0.5)
# slash: short bright swish
sl=whoosh(0.28,0.12,0.6); sl=sl-lp(sl,0.03)
save('slash',sl)
# heartbeat-ish low thump
tt=t(0.3); th=np.sin(2*np.pi*55*tt)*env(len(tt),0.002,0.07)
save('thump',th)
print(os.listdir(out))
