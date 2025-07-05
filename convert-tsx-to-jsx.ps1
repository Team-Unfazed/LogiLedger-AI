# PowerShell script to convert TSX files to JSX
# This script removes TypeScript types and converts files to JavaScript

$tsxFiles = Get-ChildItem -Recurse -Filter "*.tsx"

foreach ($file in $tsxFiles) {
    Write-Host "Converting $($file.FullName) to JSX..."
    
    $content = Get-Content $file.FullName -Raw
    
    # Remove TypeScript-specific syntax
    $jsxContent = $content -replace 'import.*type.*from.*["'']', ''  # Remove type imports
    $jsxContent = $jsxContent -replace 'import\s*\{[^}]*type[^}]*\}\s*from.*["'']', ''  # Remove type imports in destructuring
    $jsxContent = $jsxContent -replace ':\s*[A-Za-z<>\[\]{}|&,.\s]+(?=\s*[,)])', ''  # Remove type annotations
    $jsxContent = $jsxContent -replace 'interface\s+\w+\s*\{[^}]*\}', ''  # Remove interfaces
    $jsxContent = $jsxContent -replace 'type\s+\w+\s*=\s*[^;]+;', ''  # Remove type aliases
    $jsxContent = $jsxContent -replace 'export\s+interface\s+\w+\s*\{[^}]*\}', ''  # Remove exported interfaces
    $jsxContent = $jsxContent -replace 'export\s+type\s+\w+\s*=\s*[^;]+;', ''  # Remove exported types
    $jsxContent = $jsxContent -replace 'VariantProps<[^>]+>', ''  # Remove VariantProps
    $jsxContent = $jsxContent -replace 'React\.\w+<[^>]+>', 'React.$1'  # Remove React type parameters
    $jsxContent = $jsxContent -replace 'React\.forwardRef<[^>]+>', 'React.forwardRef'  # Remove forwardRef type parameters
    
    # Clean up empty lines and imports
    $jsxContent = $jsxContent -replace '(?m)^\s*import\s+.*type.*\s+from.*$', ''  # Remove type-only import lines
    $jsxContent = $jsxContent -replace '(?m)^\s*$', ''  # Remove empty lines
    
    # Create new JSX file
    $jsxFile = $file.FullName -replace '\.tsx$', '.jsx'
    Set-Content -Path $jsxFile -Value $jsxContent -Encoding UTF8
    
    Write-Host "Created $jsxFile"
}

Write-Host "Conversion complete!" 