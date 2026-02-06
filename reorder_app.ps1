$path = "c:\Users\VDias\Downloads\burger-blend-main\App.tsx"
$content = Get-Content -Path $path -Encoding UTF8

# Define ranges (0-indexed)
# Line 1-63 (Indices 0-62): Imports
$imports = $content[0..62]

# Line 64-551 (Indices 63-550): App Component
$app = $content[63..550]

# Line 553-1057 (Indices 552-1056): Helper Components
$helpers = $content[552..1056]

# Line 1059 (Index 1058): Export
$export = $content[1058..($content.Count - 1)]

# Construct new content
# Imports + Helpers + App + Export
# Add empty lines for separation
$newContent = $imports + "" + $helpers + "" + $app + "" + $export

$newContent | Set-Content -Path $path -Encoding UTF8
Write-Host "App.tsx reordered successfully."
