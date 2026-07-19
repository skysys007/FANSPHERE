import os
import re

INDEX_PATH = "/home/skysys/Desktop/Repositories/FAN SPHERE/index.html"
APP_JS_PATH = "/home/skysys/Desktop/Repositories/FAN SPHERE/js/app.js"
CONTROLS_JS_PATH = "/home/skysys/Desktop/Repositories/FAN SPHERE/js/controls.js"

def extract_scripts():
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        html = f.read()

    # Find the large <script type="module"> block
    module_script_match = re.search(r'<script type="module">\s*(.*?)\s*</script>', html, re.DOTALL)
    if module_script_match:
        app_js_content = module_script_match.group(1)
        # Write to js/app.js
        with open(APP_JS_PATH, 'w', encoding='utf-8') as f:
            f.write(app_js_content)
        # Replace in HTML
        html = html.replace(module_script_match.group(0), '<script type="module" src="./js/app.js"></script>')
        print(f"✅ Extracted app.js ({len(app_js_content)} chars)")

    # Find the standard <script> block
    # We look for the script that initializes lucide and ui logic
    standard_script_match = re.search(r'<script>(?!.*?cdn\.tailwindcss\.com).*?(?=// Update clock).*?window\.updateSimSpeed.*?</script>', html, re.DOTALL)
    
    # If the regex doesn't catch it perfectly, let's just use string split/replace manually for the second block.
    # The second block starts after the module script
    second_script_start = html.find('<script>', html.find('</script>', html.find('<script type="module"')))
    if second_script_start != -1:
        second_script_end = html.find('</script>', second_script_start)
        if second_script_end != -1:
            controls_js_content = html[second_script_start+8:second_script_end].strip()
            # If it's the big one (checking size > 1000)
            if len(controls_js_content) > 1000:
                with open(CONTROLS_JS_PATH, 'w', encoding='utf-8') as f:
                    f.write(controls_js_content)
                html = html[:second_script_start] + '<script src="./js/controls.js"></script>' + html[second_script_end+9:]
                print(f"✅ Extracted controls.js ({len(controls_js_content)} chars)")

    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print("🚀 HTML refactoring complete!")

if __name__ == "__main__":
    extract_scripts()
