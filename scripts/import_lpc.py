"""Import a small, auditable subset of the official LPC repository.
Usage: python3 scripts/import_lpc.py /path/to/OpenGameArt-LiberatedPixelCup
Original PNGs are copied byte-for-byte, never resized or palette-remapped.
"""
from pathlib import Path
import sys, shutil, hashlib, json

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
out = root / 'public/assets/lpc'
out.mkdir(parents=True, exist_ok=True)
files = {
 'house': 'Sharm/building-exterior/house.png',
 'inside': 'Sharm/building-interior/inside.png',
 'kitchen': 'Sharm/building-interior/kitchen.png',
 'country': 'Sharm/building-interior/country.png',
 'cabinets': 'Sharm/building-interior/cabinets.png',
 'stairs': 'Sharm/building-interior/stairs.png',
 'grass': 'Sharm/outdoor/PNG/grass.png',
 'dirt': 'Sharm/outdoor/PNG/dirt.png',
 'tree': 'Sharm/outdoor/PNG/treetop.png',
 'trunk': 'Sharm/outdoor/PNG/trunk.png',
 'barrel': 'Sharm/object/barrel.png',
 'signs': 'Sharm/object/signs.png',
 'floors': 'HughSpectrum/castlefloors.png',
}
manifest = []
for name, relative in files.items():
    path = source / 'tileset/original' / relative
    shutil.copyfile(path, out / (name+'.png'))
    manifest.append({'file':name+'.png','source_path':'tileset/original/'+relative,
      'author':'Lanea Zimmerman (Sharm)' if relative.startswith('Sharm/') else 'Daniel Armstrong (HughSpectrum)',
      'license':'CC-BY-SA-3.0','source_commit':'f61104a1ecc54e7bce54b82ada7d7ba4c41bc524',
      'source_url':'https://github.com/OpenGameArt/LiberatedPixelCup',
      'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
shutil.copyfile(source/'LICENSE-CC-BY-SA-3.0.txt',out/'LICENSE-CC-BY-SA-3.0.txt')
shutil.copyfile(source/'tileset/original/authors.md',out/'AUTHORS.md')
(out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Imported',len(manifest),'LPC files. License: CC BY-SA 3.0, commercial use with attribution/share-alike.')
