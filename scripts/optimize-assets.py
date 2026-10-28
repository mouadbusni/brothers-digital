"""Reproducible non-creative asset export from the approved source files."""
from pathlib import Path
from collections import defaultdict
import math, json, subprocess
import numpy as np
from PIL import Image
from scipy import ndimage
from fontTools.ttLib import TTFont

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'site-source'/'assets'
OUT=ROOT/'public'/'assets'
OUT.mkdir(parents=True,exist_ok=True)
BEFORE=sum(p.stat().st_size for p in OUT.iterdir() if p.is_file())
exports=[]
def webp(name,width,quality):
    source=next(SRC.glob(name+'.*'))
    target=OUT/f'{name}-{width}.webp'
    subprocess.run(['convert',str(source),'-strip','-resize',f'{width}x','-quality',str(quality),'-define','webp:method=6',str(target)],check=True)
    im=Image.open(target)
    assert im.width==width
    if name=='sculpture': assert im.mode=='RGBA', 'Sculpture alpha must survive export'
    exports.append({'file':target.name,'bytes':target.stat().st_size,'dimensions':list(im.size)})
for name,sizes,q in [('sculpture',[640,1024],87),('identity',[800,1536],89),('portfolio',[640,1200],86),('amine',[640,1200],86),('archive',[640,1200],86)]:
    for width in sizes:webp(name,width,q)
for weight in ['regular','bold']:
    font=TTFont(SRC/f'studio-{weight}.otf')
    font.flavor='woff'
    target=OUT/f'studio-{weight}.woff'
    font.save(target)
    TTFont(target) # Round-trip validation.
    exports.append({'file':target.name,'bytes':target.stat().st_size})

# Trace boundaries of the approved raster silhouette without redesigning it.
rgb=np.asarray(Image.open(SRC/'brand-mark.png').convert('RGB')).astype(float)
main=rgb.mean(axis=2)>100
labels,n=ndimage.label(main)
sizes=np.bincount(labels.ravel())
main &= sizes[labels]>=32
olive=main & ((rgb[:,:,1]-rgb[:,:,0])>1) & ((rgb[:,:,1]-rgb[:,:,2])>10) & (rgb.mean(axis=2)<210)
labels,n=ndimage.label(olive);sizes=np.bincount(labels.ravel());olive &= sizes[labels]>=32
y,x=np.where(main);x0,y0,x1,y1=int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)
width,height=x1-x0,y1-y0
main=main[y0:y1,x0:x1];olive=olive[y0:y1,x0:x1]

def signed_area(points):
    return .5*sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(points,points[1:]+points[:1]))
def rdp(points,epsilon=.6):
    if len(points)<=2:return points
    a,b=np.asarray(points[0]),np.asarray(points[-1]);v=b-a
    distances=np.linalg.norm(np.asarray(points)-a,axis=1) if np.linalg.norm(v)<1e-10 else np.abs(v[0]*(np.asarray(points)-a)[:,1]-v[1]*(np.asarray(points)-a)[:,0])/np.linalg.norm(v)
    ix=int(np.argmax(distances))
    if distances[ix]<=epsilon:return [points[0],points[-1]]
    return rdp(points[:ix+1],epsilon)[:-1]+rdp(points[ix:],epsilon)
def contours(mask):
    h,w=mask.shape
    padded=np.pad(mask,1)
    edges=defaultdict(list)
    # Clockwise directed pixel edges; keep foreground on the right.
    for yy,xx in zip(*np.where(mask)):
        if not padded[yy,xx+1]:edges[(xx,yy)].append((xx+1,yy))
        if not padded[yy+1,xx+2]:edges[(xx+1,yy)].append((xx+1,yy+1))
        if not padded[yy+2,xx+1]:edges[(xx+1,yy+1)].append((xx,yy+1))
        if not padded[yy+1,xx]:edges[(xx,yy+1)].append((xx,yy))
    paths=[]
    while edges:
        start=next(iter(edges));cur=start;previous=None;poly=[]
        for _ in range(100000):
            poly.append(cur)
            candidates=edges[cur]
            if len(candidates)>1 and previous is not None:
                direction=(cur[0]-previous[0],cur[1]-previous[1])
                order={(1,0):0,(0,1):1,(-1,0):2,(0,-1):3}
                ranking={1:0,0:1,3:2,2:3}
                candidates.sort(key=lambda p:ranking[(order[(p[0]-cur[0],p[1]-cur[1])]-order[direction])%4])
            nxt=candidates.pop(0)
            if not candidates:del edges[cur]
            previous,cur=cur,nxt
            if cur==start:break
        else:raise RuntimeError('Unclosed contour')
        if len(poly)<6 or abs(signed_area(poly))<8:continue
        # Simplify each half independently so closed contours retain their shape.
        p0=np.asarray(poly[0]);ix=int(np.argmax(np.linalg.norm(np.asarray(poly)-p0,axis=1)))
        simplified=rdp(poly[:ix+1])[:-1]+rdp(poly[ix:]+[poly[0]])[:-1]
        paths.append(simplified)
    return paths

def path_data(polys):
    return ' '.join('M'+' '.join((f'{x:g},{y:g}' for x,y in p))+'Z' for p in polys)
main_paths=contours(main);olive_paths=contours(olive)
main_d,olive_d=path_data(main_paths),path_data(olive_paths)
geometry=f'<path fill="currentColor" fill-rule="evenodd" d="{main_d}"/><path fill="var(--logo-accent,#a3aa91)" fill-rule="evenodd" d="{olive_d}"/>'
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}"><g id="bd-mark">{geometry}</g></svg>\n'
(OUT/'brand-mark.svg').write_text(svg)
scale=66/width;ty=(100-height*scale)/2
favicon=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#202522"/><g color="#f2efe7" transform="translate(17 {ty:.3f}) scale({scale:.8f})">{geometry}</g></svg>\n'
(OUT/'favicon.svg').write_text(favicon)

# Verify traced polygon masks against the exact binary silhouette at native resolution.
from PIL import ImageDraw
raster=Image.new('1',(width,height));draw=ImageDraw.Draw(raster)
# Paint using even-odd parity rather than component orientation.
verified=np.zeros((height,width),dtype=bool)
for p in main_paths:
    piece=Image.new('1',(width,height));ImageDraw.Draw(piece).polygon(p,fill=1)
    verified ^= np.asarray(piece).astype(bool)
intersection=np.logical_and(main,verified).sum();union=np.logical_or(main,verified).sum()
iou=float(intersection/union)
assert iou>.985, f'Vector silhouette fidelity too low: {iou}'
for target in ['brand-mark.svg','favicon.svg']:
    exports.append({'file':target,'bytes':(OUT/target).stat().st_size})

# Production references will use replacements; retain all originals under site-source.
for name in ['sculpture.png','identity.png','brand-mark.png','portfolio.jpg','amine.jpg','archive.jpg','studio-regular.otf','studio-bold.otf']:
    (OUT/name).unlink(missing_ok=True)
AFTER=sum(p.stat().st_size for p in OUT.iterdir() if p.is_file())
report={'source':'site-source/assets','production':'public/assets','before_bytes':BEFORE,'after_bytes':AFTER,'reduction_percent':round((1-AFTER/BEFORE)*100,2),'logo_viewBox':f'0 0 {width} {height}','logo_native_silhouette_iou':round(iou,6),'exports':exports}
(ROOT/'docs'/'asset-optimization.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
