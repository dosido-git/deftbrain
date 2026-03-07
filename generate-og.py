#!/usr/bin/env python3
"""
generate-og.py — DeftBrain OG Image Generator
Reads tools.js, generates 1200×630 Open Graph cards for every tool,
and writes them to public/og/.

Usage:
  python3 generate-og.py                  # generate all tools + default
  python3 generate-og.py BillRescue       # regenerate one tool by ID
  python3 generate-og.py --default-only   # regenerate only default.png

Requirements:
  pip install Pillow numpy
  NotoColorEmoji.ttf + DejaVuSans fonts (standard on Ubuntu/Debian)
  Logo files: src/assets/logobrainonlyl.png (or update LOGO_PATH below)

Font paths are for Ubuntu/Debian. Update if on a different OS.
"""

import re
import os
import sys
import json
import numpy as np
from pathlib import Path
from collections import deque
from PIL import Image, ImageDraw, ImageFont

# ── Configuration ────────────────────────────────────────────────────────────

TOOLS_JS_PATH  = 'src/data/tools.js'
LOGO_PATH      = 'src/assets/logo-brain-only-l.png'
OUTPUT_DIR     = 'public/og'

BASE_URL       = 'https://deftbrain.com'

FONT_EMOJI     = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'
FONT_BOLD      = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_REG       = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

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
    """Remove white and black background from logo via edge flood-fill."""
    logo = Image.open(path).convert('RGBA')
    arr  = np.array(logo, dtype=np.uint8)
    H2, W2 = arr.shape[:2]
    visited = np.zeros((H2, W2), dtype=bool)

    def flood(seeds_fn, match_fn):
        queue = deque()
        for y in range(H2):
            for x in range(W2):
                if seeds_fn(x, y) and not visited[y, x] and match_fn(arr[y, x]):
                    queue.append((x, y))
                    visited[y, x] = True
        while queue:
            x, y = queue.popleft()
            arr[y, x, 3] = 0
            for dx, dy in [(1,0),(-1,0),(0,1),(0,-1)]:
                nx, ny = x+dx, y+dy
                if 0 <= nx < W2 and 0 <= ny < H2 and not visited[ny, nx] and match_fn(arr[ny, nx]):
                    visited[ny, nx] = True
                    queue.append((nx, ny))

    # Remove white background from all edges
    flood(
        lambda x, y: x == 0 or x == W2-1 or y == 0 or y == H2-1,
        lambda p: int(p[0]) > 200 and int(p[1]) > 200 and int(p[2]) > 200
    )
    # Remove black artifact from top-left corner
    flood(
        lambda x, y: x < 3 and y < 3,
        lambda p: int(p[0]) < 60 and int(p[1]) < 60 and int(p[2]) < 60
    )
    return Image.fromarray(arr)


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

def make_tool_card(emoji, title, tagline, out_path, logo_img, logo_w):
    canvas = make_canvas()
    draw   = ImageDraw.Draw(canvas)

    # Emoji
    draw.text((PAD, PAD - 10), emoji, font=emoji_font, embedded_color=True)

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

    # Brain emoji
    draw.text((PAD, PAD - 10), '🧠', font=emoji_font, embedded_color=True)

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

def id_to_slug(tool_id):
    """Convert CamelCase tool ID to kebab-case slug."""
    slug = re.sub(r'(?<!^)(?=[A-Z])', '-', tool_id).lower()
    return re.sub(r'[^a-z0-9-]', '-', slug).strip('-')


def extract_tools(tools_js_path):
    src    = open(tools_js_path).read()
    blocks = re.split(r'\n\{[\s\n]*\n?\s*modified:', src)
    tools  = []
    for block in blocks[1:]:
        id_m      = re.search(r'id:\s*[\"\'](.*?)[\"\']', block)
        title_m   = re.search(r'title:\s*[\"\'](.*?)[\"\']', block)
        tagline_m = re.search(r'tagline:\s*[\"\'](.*?)[\"\']', block)
        icon_m    = re.search(r'icon:\s*[\"\'](.*?)[\"\']', block)
        if id_m and title_m and tagline_m and icon_m and id_m.group(1):
            tools.append({
                'id':      id_m.group(1),
                'title':   title_m.group(1),
                'tagline': tagline_m.group(1),
                'icon':    icon_m.group(1),
                'slug':    id_to_slug(id_m.group(1)),
            })
    return tools


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    args         = sys.argv[1:]
    default_only = '--default-only' in args
    filter_ids   = [a for a in args if not a.startswith('--')]

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print('Loading logo...')
    logo_img, logo_w = load_logo(h=90)
    logo_lg,  logo_lw = load_logo(h=100)

    # Default card
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

    print(f'Generating {len(tools)} tool card(s)...')
    slug_map = {}
    for i, tool in enumerate(tools):
        out_path = os.path.join(OUTPUT_DIR, f"{tool['slug']}.png")
        make_tool_card(tool['icon'], tool['title'], tool['tagline'], out_path, logo_img, logo_w)
        slug_map[tool['id']] = tool['slug']
        if (i+1) % 10 == 0 or filter_ids:
            print(f'  ✓ {tool["slug"]}  ({i+1}/{len(tools)})')

    # Write slug map alongside images for reference
    slug_map_path = os.path.join(OUTPUT_DIR, 'slug-map.json')
    with open(slug_map_path, 'w') as f:
        json.dump(slug_map, f, indent=2)

    print(f'\nDone — {len(tools)} cards + default.png written to {OUTPUT_DIR}/')
    print(f'Slug map: {slug_map_path}')


if __name__ == '__main__':
    main()
