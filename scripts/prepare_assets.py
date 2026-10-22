"""Extract original assets; no resampling, palette changes or sprite substitutions."""
from pathlib import Path
from zipfile import ZipFile
from PIL import Image
import json, shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'ProjetoValdora'
OUT = ROOT / 'public/assets'
OUT.mkdir(parents=True, exist_ok=True)
report = {}
for folder, key in [('Protagonista','hero'),('DonaRosa','rosa'),('Lia','lia'),('Daniel','daniel')]:
    with ZipFile(next((SOURCE / folder).glob('*.zip'))) as z:
        for anim in ['walk','idle']:
            data = z.read(f'standard/{anim}.png')
            (OUT / f'{key}-{anim}.png').write_bytes(data)
            im = Image.open(OUT / f'{key}-{anim}.png')
            assert im.size == (832,256), (folder,anim,im.size)
            # Validate the populated cells instead of animating transparent tail columns.
            report[f'{key}-{anim}'] = {'size': im.size, 'cell':64, 'populated': [[c for c in range(13) if im.crop((c*64,r*64,c*64+64,r*64+64)).getbbox()] for r in range(4)]}
        for n in ['character.json','credits/credits.txt','credits/credits.csv','credits/metadata.json']:
            (OUT / f'{key}-{n.replace("/","-")}').write_bytes(z.read(n))
for folder,key in [('DonaRosa','rosa'),('Lia','lia'),('Daniel','daniel')]:
    shutil.copyfile(SOURCE / 'RetratoMaisDetalhadoDosPersonagens' / f'{folder}.png', OUT / f'{key}-portrait.png')
(OUT / 'inspection.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
