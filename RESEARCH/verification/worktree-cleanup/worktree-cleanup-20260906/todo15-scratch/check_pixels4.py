from PIL import Image
import sys

def analyze_explorer(filepath):
    img = Image.open(filepath).convert('RGBA')
    w, h = img.size
    bg = img.getpixel((0,0))
    
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
    
    cx_min, cx_max = chars[0] # Explorer
    
    print(f"\n--- Explorer in {filepath.split('/')[-1]} ---")
    y_min, y_max = h, 0
    for x in range(cx_min, cx_max+1):
        for y in range(h):
            if img.getpixel((x,y)) != bg:
                y_min = min(y_min, y)
                y_max = max(y_max, y)
    
    # print top 20 rows of Explorer
    for y in range(y_min, min(y_min+25, y_max)):
        line = ""
        for x in range(cx_min, cx_max+1):
            p = img.getpixel((x,y))
            if p == bg: line += "."
            else:
                r,g,b,_ = p
                if r>200 and g>200 and b<100: line += "Y" # yellow
                elif r<50 and g<50 and b<50: line += "H" # hair
                else: line += "*"
        print(f"{y:3d} {line}")

for f in ["todo15-E-idle.png", "todo15-W-idle.png"]:
    analyze_explorer(f"/Users/ilseoblee/workspace/seoul-kenshi-wt/unity-poc-art-todo15/.omo/evidence/unity-poc-core-loop/task-15-characters/playmode/{f}")

