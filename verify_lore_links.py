import os
import re

def verify_links(base_dir):
    broken_links = 0
    for root, _, files in os.walk(base_dir):
        for file in files:
            if file.endswith(".md"):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    links = re.findall(r'\[.*?\]\((.*?)\)', content)
                    for link in links:
                        # Skip web URLs and fragments
                        if link.startswith('http') or link.startswith('#'):
                            continue
                        
                        # Resolve relative path
                        target_path = os.path.normpath(os.path.join(root, link))
                        if not os.path.exists(target_path):
                            print(f"Broken link in {path}: {link}")
                            broken_links += 1
    return broken_links

broken = verify_links("/Volumes/gameWorkspace/worktrees/seoul-kenshi/lore-w7/LORE")
print(f"Total broken links: {broken}")
