import os
import glob

replacements = [
    ("SmartStadium AI", "FANSPHERE"),
    ("SmartStadium", "FANSPHERE"),
    ("MetLife Stadium", "FANSPHERE"),
    ("METLIFE STADIUM", "FANSPHERE"),
    ("MetLife Gate", "FANSPHERE Gate"),
    ("METLIFE", "FANSPHERE"),
    ("Metlife", "FANSPHERE"),
    ("MetLife", "FANSPHERE"),
    ("smartstadium-ai", "fansphere"),
    ("smartstadium", "fansphere"),
]

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Skipping {filepath}: {e}")
        return

    new_content = content
    for old, new in replacements:
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

# Process directories
for root, dirs, files in os.walk('.'):
    # skip node_modules and .git
    if 'node_modules' in root or '.git' in root or '.gemini' in root:
        continue
    for file in files:
        if file.endswith(('.js', '.html', '.css', '.json', '.md', '.py', '.tex')):
            # Don't rewrite ourselves
            if file == "rename.py":
                continue
            process_file(os.path.join(root, file))
