# Bulk dark-to-light recoloring script for remaining platform pages
$files = @(
    "src\app\(platform)\assessments\page.tsx",
    "src\app\(platform)\assessments\new\page.tsx",
    "src\app\(platform)\assessments\[id]\page.tsx",
    "src\app\(platform)\assessments\[id]\scoring\page.tsx",
    "src\app\(platform)\assessments\[id]\review\page.tsx",
    "src\app\(platform)\assessments\[id]\report\page.tsx",
    "src\app\(platform)\organizations\page.tsx",
    "src\app\(platform)\users\page.tsx",
    "src\app\(platform)\settings\page.tsx"
)

foreach ($file in $files) {
    $path = Join-Path "c:\Users\User\Documents\CHP\frontend" $file
    if (!(Test-Path $path)) {
        Write-Host "SKIP: $file not found"
        continue
    }
    $content = Get-Content $path -Raw

    # --- Text colors (dark-on-light) ---
    $content = $content -replace 'text-slate-100', 'text-gray-900'
    $content = $content -replace 'text-slate-200', 'text-gray-800'
    $content = $content -replace 'text-slate-300', 'text-gray-700'
    $content = $content -replace 'text-slate-400', 'text-gray-500'
    $content = $content -replace 'text-slate-500', 'text-gray-400'
    $content = $content -replace 'text-slate-600', 'text-gray-500'
    # text-white in non-button contexts → text-gray-900
    # (we keep text-white on buttons with bg-[#0072BC])

    # --- Background colors ---
    $content = $content -replace 'bg-slate-950', 'bg-white'
    $content = $content -replace 'bg-slate-900/60', 'bg-gray-50'
    $content = $content -replace 'bg-slate-900/50', 'bg-gray-100'
    $content = $content -replace 'bg-slate-900/40', 'bg-gray-50'
    $content = $content -replace 'bg-slate-900/30', 'bg-gray-50'
    $content = $content -replace 'bg-slate-900/20', 'bg-gray-50'
    $content = $content -replace 'bg-slate-900', 'bg-gray-100'
    $content = $content -replace 'bg-slate-800/80', 'bg-gray-100'
    $content = $content -replace 'bg-slate-800/60', 'bg-gray-100'
    $content = $content -replace 'bg-slate-800/50', 'bg-gray-100'
    $content = $content -replace 'bg-slate-800', 'bg-gray-200'

    # --- Border colors ---
    $content = $content -replace 'border-slate-900/80', 'border-gray-200'
    $content = $content -replace 'border-slate-900/60', 'border-gray-200'
    $content = $content -replace 'border-slate-900/40', 'border-gray-100'
    $content = $content -replace 'border-slate-900', 'border-gray-200'
    $content = $content -replace 'border-slate-800/80', 'border-gray-200'
    $content = $content -replace 'border-slate-800/60', 'border-gray-200'
    $content = $content -replace 'border-slate-800/50', 'border-gray-200'
    $content = $content -replace 'border-slate-800', 'border-gray-200'
    $content = $content -replace 'border-slate-700/80', 'border-gray-300'
    $content = $content -replace 'border-slate-700/60', 'border-gray-300'
    $content = $content -replace 'border-slate-700', 'border-gray-300'

    # --- Hover backgrounds ---
    $content = $content -replace 'hover:bg-slate-900/50', 'hover:bg-gray-100'
    $content = $content -replace 'hover:bg-slate-900/40', 'hover:bg-gray-100'
    $content = $content -replace 'hover:bg-slate-900/30', 'hover:bg-gray-50'
    $content = $content -replace 'hover:bg-slate-900/20', 'hover:bg-gray-50'
    $content = $content -replace 'hover:bg-slate-900', 'hover:bg-gray-100'
    $content = $content -replace 'hover:bg-slate-800', 'hover:bg-gray-200'
    $content = $content -replace 'hover:border-slate-700/60', 'hover:border-gray-300'
    $content = $content -replace 'hover:border-slate-700', 'hover:border-gray-300'
    $content = $content -replace 'hover:text-slate-200', 'hover:text-gray-900'
    $content = $content -replace 'hover:text-slate-300', 'hover:text-gray-800'

    # --- Blue accent colors → brand #0072BC ---
    $content = $content -replace 'text-blue-400', 'text-[#0072BC]'
    $content = $content -replace 'text-blue-300', 'text-[#0072BC]'
    $content = $content -replace 'text-blue-500', 'text-[#0072BC]'
    $content = $content -replace 'hover:text-blue-300', 'hover:text-[#005a94]'
    $content = $content -replace 'hover:text-blue-400', 'hover:text-[#005a94]'
    $content = $content -replace 'bg-blue-600/10', 'bg-[#0072BC]/10'
    $content = $content -replace 'bg-blue-600/20', 'bg-[#0072BC]/20'
    $content = $content -replace 'bg-blue-500/10', 'bg-[#0072BC]/10'
    $content = $content -replace 'bg-blue-500/20', 'bg-[#0072BC]/20'
    $content = $content -replace 'border-blue-500/20', 'border-[#0072BC]/20'
    $content = $content -replace 'border-blue-500/30', 'border-[#0072BC]/30'
    $content = $content -replace 'border-blue-500/40', 'border-[#0072BC]/40'
    $content = $content -replace 'hover:bg-blue-600/20', 'hover:bg-[#0072BC]/20'
    $content = $content -replace 'hover:border-blue-500/25', 'hover:border-[#0072BC]/30'
    $content = $content -replace 'hover:border-blue-500/40', 'hover:border-[#0072BC]/40'

    # --- Gradient buttons → solid brand buttons ---
    $content = $content -replace 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500', 'bg-[#0072BC] hover:bg-[#005a94]'
    $content = $content -replace 'shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25', 'shadow-md'
    $content = $content -replace 'shadow-md shadow-blue-500/15', 'shadow-md'
    $content = $content -replace 'shadow-lg shadow-blue-500/25', 'shadow-md'
    $content = $content -replace 'hover:shadow-lg hover:shadow-blue-500/25', ''
    $content = $content -replace 'focus:ring-blue-500', 'focus:ring-[#0072BC]'

    # --- Gradient text → solid ---
    $content = $content -replace 'bg-gradient-to-r from-blue-200 via-slate-100 to-cyan-200 bg-clip-text text-transparent', 'text-[#003366]'
    $content = $content -replace 'bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent', 'text-[#003366]'
    $content = $content -replace 'bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent', 'text-gray-900'
    $content = $content -replace 'bg-gradient-to-r from-red-200 via-slate-100 to-sky-200 bg-clip-text text-transparent', 'text-gray-900'

    # --- Red/error styling (dark → light) ---
    $content = $content -replace 'bg-red-950/40', 'bg-red-50'
    $content = $content -replace 'bg-red-950/30', 'bg-red-50'
    $content = $content -replace 'bg-red-950/20', 'bg-red-50'
    $content = $content -replace 'bg-red-650/10', 'bg-red-50'
    $content = $content -replace 'border-red-500/20', 'border-red-200'
    $content = $content -replace 'border-red-500/10', 'border-red-200'
    $content = $content -replace 'border-red-500/40', 'border-red-300'
    $content = $content -replace 'text-red-400', 'text-red-600'
    $content = $content -replace 'text-red-300', 'text-red-500'
    $content = $content -replace 'hover:text-red-300', 'hover:text-red-700'
    $content = $content -replace 'hover:bg-red-950/20', 'hover:bg-red-50'
    $content = $content -replace 'hover:bg-red-950/30', 'hover:bg-red-50'
    $content = $content -replace 'hover:border-red-500/20', 'hover:border-red-300'

    # --- Emerald (dark → light) ---
    $content = $content -replace 'bg-emerald-600/10', 'bg-emerald-50'
    $content = $content -replace 'bg-emerald-600/20', 'bg-emerald-50'
    $content = $content -replace 'border-emerald-500/20', 'border-emerald-200'
    $content = $content -replace 'border-emerald-500/30', 'border-emerald-200'
    $content = $content -replace 'text-emerald-400', 'text-emerald-600'
    $content = $content -replace 'text-emerald-300', 'text-emerald-700'
    $content = $content -replace 'hover:bg-emerald-600/20', 'hover:bg-emerald-100'
    $content = $content -replace 'hover:bg-emerald-950/30', 'hover:bg-emerald-50'

    # --- Amber/Orange (dark → light) ---
    $content = $content -replace 'text-amber-400', 'text-amber-600'
    $content = $content -replace 'text-amber-300', 'text-amber-700'
    $content = $content -replace 'bg-amber-500/20', 'bg-amber-50'
    $content = $content -replace 'border-amber-500/30', 'border-amber-200'
    $content = $content -replace 'text-orange-400', 'text-orange-600'

    # --- Cyan (dark → light) ---
    $content = $content -replace 'text-cyan-400', 'text-cyan-600'
    $content = $content -replace 'text-cyan-300', 'text-cyan-700'
    $content = $content -replace 'bg-cyan-500/20', 'bg-cyan-50'
    $content = $content -replace 'border-cyan-500/30', 'border-cyan-200'

    # --- Violet/Purple (dark → light) ---
    $content = $content -replace 'text-violet-400', 'text-violet-600'
    $content = $content -replace 'bg-violet-600/10', 'bg-violet-50'
    $content = $content -replace 'border-violet-500/20', 'border-violet-200'

    # --- Yellow (dark → light) ---
    $content = $content -replace 'text-yellow-400', 'text-yellow-600'

    # --- Rounded-3xl → 2xl for cards ---
    $content = $content -replace 'rounded-3xl', 'rounded-2xl'

    # --- Aurora bg removal ---
    $content = $content -replace 'aurora-bg animate-aurora ', ''
    $content = $content -replace 'aurora-bg animate-aurora', ''

    # --- Glass-related subtle glow lines → brand accent ---
    $content = $content -replace 'bg-gradient-to-r from-transparent via-blue-500/40 to-transparent', 'bg-gradient-to-r from-[#0072BC] to-[#0096c7]'
    $content = $content -replace 'bg-gradient-to-r from-transparent via-blue-500/20 to-transparent', 'bg-gradient-to-r from-[#0072BC] to-[#0096c7]'
    $content = $content -replace 'bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent', 'bg-gradient-to-r from-[#0072BC] to-[#0096c7]'
    $content = $content -replace 'bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent', 'bg-gradient-to-r from-emerald-500 to-emerald-400'
    $content = $content -replace 'bg-gradient-to-r from-transparent via-amber-500/30 to-transparent', 'bg-gradient-to-r from-amber-500 to-amber-400'
    $content = $content -replace 'bg-gradient-to-r from-transparent via-slate-500/20 to-transparent', 'bg-gradient-to-r from-gray-300 to-gray-200'

    # --- Radial gradient glow backgrounds (remove dark subtle glow) ---
    $content = $content -replace 'bg-\[radial-gradient\(ellipse_at_top_right,rgba\(124,58,237,0\.03\),transparent_50%\)\]', 'bg-transparent'
    $content = $content -replace 'bg-\[radial-gradient\(ellipse_at_bottom_left,rgba\(6,182,212,0\.02\),transparent_50%\)\]', 'bg-transparent'
    $content = $content -replace 'bg-\[radial-gradient\(ellipse_at_top_right,rgba\(239,68,68,0\.03\),transparent_50%\)\]', 'bg-transparent'
    $content = $content -replace 'bg-\[radial-gradient\(ellipse_at_bottom_left,rgba\(99,102,241,0\.02\),transparent_50%\)\]', 'bg-transparent'

    # --- h-[2px] accent bars → h-[3px] ---
    $content = $content -replace 'h-\[2px\]', 'h-[3px]'

    # --- Misc specific patterns ---
    $content = $content -replace 'text-white(?![\s"])', 'text-gray-900'  # conservative: only if not followed by space/quote
    # Keep text-white on buttons explicitly
    
    # --- Animate pulse for dark orbs (remove) ---
    $content = $content -replace 'animate-pulse-slow', ''

    Set-Content $path $content -NoNewline
    Write-Host "OK: $file"
}

Write-Host "`nDone! All files processed."
