#!/usr/bin/env python3
"""
generate-og.py — DeftBrain OG Image Generator
Reads tools.js, generates 1200×630 Open Graph cards for every tool,
and writes them to public/og/.

Usage:
  python3 generate-og.py                  # generate all (incremental)
  python3 generate-og.py --force          # regenerate everything
  python3 generate-og.py BillRescue       # regenerate one tool by ID
  python3 generate-og.py --default-only   # regenerate only default.png

Incremental by default: tools whose PNG is newer than tools.js are
skipped. Pass --force after a template design change to rebuild all.

Requirements:
  pip install Pillow
  NotoColorEmoji.ttf + DejaVuSans fonts (standard on Ubuntu/Debian)
  Logo files: src/assets/pBrain-l.png, src/assets/pBrain-r.png

Slug source of truth: src/data/tool-og-slugs.json
  Same map is also imported by scripts/prerender.js and
  src/hooks/useDocumentHead.js. Tools missing from the JSON map are
  skipped here (and get the default OG image in prerender.js).

Font paths are for Ubuntu/Debian. Update if on a different OS.
"""

import re
import os
import sys
import json
import io
import urllib.request
from pathlib import Path
from collections import deque
from PIL import Image, ImageDraw, ImageFont

# ── Configuration ────────────────────────────────────────────────────────────

# Find project root by walking up — same approach as scripts/prerender.js.
# Lets the script work whether it lives in scripts/ or at project root.
def _find_project_root(start):
    p = Path(start).resolve()
    while p.parent != p:
        if (p / 'package.json').exists() and (p / 'src').exists():
            return p
        p = p.parent
    raise FileNotFoundError(f'Could not find project root above {start}')

_HERE          = Path(__file__).parent.resolve()
_ROOT          = _find_project_root(_HERE)
TOOLS_JS_PATH  = str(_ROOT / 'src/data/tools.js')
SLUG_MAP_PATH  = str(_ROOT / 'src/data/tool-og-slugs.json')
LOGO_PATH      = str(_ROOT / 'src/assets/pBrain-l.png')
OUTPUT_DIR     = str(_ROOT / 'public/og')

BASE_URL       = 'https://deftbrain.com'

# ── Slug map: shared source of truth ─────────────────────────────────────────
# Tool ID → kebab-slug. Must match src/data/tool-og-slugs.json which is also
# imported by scripts/prerender.js and src/hooks/useDocumentHead.js.
# Adding a new tool? Add its slug entry there. Tools missing from the map
# are skipped here so they don't get filenames that prerender.js can't find.
with open(SLUG_MAP_PATH) as _f:
    TOOL_OG_SLUGS = json.load(_f)

def _find_font(candidates):
    for p in candidates:
        if os.path.exists(p):
            return p
    raise FileNotFoundError(f"None of these fonts found:\n" + "\n".join(f"  {p}" for p in candidates))

FONT_EMOJI = _find_font([
    '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf',           # Ubuntu/Debian
    '/usr/share/fonts/noto/NotoColorEmoji.ttf',
    '/opt/homebrew/share/fonts/NotoColorEmoji.ttf',                 # Homebrew macOS
    '/Library/Fonts/NotoColorEmoji.ttf',                            # macOS manual install
])

FONT_BOLD = _find_font([
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',         # Ubuntu/Debian
    '/opt/homebrew/share/fonts/dejavu-fonts/DejaVuSans-Bold.ttf',   # Homebrew macOS
    '/Library/Fonts/DejaVuSans-Bold.ttf',
    '/System/Library/Fonts/Helvetica.ttc',                          # macOS fallback
])

FONT_REG = _find_font([
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',              # Ubuntu/Debian
    '/opt/homebrew/share/fonts/dejavu-fonts/DejaVuSans.ttf',        # Homebrew macOS
    '/Library/Fonts/DejaVuSans.ttf',
    '/System/Library/Fonts/Helvetica.ttc',                          # macOS fallback
])

W, H   = 1200, 630
PAD    = 80

# ── Font loading ─────────────────────────────────────────────────────────────

