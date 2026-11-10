#!/usr/bin/env python3
import os
import math
from PIL import Image, ImageDraw, ImageFont

def create_gradient(width, height, top_color, bottom_color):
    base = Image.new('RGBA', (width, height), top_color)
    top_r, top_g, top_b, top_a = top_color
    bot_r, bot_g, bot_b, bot_a = bottom_color
    
    draw = ImageDraw.Draw(base)
    for y in range(height):
        factor = y / float(height)
        r = int(top_r + (bot_r - top_r) * factor)
        g = int(top_g + (bot_g - top_g) * factor)
        b = int(top_b + (bot_b - top_b) * factor)
        a = int(top_a + (bot_a - top_a) * factor)
        draw.line([(0, y), (width, y)], fill=(r, g, b, a))
    return base

def draw_rupee_symbol(draw, cx, cy, size, fill_color, stroke_width=None):
    """
    Draw a clean, geometric Indian Rupee symbol (₹) using vector primitives.
    """
    if stroke_width is None:
        stroke_width = max(int(size * 0.12), 4)

    w = size * 0.65
    h = size * 0.85
    left = cx - w / 2
    right = cx + w / 2
    top = cy - h / 2
    
    bar1_y = top
    bar2_y = top + stroke_width * 1.5
    
    # 1. Top horizontal bar
    draw.line([(left, bar1_y), (right, bar1_y)], fill=fill_color, width=stroke_width)
    
    # 2. Second horizontal bar
    draw.line([(left, bar2_y), (right, bar2_y)], fill=fill_color, width=stroke_width)
    
    # 3. Vertical stem (upper part)
    arc_radius = (bar2_y + stroke_width * 2 - bar1_y)
    arc_center_y = bar1_y + stroke_width + arc_radius * 0.5
    mid_y = top + h * 0.48
    draw.line([(left + stroke_width / 2, bar1_y), (left + stroke_width / 2, mid_y)], fill=fill_color, width=stroke_width)
    
    # 4. Upper curve / loop of R
    arc_bbox = [
        left - stroke_width * 0.2,
        bar1_y,
        left + w * 0.85,
        mid_y
    ]
    draw.arc(arc_bbox, start=270, end=90, fill=fill_color, width=stroke_width)
    draw.line([(left + stroke_width / 2, mid_y), (left + w * 0.35, mid_y)], fill=fill_color, width=stroke_width)
    
    # 5. Diagonal leg
    leg_start_x = left + w * 0.25
    leg_start_y = mid_y - stroke_width * 0.3
    leg_end_x = right
    leg_end_y = top + h
    draw.line([(leg_start_x, leg_start_y), (leg_end_x, leg_end_y)], fill=fill_color, width=stroke_width)

def generate_app_icon():
    size = 1024
    # Deep premium emerald green gradient
    img = create_gradient(size, size, (0, 150, 95, 255), (0, 75, 45, 255))
    draw = ImageDraw.Draw(img)

    # Decorative concentric circles for financial/security aesthetic
    cx, cy = size // 2, size // 2
    
    # Outer subtle ring
    draw.ellipse([cx - 420, cy - 420, cx + 420, cy + 420], outline=(255, 255, 255, 25), width=6)
    draw.ellipse([cx - 370, cy - 370, cx + 370, cy + 370], outline=(255, 255, 255, 40), width=10)
    
    # Inner glowing circular container
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    
    # Rounded badge container
    badge_size = 560
    bx0 = cx - badge_size // 2
    by0 = cy - badge_size // 2
    bx1 = cx + badge_size // 2
    by1 = cy + badge_size // 2
    
    # Soft badge shadow
    glow_draw.rounded_rectangle([bx0 + 10, by0 + 20, bx1 + 10, by1 + 20], radius=150, fill=(0, 35, 20, 100))
    # Badge base
    glow_draw.rounded_rectangle([bx0, by0, bx1, by1], radius=150, fill=(255, 255, 255, 35), outline=(255, 255, 255, 80), width=8)
    
    # Inner emerald core
    core_pad = 28
    glow_draw.rounded_rectangle([bx0 + core_pad, by0 + core_pad, bx1 - core_pad, by1 - core_pad], radius=125, fill=(0, 135, 90, 255))
    
    # Composite badge
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)
    
    # Draw Bold White Rupee Symbol
    draw_rupee_symbol(draw, cx, cy, size=300, fill_color=(255, 255, 255, 255), stroke_width=38)
    
    # Save main icon
    out_path = 'assets/images/icon.png'
    img.save(out_path, 'PNG')
    print(f"Generated {out_path}")

