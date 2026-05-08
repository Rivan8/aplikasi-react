import os

file_path = '/Users/esc/Herd/aplikasi-react/resources/js/pages/dashboard.tsx'
with open(file_path, 'r') as f:
    lines = f.readlines()

# Search for the mangled part
# Line 48: "    Youtube,"
# Line 49: "import { useMemo, useState } from 'react';"

new_lines = []
found = False
for i, line in enumerate(lines):
    if "    Youtube," in line and i + 1 < len(lines) and "import { useMemo, useState }" in lines[i+1]:
        new_lines.append(line)
        new_lines.append("    ExternalLink,\n")
        new_lines.append("    Play,\n")
        new_lines.append("    FileText,\n")
        new_lines.append("    Video,\n")
        new_lines.append("    Info,\n")
        new_lines.append("} from 'lucide-react';\n")
        found = True
    else:
        new_lines.append(line)

if found:
    with open(file_path, 'w') as f:
        f.writelines(new_lines)
    print("Successfully patched.")
else:
    print("Could not find the mangled part.")