emoji_font = ImageFont.truetype(FONT_EMOJI, 109)
title_font = ImageFont.truetype(FONT_BOLD,  72)
title_sm   = ImageFont.truetype(FONT_BOLD,  54)
tag_font   = ImageFont.truetype(FONT_REG,   38)
sub_font   = ImageFont.truetype(FONT_REG,   32)
brand_font = ImageFont.truetype(FONT_REG,   28)
head_font  = ImageFont.truetype(FONT_BOLD,  80)
tag_lg     = ImageFont.truetype(FONT_REG,   42)

# ── Logo preparation ─────────────────────────────────────────────────────────

def make_transparent_logo(path):
    """Load logo — expects a real RGBA PNG with transparent background."""
    logo = Image.open(path).convert('RGBA')
    return logo


def load_logo(h=90):
    logo = make_transparent_logo(LOGO_PATH)
    w = int(logo.width * (h / logo.height))
    return logo.resize((w, h), Image.LANCZOS), w


# ── Canvas factory ────────────────────────────────────────────────────────────

def make_canvas():
    """Dark navy→indigo gradient with left accent bar."""
    canvas = Image.new('RGBA', (W, H))
    for y in range(H):
        t = y / H
        r = int(13 + t*14)
        g = max(0, int(16 - t*6))
        b = int(51 + t*28)
        canvas.paste(Image.new('RGBA', (W, 1), (r, g, b, 255)), (0, y))
    for y in range(H):
        t = y / H
        ac = (int(120+t*50), int(60+t*20), int(220-t*30), 255)
        for x in range(6):
            canvas.putpixel((x, y), ac)
    return canvas


# ── Text helpers ──────────────────────────────────────────────────────────────

def wrap_text(draw, text, font, max_w):
    words = text.split()
    lines, line = [], ''
    for word in words:
        test = (line + ' ' + word).strip()
        if draw.textlength(test, font=font) > max_w:
            if line:
                lines.append(line)
            line = word
        else:
            line = test
    if line:
        lines.append(line)
    return lines


# ── Card renderers ────────────────────────────────────────────────────────────

EMOJI_CACHE_DIR  = str(_ROOT / 'og-emoji-cache')
TWEMOJI_LOCAL    = str(_ROOT / 'public/twemoji/svg')   # SVGs bundled with the app
TWEMOJI_LOCAL_72 = str(_ROOT / 'public/twemoji/72x72') # PNGs if present


def emoji_to_twemoji_filename(emoji):
    """Convert emoji string to Twemoji filename stem (handles VS-16 and ZWJ sequences)."""
    codepoints = []
    for char in emoji:
        cp = ord(char)
        if cp == 0xFE0F:   # VS-16 variation selector — Twemoji omits it
            continue
        codepoints.append(f'{cp:x}')
    return '-'.join(codepoints)


def draw_emoji_twemoji(canvas, emoji, x, y, size=109, verbose=False):
    """
    Draw an emoji using a Twemoji PNG — reliable on all platforms.

    Resolution order:
      1. og-emoji-cache/   — previously downloaded PNGs
      2. public/twemoji/   — PNGs or SVGs already bundled with the app
      3. CDN download      — jsdelivr, saved to cache for next run
      4. Font rendering    — last resort (unreliable on macOS)
    """
    os.makedirs(EMOJI_CACHE_DIR, exist_ok=True)
    filename = emoji_to_twemoji_filename(emoji)
    cache_path = os.path.join(EMOJI_CACHE_DIR, f'{filename}.png')

    img = None
    source = None

    # 1. Try download cache
    if os.path.exists(cache_path):
        try:
            img = Image.open(cache_path).convert('RGBA')
            source = f'cache ({cache_path})'
        except Exception:
            img = None

    # 2. Try local bundled twemoji (PNG 72x72 first, then SVG)
    if img is None:
        for local_dir, ext in [(TWEMOJI_LOCAL_72, '.png'), (TWEMOJI_LOCAL, '.svg')]:
            local_path = os.path.join(local_dir, f'{filename}{ext}')
            if os.path.exists(local_path) and ext == '.png':
                try:
                    img = Image.open(local_path).convert('RGBA')
                    source = f'local ({local_path})'
                    img.save(cache_path)  # cache it for next time
                    break
                except Exception:
                    pass

    # 3. Try CDN download
    if img is None:
        url = f'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/72x72/{filename}.png'
        try:
            with urllib.request.urlopen(url, timeout=8) as resp:
                data = resp.read()
            img = Image.open(io.BytesIO(data)).convert('RGBA')
            img.save(cache_path)
            source = f'CDN ({url})'
        except Exception as e:
            print(f'  ⚠️  CDN download failed for \'{emoji}\' ({filename}): {e}')

    # 4. Fall back to font rendering (unreliable on macOS)
    if img is None:
        if verbose:
            print(f'  ⚠️  All PNG sources failed for \'{emoji}\' — trying font fallback')
        try:
            overlay = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
            odraw   = ImageDraw.Draw(overlay)
            odraw.text((x, y), emoji, font=emoji_font, embedded_color=True)
            canvas.alpha_composite(overlay)
        except Exception as e:
            print(f'  ❌  Font fallback also failed for \'{emoji}\': {e}')
        return

    if verbose:
        print(f'  ✓  Emoji \'{emoji}\' loaded from {source}')

    # Scale to desired size and paste
    img = img.resize((size, size), Image.LANCZOS)
    canvas.paste(img, (x, y), img)


