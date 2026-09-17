import os
import struct
import zlib

def create_png(width, height, draw_func):
    """순수 파이썬(표준 라이브러리)으로 PNG 아이콘을 생성하는 함수"""
    raw_data = bytearray()
    
    for y in range(height):
        raw_data.append(0)  # Filter type 0
        for x in range(width):
            r, g, b, a = draw_func(x, y, width, height)
            raw_data.extend([r, g, b, a])
            
    def make_chunk(chunk_type, data):
        length = len(data)
        crc = zlib.crc32(chunk_type + data) & 0xffffffff
        return struct.pack('>I', length) + chunk_type + data + struct.pack('>I', crc)

    header = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr = make_chunk(b'IHDR', ihdr_data)
    
    compressed = zlib.compress(bytes(raw_data), level=9)
    idat = make_chunk(b'IDAT', compressed)
    iend = make_chunk(b'IEND', b'')
    
    return header + ihdr + idat + iend

def draw_meditation_icon(x, y, w, h):
    nx = x / (w - 1) if w > 1 else 0
    ny = y / (h - 1) if h > 1 else 0
    
    # 둥근 사각형 모서리
    r = 0.22
    pad = 0.05
    cx = min(max(nx, pad + r), 1.0 - pad - r)
    cy = min(max(ny, pad + r), 1.0 - pad - r)
    dist = ((nx - cx)**2 + ((ny - cy)**2))**0.5
    
    if dist > r:
        return (0, 0, 0, 0)
    
    # 배경: 딥 인디고-바이올렛 그라데이션 (#1e1b4b -> #312e81)
    base_r = int(30 + (49 - 30) * ny)
    base_g = int(27 + (46 - 27) * ny)
    base_b = int(75 + (129 - 75) * ny)
    
    # 펼쳐진 성경책 실루엣 (좌우 페이지)
    # y: 0.32 ~ 0.72, x: 0.20 ~ 0.80
    if 0.30 <= ny <= 0.70 and 0.20 <= nx <= 0.80:
        center_x = 0.50
        dx = abs(nx - center_x)
        # 펼쳐진 곡선
        curve = 0.05 * (1.0 - (dx / 0.30)**2) if dx <= 0.30 else 0
        spine_gap = 0.02
        if dx > spine_gap and (0.34 - curve) <= ny <= (0.68 - curve):
            # 골드/따뜻한 크림색 페이지 (#fef3c7)
            return (254, 243, 199, 255)
            
    # 중앙 빛나는 십자가/별빛 효과 (x: 0.50, y: 0.25)
    star_dist = ((nx - 0.50)**2 + (ny - 0.24)**2)**0.5
    if star_dist < 0.08:
        alpha = int(255 * (1.0 - star_dist / 0.08))
        return (251, 191, 36, alpha)

    return (base_r, base_g, base_b, 255)

def main():
    icons_dir = os.path.join(os.path.dirname(__file__), 'icons')
    os.makedirs(icons_dir, exist_ok=True)
    
    for size in [16, 48, 128]:
        png_data = create_png(size, size, draw_meditation_icon)
        out_path = os.path.join(icons_dir, f'icon-{size}.png')
        with open(out_path, 'wb') as f:
            f.write(png_data)
        print(f"Generated {out_path} ({size}x{size})")

if __name__ == '__main__':
    main()
