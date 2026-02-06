$path = "c:\Users\VDias\Downloads\burger-blend-main\App.tsx"
$lines = Get-Content $path -Encoding UTF8
# Check if line 805 (index 804) is =======
$line805 = $lines[804]
if ($line805 -match "=======") {
    write-host "Found conflict marker at line 805"
    # Content before: 0..803 (Lines 1-804)
    # Line 804 is "          </div>"
    $before = $lines[0..803]
    
    # Content after: 817..end (Line 818 is header...)
    # We skip 805-816 (12 lines)
    # Wait. Line 816 is "</div>". Line 817 is empty. Line 818 is header.
    # So we want to keep line 817?
    # Yes. So start from index 816 (Line 817).
    $after = $lines[816..($lines.Count - 1)]
    
    # Insert closing divs
    # We need to close Grid (775) and Container (717). 
    # Current Line 804 closes Responsável (796).
    # So we need 2 more divs.
    $closing = @("        </div>", "      </div>")
    
    $newContent = $before + $closing + $after
    $newContent | Set-Content $path -Encoding UTF8
    write-host "Fixed."
}
else {
    write-host "Marker not found at index 804. Found: '$line805'"
    # Search for marker
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "=======") {
            write-host "Found marker at index $i (Line $($i+1))"
            break
        }
    }
}
