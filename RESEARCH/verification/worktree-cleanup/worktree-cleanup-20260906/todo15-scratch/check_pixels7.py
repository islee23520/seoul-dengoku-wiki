from PIL import Image
import sys

def check_yellow_dot(filepath, name):
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
    
    cx_min, cx_max = chars[2] # Patrol
    
    y_min, y_max = h, 0
    for x in range(cx_min, cx_max+1):
        for y in range(h):
            if img.getpixel((x,y)) != bg:
                y_min = min(y_min, y)
                y_max = max(y_max, y)
    
    has_yellow = False
    for y in range(y_min, min(y_min+30, y_max)):
        for x in range(cx_min, cx_max+1):
            p = img.getpixel((x,y))
            if p != bg:
                r,g,b,_ = p
                # yellow dot color
                if r>200 and g>200 and b<100:
                    has_yellow = True
    print(f"{name}: Has pure yellow? {has_yellow}")

for f in ["todo15-N-idle.png", "todo15-S-idle.png", "todo15-E-idle.png", "todo15-W-idle.png"]:
    check_yellow_dot(f"/Users/ilseoblee/workspace/seoul-kenshi-wt/unity-poc-art-todo15/.omo/evidence/unity-poc-core-loop/task-15-characters/playmode/{f}", f)

