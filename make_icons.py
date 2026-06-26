#!/usr/bin/env python3
"""Génère les icônes placeholder icon192.png et icon512.png
Lancer : python3 make_icons.py  (nécessite Pillow)"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("pip install Pillow --break-system-packages")
    raise

def make_icon(size, path):
    img = Image.new('RGB', (size, size), color='#1D9E75')
    draw = ImageDraw.Draw(img)
    # Cercle blanc central
    margin = size // 6
    draw.ellipse([margin, margin, size - margin, size - margin], fill='#ffffff')
    # Lettre R
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', size // 3)
    except Exception:
        font = ImageFont.load_default()
    text = 'R'
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - tw) / 2, (size - th) / 2 - size * 0.02), text, fill='#1D9E75', font=font)
    img.save(path)
    print(f"Créé : {path}")

make_icon(192, 'icons/icon192.png')
make_icon(512, 'icons/icon512.png')
