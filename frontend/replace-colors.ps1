$files = Get-ChildItem -Path 'c:\Users\User\Documents\CHP\frontend\src' -Recurse -Include '*.tsx'
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace 'violet', 'blue' -replace 'indigo', 'sky'
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}