def make_tool_card(emoji, title, tagline, out_path, logo_img, logo_w, verbose=False):
    canvas = make_canvas()
    draw   = ImageDraw.Draw(canvas)

    # Emoji — use Twemoji PNG (reliable on all platforms)
    draw_emoji_twemoji(canvas, emoji, PAD, PAD - 10, verbose=verbose)
    draw = ImageDraw.Draw(canvas)  # re-acquire after paste

    # Title — shrink font if too wide
    tfont  = title_font if draw.textlength(title, font=title_font) < W - PAD*2 - 20 else title_sm
    draw.text((PAD, PAD + 118), title, font=tfont, fill=(255, 255, 255, 255))
    title_h = 72 if tfont == title_font else 54

    # Tagline (max 3 lines)
    lines = wrap_text(draw, tagline, tag_font, W - PAD*2 - 20)
    y_tag = PAD + 118 + title_h + 22
    for ln in lines[:3]:
        draw.text((PAD, y_tag), ln, font=tag_font, fill=(160, 140, 220, 255))
        y_tag += 52

    # Logo + domain
    canvas.paste(logo_img, (W - logo_w - PAD, H - 90 - PAD + 5), logo_img)
    draw.text((PAD, H - 44), 'deftbrain.com', font=brand_font, fill=(100, 90, 160, 255))

    canvas.convert('RGB').save(out_path, 'PNG', optimize=True)


def make_default_card(out_path, logo_img, logo_w):
    canvas = make_canvas()
    draw   = ImageDraw.Draw(canvas)

    # Top-left brain — right-facing salmon brain image (pBrain-r.png), NOT an emoji
    top_brain_path = str(_ROOT / 'src/assets/pBrain-r.png')
    try:
        top_brain = Image.open(top_brain_path).convert('RGBA')
        tb_h = 90
        tb_w = int(top_brain.width * (tb_h / top_brain.height))
        top_brain = top_brain.resize((tb_w, tb_h), Image.LANCZOS)
        canvas.paste(top_brain, (PAD, PAD - 10), top_brain)
        draw = ImageDraw.Draw(canvas)  # re-acquire after paste
    except Exception as e:
        print(f"  ⚠️  Top-left brain logo failed ({top_brain_path}): {e}")

    # Wordmark
    draw.text((PAD, PAD + 120), 'DeftBrain', font=head_font, fill=(255, 255, 255, 255))

    # Tagline
    draw.text((PAD, PAD + 225), 'Intelligence on Demand', font=tag_lg, fill=(160, 140, 220, 255))

    # Rule
    draw.rectangle([(PAD, PAD + 285), (W - PAD, PAD + 287)], fill=(80, 70, 140, 255))

    # Sub-tagline
    draw.text((PAD, PAD + 300), '100+ free AI-powered tools for real life', font=sub_font, fill=(120, 110, 180, 255))

    # Logo + domain
    canvas.paste(logo_img, (W - logo_w - PAD, H - 100 - PAD + 5), logo_img)
    draw.text((PAD, H - 44), 'deftbrain.com', font=brand_font, fill=(100, 90, 160, 255))

    canvas.convert('RGB').save(out_path, 'PNG', optimize=True)


