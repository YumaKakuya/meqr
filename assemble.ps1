$encoding = [System.Text.Encoding]::UTF8
$backupPath = ".\index.html.bak"
$cssPath = ".\new_css.css"
$startPagePath = ".\start_page.html"
$bentoPath = ".\bento.html"
$indexPath = ".\index.html"

# Read Backup (Lines)
$lines = Get-Content -Path $backupPath -Encoding UTF8

# Read Components
$css = [System.IO.File]::ReadAllText($cssPath, $encoding)
$startPage = [System.IO.File]::ReadAllText($startPagePath, $encoding)
$bento = [System.IO.File]::ReadAllText($bentoPath, $encoding)

# 1. Header (Lines 1-27) -> Index 0-26
$part1 = $lines[0..26] -join "`n"

# 2. CSS is $css

# 3. Middle 1 (</head>...<body>) -> Index 1900-1902
$part2 = $lines[1900..1902] -join "`n"

# 4. Start Page is $startPage

# 5. Middle 2 (App Root...Before Display) -> Index 1903-1941
$part3 = $lines[1903..1941] -join "`n"

# 6. Bento Grid is $bento

# 7. Footer (After Display...End) -> Index 2034..End
$part4 = $lines[2034..($lines.Count - 1)] -join "`n"

# Assembly
$finalContent = $part1 + "`n" + $css + "`n  </style>`n" + $part2 + "`n" + $startPage + "`n" + $part3 + "`n" + $bento + "`n" + $part4

[System.IO.File]::WriteAllText($indexPath, $finalContent, $encoding)
Write-Host "Assembly Complete."
