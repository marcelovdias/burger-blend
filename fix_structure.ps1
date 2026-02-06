$path = "c:\Users\VDias\Downloads\burger-blend-main\App.tsx"
$lines = Get-Content $path -Encoding UTF8

# Find the key line numbers
$appStart = 18  # Line 18: const App: React.FC = () => {
$handleMouseMoveStart = 62  # Line 62: const handleMouseMove = (e: React.MouseEvent) => {
$componentBlockEnd = 576  # Line 576: end of component declarations inside handleMouseMove
$appEnd = 1048  #  Line 1048: closing of App component

# Extract sections
$imports = $lines[0..16]  # Lines 1-17 (indices 0-16): imports and DEFAULT_RECIPE

# Extract helper components from INSIDE handleMouseMove (lines 65-576, indices 64-575)
# We need to remove indentation and reformat them as top-level
$helperLines = $lines[64..575]

# Fix indentation: remove 8 leading spaces from each line
$helpers = $helperLines | ForEach-Object {
    if ($_ -match '^        (.*)$') {
        $matches[1]
    }
    else {
        $_
    }
}

# Extract the CORRECT handleMouseMove function (just the logic, lines 62-64 + 577-634)
$handleMouseMoveFixed = @(
    "  const handleMouseMove = (e: React.MouseEvent) => {",
    "    if (!isDragging || !scrollRef.current) return;",
    "    e.preventDefault();",
    "    const x = e.pageX - scrollRef.current.offsetLeft;",
    "    const walk = (x - startX) * 2;",
    "    if (Math.abs(walk) > 5) setDragMoved(true);",
    "    scrollRef.current.scrollLeft = scrollLeft - walk;",
    "  };"
)

# Extract App component WITHOUT the embedded helpers
# Lines 18-61 (indices 17-60): App start to before handleMouseMove
$appStart1 = $lines[17..60]
#  Lines 577-1047 (indices 576-1046): after handleMouseMove embedded components to App end
$appEnd1 = $lines[576..1046]

# Build new App component
$appComponent = $appStart1 + "" + $handleMouseMoveFixed + "" + $appEnd1

# Final structure
$export = $lines[1047..($lines.Count - 1)]  # export default App;

# Construct new file
$newContent = $imports + "" + $helpers + "" + $appComponent + "" + $export

$newContent | Set-Content $path -Encoding UTF8
Write-Host "Fixed App.tsx structure successfully."
