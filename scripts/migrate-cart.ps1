# Script para aplicar la migración del carrito a Supabase
# Ejecutar desde la raíz del proyecto

Write-Host "🛒 Migración del Carrito - Supabase" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el archivo de migración
$migrationFile = "supabase\cart_migration.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Error: No se encuentra el archivo $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Archivo de migración encontrado" -ForegroundColor Green
Write-Host ""

# Instrucciones
Write-Host "📋 Instrucciones para aplicar la migración:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Opción 1: Dashboard de Supabase (Recomendado)" -ForegroundColor White
Write-Host "  1. Ve a https://supabase.com/dashboard" -ForegroundColor Gray
Write-Host "  2. Selecciona tu proyecto" -ForegroundColor Gray
Write-Host "  3. Ve a SQL Editor" -ForegroundColor Gray
Write-Host "  4. Crea una nueva query" -ForegroundColor Gray
Write-Host "  5. Copia y pega el contenido de: $migrationFile" -ForegroundColor Gray
Write-Host "  6. Haz clic en 'Run' para ejecutar" -ForegroundColor Gray
Write-Host ""

Write-Host "Opción 2: CLI de Supabase" -ForegroundColor White
Write-Host "  Ejecuta: supabase db push" -ForegroundColor Gray
Write-Host ""

Write-Host "Opción 3: psql (PostgreSQL CLI)" -ForegroundColor White
Write-Host "  Ejecuta: psql -h <tu-db-host> -U postgres -d postgres -f $migrationFile" -ForegroundColor Gray
Write-Host ""

# Abrir el archivo en el editor predeterminado
$response = Read-Host "¿Deseas abrir el archivo de migración ahora? (s/n)"
if ($response -eq "s" -or $response -eq "S") {
    Write-Host ""
    Write-Host "📂 Abriendo archivo de migración..." -ForegroundColor Cyan
    Start-Process $migrationFile
    Write-Host "✅ Archivo abierto. Copia su contenido y pégalo en Supabase SQL Editor." -ForegroundColor Green
}

Write-Host ""
Write-Host "📖 Para más información, consulta: CARRITO_LIGADO_USUARIO.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Una vez ejecutada la migración, tu carrito estará ligado a la cuenta de usuario." -ForegroundColor Green
Write-Host ""
