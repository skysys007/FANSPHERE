import os
import re

FILES_TO_PATCH = [
    "/home/skysys/Desktop/Repositories/FAN SPHERE/js/app.js",
    "/home/skysys/Desktop/Repositories/FAN SPHERE/js/controls.js",
    "/home/skysys/Desktop/Repositories/FAN SPHERE/js/parking.js"
]

def patch_file(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath} (not found)")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # If already patched, skip
    if "DOMPurify" in content:
        print(f"✅ {filepath} already sanitized.")
        return

    # Add the DOMPurify import at the top (after other imports)
    import_stmt = "import DOMPurify from 'dompurify';\n"
    
    # We find the last import or just put it at the very top.
    if content.startswith("import "):
        # insert after the block of imports
        lines = content.split('\n')
        insert_idx = 0
        for i, line in enumerate(lines):
            if not line.strip().startswith("import ") and line.strip() != "":
                insert_idx = i
                break
        lines.insert(insert_idx, import_stmt)
        content = '\n'.join(lines)
    else:
        content = import_stmt + content

    # Regex to find: someEl.innerHTML = `...` or someEl.innerHTML = "..."
    # We replace: .innerHTML = (value)  -> .innerHTML = DOMPurify.sanitize(value)
    # This is a bit tricky with regex because of multiline template strings.
    
    def replacement(match):
        lhs = match.group(1) # e.g. "el.innerHTML = "
        rhs = match.group(2) # e.g. "`<div>...</div>`" or "variableName"
        # Avoid wrapping if it's already wrapped
        if "DOMPurify" in rhs:
            return match.group(0)
        # Avoid wrapping if it's just empty string or simple string without tags
        if rhs.strip() == "''" or rhs.strip() == '""':
            return match.group(0)
            
        return f"{lhs}DOMPurify.sanitize({rhs})"
        
    # Match pattern: anything.innerHTML = [stuff before a semicolon or end of statement]
    # We use a greedy match for the RHS but bounded by standard terminators, this requires careful parsing.
    # Instead, we just do a simpler replacement for the known assignments.
    
    pattern = re.compile(r'(\.innerHTML\s*=\s*)([^;]+)', re.DOTALL)
    
    # Custom replacer that handles backticks better
    patched_content = ""
    idx = 0
    while idx < len(content):
        match = re.search(r'(\.innerHTML\s*=\s*)', content[idx:])
        if not match:
            patched_content += content[idx:]
            break
            
        start = idx + match.start()
        end = idx + match.end()
        patched_content += content[idx:end]
        
        # Now find the end of the assignment (usually a semicolon or end of string)
        # If it starts with `, we find the matching unescaped `
        idx = end
        rhs_start = idx
        
        c = content[idx]
        if c == '`':
            # find matching backtick
            while idx < len(content):
                idx += 1
                if content[idx] == '`' and content[idx-1] != '\\':
                    idx += 1
                    break
        elif c == "'" or c == '"':
            quote = c
            while idx < len(content):
                idx += 1
                if content[idx] == quote and content[idx-1] != '\\':
                    idx += 1
                    break
        else:
            # find semicolon or newline
            while idx < len(content) and content[idx] not in (';', '\n'):
                idx += 1
                
        rhs = content[rhs_start:idx].strip()
        
        if rhs != "''" and rhs != '""':
            patched_content += f"DOMPurify.sanitize({rhs})"
        else:
            patched_content += rhs
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(patched_content)
    
    print(f"🔒 Secured {os.path.basename(filepath)} with DOMPurify XSS mitigation.")

if __name__ == "__main__":
    for f in FILES_TO_PATCH:
        patch_file(f)
    print("🚀 XSS Sanitization complete!")