def generate_android_icons():
    # Android Foreground: 432x432 with transparent background
    size = 432
    cx, cy = size // 2, size // 2
    fg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(fg)
    
    badge_size = 240
    bx0 = cx - badge_size // 2
    by0 = cy - badge_size // 2
    bx1 = cx + badge_size // 2
    by1 = cy + badge_size // 2
    
    # Shadow
    draw.rounded_rectangle([bx0, by0 + 10, bx1, by1 + 10], radius=65, fill=(0, 40, 25, 80))
    # Badge
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=65, fill=(0, 135, 90, 255), outline=(255, 255, 255, 120), width=4)
    # Rupee Symbol
    draw_rupee_symbol(draw, cx, cy, size=130, fill_color=(255, 255, 255, 255), stroke_width=16)
    
    fg_path = 'assets/images/android-icon-foreground.png'
    fg.save(fg_path, 'PNG')
    print(f"Generated {fg_path}")
    
    # Android Background: 432x432 solid/gradient
    bg = create_gradient(size, size, (0, 150, 95, 255), (0, 75, 45, 255))
    bg_path = 'assets/images/android-icon-background.png'
    bg.save(bg_path, 'PNG')
    print(f"Generated {bg_path}")
    
    # Monochrome icon: 432x432
    mono = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    mono_draw = ImageDraw.Draw(mono)
    draw_rupee_symbol(mono_draw, cx, cy, size=150, fill_color=(255, 255, 255, 255), stroke_width=18)
    mono_path = 'assets/images/android-icon-monochrome.png'
    mono.save(mono_path, 'PNG')
    print(f"Generated {mono_path}")

def generate_splash_icon():
    size = 512
    cx, cy = size // 2, size // 2
    splash = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(splash)
    
    badge_size = 320
    bx0 = cx - badge_size // 2
    by0 = cy - badge_size // 2
    bx1 = cx + badge_size // 2
    by1 = cy + badge_size // 2
    
    # Soft drop shadow
    draw.rounded_rectangle([bx0, by0 + 12, bx1, by1 + 12], radius=85, fill=(0, 40, 25, 90))
    # Emerald rounded badge
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=85, fill=(0, 135, 90, 255), outline=(255, 255, 255, 80), width=6)
    # Rupee Symbol
    draw_rupee_symbol(draw, cx, cy, size=180, fill_color=(255, 255, 255, 255), stroke_width=22)
    
    splash_path = 'assets/images/splash-icon.png'
    splash.save(splash_path, 'PNG')
    print(f"Generated {splash_path}")

def generate_favicon():
    size = 64
    cx, cy = size // 2, size // 2
    fav = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(fav)
    
    draw.rounded_rectangle([2, 2, size - 2, size - 2], radius=16, fill=(0, 135, 90, 255))
    draw_rupee_symbol(draw, cx, cy, size=38, fill_color=(255, 255, 255, 255), stroke_width=5)
    
    fav_path = 'assets/images/favicon.png'
    fav.save(fav_path, 'PNG')
    print(f"Generated {fav_path}")

if __name__ == '__main__':
    generate_app_icon()
    generate_android_icons()
    generate_splash_icon()
    generate_favicon()
    print("All icons successfully generated!")