# ── Tool extraction ───────────────────────────────────────────────────────────

def extract_tools(tools_js_path):
    src    = open(tools_js_path).read()
    blocks = re.split(r'\n\{[\s\n]*\n?\s*modified:', src)
    tools  = []
    skipped_unmapped = []
    for block in blocks[1:]:
        id_m       = re.search(r'id:\s*[\"\'](.*?)[\"\']', block)
        title_m    = re.search(r'title:\s*[\"\'](.*?)[\"\']', block)
        tagline_m  = re.search(r'tagline:\s*[\"\'](.*?)[\"\']', block)
        icon_m     = re.search(r'icon:\s*[\"\'](.*?)[\"\']', block)
        # ogIcon overrides icon for OG image generation only. Use when the
        # tool page icon is a compound or unsupported emoji that the OG
        # asset pipeline can't resolve (e.g. multi-emoji '👗👔' has no PNG).
        ogIcon_m   = re.search(r'ogIcon:\s*[\"\'](.*?)[\"\']', block)
        if id_m and title_m and tagline_m and icon_m and id_m.group(1):
            tool_id = id_m.group(1)
            slug = TOOL_OG_SLUGS.get(tool_id)
            if slug is None:
                skipped_unmapped.append(tool_id)
                continue
            og_icon = ogIcon_m.group(1) if ogIcon_m else icon_m.group(1)
            tools.append({
                'id':      tool_id,
                'title':   title_m.group(1),
                'tagline': tagline_m.group(1),
                'icon':    og_icon,
                'slug':    slug,
            })
    if skipped_unmapped:
        print(f'⚠ {len(skipped_unmapped)} tool(s) skipped — not in tool-og-slugs.json:')
        for tid in skipped_unmapped:
            print(f'    {tid}')
        print('  Add them to src/data/tool-og-slugs.json to enable OG generation.')
    return tools


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    args         = sys.argv[1:]
    default_only = '--default-only' in args
    force        = '--force' in args
    filter_ids   = [a for a in args if not a.startswith('--')]

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print('Loading logo...')
    logo_img, logo_w = load_logo(h=90)
    logo_lg,  logo_lw = load_logo(h=100)

    # Default card — always regenerated; cheap and rare
    default_path = os.path.join(OUTPUT_DIR, 'default.png')
    print('Generating default.png...')
    make_default_card(default_path, logo_lg, logo_lw)
    print(f'  ✓ {default_path}')

    if default_only:
        return

    # Tool cards
    print(f'Reading {TOOLS_JS_PATH}...')
    tools = extract_tools(TOOLS_JS_PATH)

    if filter_ids:
        tools = [t for t in tools if t['id'] in filter_ids]
        if not tools:
            print(f'No matching tools found for: {filter_ids}')
            sys.exit(1)

    # Incremental: skip tools whose PNG is newer than tools.js (unless --force).
    # filter_ids implies an explicit regen request, so skip the skip.
    tools_mtime = os.path.getmtime(TOOLS_JS_PATH)
    generated, skipped = 0, 0

    print(f'Processing {len(tools)} tool card(s)...')
    slug_map = {}
    for i, tool in enumerate(tools):
        out_path = os.path.join(OUTPUT_DIR, f"{tool['slug']}.png")
        slug_map[tool['id']] = tool['slug']

        if not force and not filter_ids and os.path.exists(out_path):
            if os.path.getmtime(out_path) >= tools_mtime:
                skipped += 1
                continue

        make_tool_card(tool['icon'], tool['title'], tool['tagline'], out_path, logo_img, logo_w, verbose=bool(filter_ids))
        generated += 1
        if (generated % 10 == 0) or filter_ids:
            print(f'  ✓ {tool["slug"]}  ({i+1}/{len(tools)})')

    # Write slug map alongside images for reference
    slug_map_path = os.path.join(OUTPUT_DIR, 'slug-map.json')
    with open(slug_map_path, 'w') as f:
        json.dump(slug_map, f, indent=2)

    print(f'\nDone — {generated} generated, {skipped} skipped (up-to-date).')
    print(f'Slug map: {slug_map_path}')


if __name__ == '__main__':
    main()
