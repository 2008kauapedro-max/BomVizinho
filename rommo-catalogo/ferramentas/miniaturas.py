"""Cria a versão leve (-p.webp, 320 px) de cada foto em assets/produtos.
Uso: python3 ferramentas/miniaturas.py   (rodar na pasta rommo-catalogo)"""
from pathlib import Path
from PIL import Image
pasta = Path(__file__).resolve().parent.parent / "assets" / "produtos"
for f in sorted(pasta.glob("*.webp")):
    if f.stem.endswith("-p"): continue
    im = Image.open(f).convert("RGB")
    if max(im.size) > 800: im.thumbnail((800, 800), Image.LANCZOS); im.save(f, "WEBP", quality=82, method=6)
    p = im.copy(); p.thumbnail((320, 320), Image.LANCZOS)
    p.save(f.with_name(f.stem + "-p.webp"), "WEBP", quality=76, method=6)
    print(f.name, "->", f.stem + "-p.webp")
