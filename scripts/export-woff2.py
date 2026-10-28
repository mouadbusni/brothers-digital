"""Export WOFF2 using fontTools and Node's already-installed Brotli codec."""
from pathlib import Path
import subprocess,json
from fontTools.ttLib import TTFont
from fontTools import subset
import fontTools.ttLib.woff2 as woff2
ROOT=Path(__file__).resolve().parents[1]
class NodeBrotli:
    MODE_FONT=2
    MODE_TEXT=1
    @staticmethod
    def compress(data,mode=0):
        script="const z=require('node:zlib');const f=require('node:fs');process.stdout.write(z.brotliCompressSync(f.readFileSync(0),{params:{[z.constants.BROTLI_PARAM_MODE]:"+str(mode)+",[z.constants.BROTLI_PARAM_QUALITY]:11}}));"
        return subprocess.run(['node','-e',script],input=data,stdout=subprocess.PIPE,check=True).stdout
    @staticmethod
    def decompress(data):
        return subprocess.run(['node','-e',"const z=require('node:zlib');process.stdout.write(z.brotliDecompressSync(require('node:fs').readFileSync(0)));"],input=data,stdout=subprocess.PIPE,check=True).stdout
woff2.haveBrotli=True
woff2.brotli=NodeBrotli
for weight in ['regular','bold']:
    source=ROOT/'site-source'/'assets'/f'studio-{weight}.otf'
    target=ROOT/'public'/'assets'/f'studio-{weight}.woff2'
    font=TTFont(source);cmap=font.getBestCmap()
    unicode_set={u for u in cmap if u<=0x17f or 0x2000<=u<=0x206f or 0x20a0<=u<=0x20cf or 0x2190<=u<=0x22ff}
    options=subset.Options()
    options.name_IDs=[0,1,2,3,4,5,6,13,14]
    options.layout_features=['*']
    sub=subset.Subsetter(options=options);sub.populate(unicodes=unicode_set);sub.subset(font)
    expected=font.getBestCmap().copy()
    font.flavor='woff2';font.save(target)
    check=TTFont(target)
    assert check.getBestCmap()==expected
    assert all(u in check.getBestCmap() for u in unicode_set)
    assert check['head'].unitsPerEm==TTFont(source)['head'].unitsPerEm
    font.flavor='woff';font.save(ROOT/'public'/'assets'/f'studio-{weight}.woff')
    print(target.name,target.stat().st_size)
reportpath=ROOT/'docs'/'asset-optimization.json'
report=json.loads(reportpath.read_text())
report['exports']=[x for x in report['exports'] if not x['file'].endswith(('.woff2','.woff'))]
for f in (ROOT/'public'/'assets').glob('*.woff*'):
    report['exports'].append({'file':f.name,'bytes':f.stat().st_size})
report['after_bytes']=sum(f.stat().st_size for f in (ROOT/'public'/'assets').iterdir() if f.is_file())
report['reduction_percent']=round((1-report['after_bytes']/report['before_bytes'])*100,2)
report['notes']=['WOFF fallbacks retained for integration convenience; WOFF2 is preferred.','French/English Latin, Latin Extended-A, punctuation, currency and arrow/mathematical glyph subsets retained; character maps and em metrics round-trip validated.']
reportpath.write_text(json.dumps(report,indent=2)+'\n')
