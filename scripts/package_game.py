"""Package the tested production build without development-only or restricted art."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib, json, subprocess

root = Path(__file__).resolve().parents[1]
dist = root/'dist'
assert (dist/'index.html').is_file(), 'Execute npm run build primeiro.'
for forbidden in ['interiors.png','rooms.png','village.png','Modern-Interiors-LICENSE.txt']:
    assert not (dist/'assets'/forbidden).exists(), 'Recurso antigo não deve ser distribuído: '+forbidden
out = root/'downloads'
out.mkdir(exist_ok=True)
path = out/'Valdora-jogavel.zip'
files = []
with ZipFile(path,'w',compression=ZIP_DEFLATED) as z:
    for p in sorted(dist.rglob('*')):
        if p.is_file():
            name = 'Valdora-LPC/jogar/'+str(p.relative_to(dist))
            data=p.read_bytes()
            z.writestr(name,data)
            files.append({'path':name,'sha256':hashlib.sha256(data).hexdigest()})
    for name in ['JOGAR.py','JOGAR.sh','JOGAR.cmd','COMO_TESTAR.md','CREDITS.md']:
        z.write(root/name,'Valdora-LPC/'+name)
    revision = subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
    z.writestr('Valdora-LPC/BUILD.json',json.dumps({'source_commit':revision,'files':files},indent=2))
print(path, round(path.stat().st_size/1024/1024,2),'MiB')
