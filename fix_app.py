
import os

file_path = r"c:\Users\VDias\Downloads\burger-blend-main\App.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Indices (0-based) corresponding to line numbers (1-based)
# Line 65 is index 64
# Line 569 is index 568
# Line 570 is index 569

start_idx = 64
end_idx = 569

# Extract components block (Line 65 to 569)
components_block = lines[start_idx:end_idx]

# Dedent
indent = "        " # 8 spaces
dedented_block = []
for line in components_block:
    if line.startswith(indent):
        dedented_block.append(line[len(indent):])
    else:
        dedented_block.append(line.lstrip()) # Fallback for lines with less indent

# Construct new content
# Header: Lines 1-17 (Indices 0-16)
header = lines[:17]

# App Start to handleMouseMove body start: Lines 18-64 (Indices 17-63)
# Note: Line 64 is index 63. range(17, 64) -> 17..63.
app_intro = lines[17:64]

# Remaining handleMouseMove: Lines 570-End (Indices 569-End)
remainder = lines[569:]

# New Order:
# 1. Header
# 2. Components
# 3. App Intro
# 4. Remainder

new_content = header + ["\n"] + dedented_block + ["\n"] + app_intro + remainder

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_content)

print(f"Fixed {file_path}")
