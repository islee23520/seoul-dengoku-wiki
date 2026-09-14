from PIL import Image
import sys

def check_image(filepath, name):
    print(f"\n--- Checking {name} ({filepath.split('/')[-1]}) ---")
    try:
        img = Image.open(filepath).convert('RGBA')
        w, h = img.size
        # Find characters by scanning for their colors or just bounds
        # We know background is #111111 or similar dark color.
        # Let's find all non-background pixels.
        
        # Explorer: mostly blue shirt, has yellow (255, 204, 0 or similar) for circle and tip.
        # Patrol: mostly dark grey, has yellow beam.
        
        for y in range(h):
            for x in range(w):
                r,g,b,a = img.getpixel((x,y))
                if a > 0 and (r,g,b) != (17, 17, 17): # approx bg
                    pass
        
        # Let's crop into three characters.
        # Usually they are spaced out.
        # We can find vertical columns with non-bg pixels.
        cols_with_pixels = []
        for x in range(w):
            has_pixel = False
            for y in range(h):
                r,g,b,a = img.getpixel((x,y))
                # background seems to be (19,20,24) or similar. Let's just check for brightness > 30 or something,
                # or not equal to the exact top-left pixel.
                bg = img.getpixel((0,0))
                if img.getpixel((x,y)) != bg:
                    has_pixel = True
                    break
            if has_pixel:
                cols_with_pixels.append(x)
                
        if not cols_with_pixels:
            print("No foreground found.")
            return

        # Find character bounds
        chars = []
        start = cols_with_pixels[0]
        for i in range(1, len(cols_with_pixels)):
            if cols_with_pixels[i] - cols_with_pixels[i-1] > 10: # gap between chars
                chars.append((start, cols_with_pixels[i-1]))
                start = cols_with_pixels[i]
        chars.append((start, cols_with_pixels[-1]))
        
        print(f"Found {len(chars)} characters at X bounds: {chars}")
        
        # Assuming 3 chars: 0=Explorer, 1=Worker, 2=Patrol
        if len(chars) == 3:
            ex_x_min, ex_x_max = chars[0]
            pat_x_min, pat_x_max = chars[2]
            
            # Analyze Explorer (0) for antenna height
            ex_y_min = h
            ex_hair_y_min = h
            antenna_y_min = h
            
            for x in range(ex_x_min, ex_x_max + 1):
                for y in range(h):
                    pixel = img.getpixel((x,y))
                    if pixel != bg:
                        ex_y_min = min(ex_y_min, y)
                        r,g,b,a = pixel
                        # Hair is black/dark
                        if r < 50 and g < 50 and b < 50 and r == g and g == b:
                            ex_hair_y_min = min(ex_hair_y_min, y)
                        # Antenna tip is yellow or grey
                        if (r > 200 and g > 150 and b < 100) or (r>150 and g>150 and b>150 and abs(r-g)<10): 
                            # yellow tip or grey pole. Actually let's just find the highest non-hair pixel on the side
                            antenna_y_min = min(antenna_y_min, y)

            print(f"Explorer: Highest pixel Y={ex_y_min}, Hair highest Y={ex_hair_y_min}")
            if ex_y_min < ex_hair_y_min:
                print("  -> Antenna extends PAST head!")
            else:
                print("  -> Antenna does NOT extend past head (or no antenna found higher than hair).")
                
            # Analyze Patrol (2) for lamp, beam, back-dot
            # Patrol lamp is light grey, beam is yellow, helmet is dark grey.
            # Let's find bounding box of helmet and lamp.
            pat_y_min = h
            pat_y_max = 0
            for x in range(pat_x_min, pat_x_max + 1):
                for y in range(h):
                    if img.getpixel((x,y)) != bg:
                        pat_y_min = min(pat_y_min, y)
                        pat_y_max = max(pat_y_max, y)
                        break
            
            # Let's look at the top portion (helmet area)
            helmet_bottom = pat_y_min + 15 # rough guess
            yellow_pixels = []
            light_grey_pixels = []
            
            for y in range(pat_y_min, helmet_bottom):
                for x in range(pat_x_min, pat_x_max + 1):
                    r,g,b,a = img.getpixel((x,y))
                    if img.getpixel((x,y)) != bg:
                        if r > 200 and g > 200 and b < 100: # Yellow
                            yellow_pixels.append((x,y))
                        elif r > 100 and g > 100 and b > 100 and abs(r-g)<10 and abs(g-b)<10: # Light grey (lamp)
                            # excluding the dark grey helmet which might be around 50,50,50
                            if r > 80:
                                light_grey_pixels.append((x,y))
                                
            if yellow_pixels:
                min_yx = min(yellow_pixels, key=lambda p: p[0])[0]
                max_yx = max(yellow_pixels, key=lambda p: p[0])[0]
                print(f"Patrol: Yellow pixels found between X={min_yx} and X={max_yx} (relative to char bounds: {min_yx-pat_x_min} to {max_yx-pat_x_min})")
            else:
                print("Patrol: No yellow pixels found in helmet area.")
                
            if light_grey_pixels:
                min_gx = min(light_grey_pixels, key=lambda p: p[0])[0]
                max_gx = max(light_grey_pixels, key=lambda p: p[0])[0]
                print(f"Patrol: Light grey pixels found between X={min_gx} and X={max_gx}")

    except Exception as e:
        print(f"Error processing {name}: {e}")

check_image("/Users/ilseoblee/workspace/seoul-kenshi-wt/unity-poc-art-todo15/.omo/evidence/unity-poc-core-loop/task-15-characters/playmode/todo15-N-idle.png", "N")
check_image("/Users/ilseoblee/workspace/seoul-kenshi-wt/unity-poc-art-todo15/.omo/evidence/unity-poc-core-loop/task-15-characters/playmode/todo15-S-idle.png", "S")
check_image("/Users/ilseoblee/workspace/seoul-kenshi-wt/unity-poc-art-todo15/.omo/evidence/unity-poc-core-loop/task-15-characters/playmode/todo15-E-idle.png", "E")
check_image("/Users/ilseoblee/workspace/seoul-kenshi-wt/unity-poc-art-todo15/.omo/evidence/unity-poc-core-loop/task-15-characters/playmode/todo15-W-idle.png", "W")

