#!/usr/bin/env python3
import sys, os
from pathlib import Path

def main():
    if len(sys.argv) != 3:
        return 2
    src, dst = map(Path, sys.argv[1:])
    dst.parent.mkdir(parents=True, exist_ok=True)
    try:
        from PIL import Image, ImageOps
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im)
            if im.mode not in ('RGB','RGBA'):
                im = im.convert('RGBA' if 'A' in im.mode else 'RGB')
            max_side = 2200
            if max(im.size) > max_side:
                scale = max_side / max(im.size)
                im = im.resize((max(1, round(im.width*scale)), max(1, round(im.height*scale))), Image.Resampling.LANCZOS)
            if im.mode == 'RGBA':
                bg = Image.new('RGB', im.size, (255,255,255))
                bg.paste(im, mask=im.getchannel('A'))
                im = bg
            else:
                im = im.convert('RGB')
            im.save(dst, 'WEBP', quality=84, method=6)
        return 0
    except Exception:
        try:
            import shutil
            shutil.copy2(src, dst)
            return 0
        except Exception:
            return 1

if __name__ == '__main__':
    raise SystemExit(main())
