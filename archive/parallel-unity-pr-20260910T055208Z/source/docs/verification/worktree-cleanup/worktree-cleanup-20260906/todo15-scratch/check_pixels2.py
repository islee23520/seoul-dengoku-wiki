from PIL import Image
import sys

def ascii_char(filepath, char_idx, x_min, x_max, y_min, y_max):
    img = Image.open(filepath).convert('RGBA')
    bg = img.getpixel((0,0))
    print(f"\nASCII for char {char_idx} in {filepath.split('/')[-1]}:")
    for y in range(y_min, y_max):
        line = ""
        for x in range(x_min, x_max):
            p = img.getpixel((x,y))
            if p == bg:
                line += " "
            else:
                r,g,b,_ = p
                if r>200 and g>200 and b<100: line += "Y" # yellow
                elif r<50 and g<50 and b<50 and abs(r-g)<10: line += "H" # hair/dark
                elif r>150 and g>150 and b>150 and abs(r-g)<10: line += "G" # light grey
                elif abs(r-g)<10 and abs(g-b)<10 and r<100: line += "D" # dark grey
                elif b>150 and r<100: line += "B" # blue shirt
                else: line += "*"
        if line.strip():
            print(f"{y:3d} {line}")

def analyze(filepath):
    img = Image.open(filepath).convert('RGBA')
    w, h = img.size
    bg = img.getpixel((0,0))
    
    # find columns with pixels
    cols = []
    for x in range(w):
        for y in range(h):
            if img.getpixel((x,y)) != bg:
                cols.append(x)
                break
    
    chars = []
    start = cols[0]
    for i in range(1, len(cols)):
        if cols[i] - cols[i-1] > 10:
            chars.append((start, cols[i-1]))
            start = cols[i]
    chars.append((start, cols[-1]))
    
    # Get y_min, y_max for each char
    for idx, (cx_min, cx_max) in enumerate(chars):
        cy_min, cy_max = h, 0
        for x in range(cx_min, cx_max+1):
            for y in range(h):
                if img.getpixel((x,y)) != bg:
                    cy_min = min(cy_min, y)
                    cy_max = max(cy_max, y)
        ascii_char(filepath, idx, cx_min, cx_max+1, cy_min, cy_max+1)

for f in ["todo15-E-idle.png", "todo15-W-idle.png"]:
    analyze(f"/Users/ilseoblee/workspace/seoul-kenshi-wt/unity-poc-art-todo15/.omo/evidence/unity-poc-core-loop/task-15-characters/playmode/{f}")

