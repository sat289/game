import json,math
def L(n): return json.load(open(n+'.js'))['elements']
LAT0,LON0=16.9722,82.2376
KX=111320*math.cos(math.radians(LAT0)); KY=110574
def P(g): return (round((g['lon']-LON0)*KX,1), round(-(g['lat']-LAT0)*KY,1))  # x east, z south(+)
def pts(geom): return [P(g) for g in geom]
def flat(pl): return [int(round(v*10)) for p in pl for v in p]
def join(ways):
    ways=[list(w) for w in ways if len(w)>1]; rings=[]
    while ways:
        cur=ways.pop(0)
        ch=True
        while ch and cur[0]!=cur[-1]:
            ch=False
            for i,w in enumerate(ways):
                if w[0]==cur[-1]: cur+=w[1:]
                elif w[-1]==cur[-1]: cur+=w[::-1][1:]
                elif w[-1]==cur[0]: cur=w[:-1]+cur
                elif w[0]==cur[0]: cur=w[::-1][:-1]+cur
                else: continue
                ways.pop(i); ch=True; break
        if len(cur)>3: rings.append(cur)
    return rings
out={}
# roads
cls={'trunk':5,'trunk_link':4,'primary':5,'primary_link':4,'secondary':4,'secondary_link':3,'tertiary':3,'tertiary_link':3,'unclassified':3,'residential':2,'living_street':2,'service':1,'track':1,'footway':0,'path':0}
R=[]
for e in L('road'):
    t=e['tags']; h=t.get('highway')
    if h not in cls or cls[h]==0: continue
    br=1 if (t.get('bridge') in('yes','viaduct')) else 0
    lay=int(t.get('layer','0')) if t.get('layer','0').lstrip('-').isdigit() else 0
    R.append([cls[h],br*max(lay,1) if br else 0,t.get('name','')[:28],flat(pts(e['geometry']))])
out['roads']=R
# extra bridges from bridges.js not in roads
rid={e['id'] for e in L('road')}
for e in L('bridges'):
    t=e['tags']
    if e['id'] in rid or 'highway' not in t: continue
    out['roads'].append([cls.get(t['highway'],2),max(1,int(t.get('layer','1')) if t.get('layer','1').isdigit() else 1),t.get('name','')[:28],flat(pts(e['geometry']))])
# buildings
B=[]
def hgt(t):
    if 'height' in t:
        try: return float(str(t['height']).split()[0])
        except: pass
    if 'building:levels' in t:
        try: return float(t['building:levels'])*3.2+1
        except: pass
    return None
for e in L('buildings'):
    t=e.get('tags',{})
    if e['type']=='way': rings=[pts(e['geometry'])]
    else: rings=[join([pts(m['geometry']) for m in e['members'] if m['role']=='outer' and 'geometry' in m])][0]
    for r in rings:
        if r[0]!=r[-1]: continue
        h=hgt(t); B.append([h if h else 0, flat(r[:-1])])
out['buildings']=B
# water
W=[];WL=[]
for e in L('water'):
    t=e.get('tags',{})
    if e['type']=='node': continue
    if e['type']=='way': segs=[pts(e['geometry'])]
    else: segs=[pts(m['geometry']) for m in e['members'] if 'geometry' in m and m['role']in('outer','')]
    isarea=t.get('natural') in('water','wetland') or 'water' in t
    if isarea:
        rs=[segs[0]] if e['type']=='way' else join(segs)
        for r in rs:
            if r[0]==r[-1] and len(r)>3: W.append([1 if t.get('natural')=='wetland' else 0,flat(r[:-1])])
    else:
        wd=40 if t.get('waterway')=='river' else 14 if t.get('waterway')=='canal' else 5
        for s in segs: WL.append([wd,flat(s)])
out['water']=W; out['rivers']=WL
# sea polygon from coastline
ch=join([pts(e['geometry']) for e in L('coastline')]) if False else None
ways=[pts(e['geometry']) for e in L('coastline')]
# chain by endpoints
ways=[w for w in ways]; cur=ways.pop(0)
while ways:
    for i,w in enumerate(ways):
        if w[0]==cur[-1]: cur+=w[1:]
        elif w[-1]==cur[0]: cur=w[:-1]+cur
        else: continue
        ways.pop(i); break
    else: break
if cur[0][0]>cur[-1][0] and False: cur=cur[::-1]
# ensure south->north (z decreasing = north); z is south-positive
if cur[0][1]<cur[-1][1]: cur=cur[::-1]
out['coast']=flat(cur)
# parks
PK=[]
for e in L('parks'):
    if e['type']=='way' and e['geometry'][0]==e['geometry'][-1] and len(e['geometry'])>3: PK.append(flat(pts(e['geometry'])[:-1]))
out['parks']=PK
# pois
poi=[]
for n,k in [('restaurants','food'),('hospitals','hospital'),('shops','shop'),('schools','school'),('religious','worship'),('government','gov'),('transport','transport'),('parks','park')]:
    for e in L(n):
        t=e.get('tags',{}); nm=t.get('name')
        if not nm: continue
        if e['type']=='node': p=P(e)
        else:
            g=e['geometry']; p=P({'lat':sum(a['lat'] for a in g)/len(g),'lon':sum(a['lon'] for a in g)/len(g)})
        poi.append([k,nm[:30],int(p[0]*10),int(p[1]*10)])
out['poi']=poi
# trees
T=[]
for e in L('trees'):
    if e['type']=='node': T.append(P(e))
out['trees']=[]
json.dump(out,open('../data.json','w'),separators=(',',':'))
import os;print(os.path.getsize('../data.json'),{k:len(v) for k,v in out.items()})
xs=[v for r in out['roads'] for v in r[3][0::2]];zs=[v for r in out['roads'] for v in r[3][1::2]]
print(min(xs)/10,max(xs)/10,min(zs)/10,max(zs)/10)
print(sum(1 for r in R if r[1]),sorted(poi,key=lambda p:p[0])[:3])
