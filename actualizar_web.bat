@echo off
chcp 65001 > nul
echo ========================================================
echo   ACTUALIZADOR DE CATALOGO L'OREAL PROFESSIONNEL WEB
echo ========================================================
echo.
echo Sincronizando datos desde nuevo_catalogo_final_consolidado.xlsx...
if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" src\export_web.py %*
) else (
    python src\export_web.py %*
)
echo.
echo Proceso finalizado. Puedes abrir o recargar tu web app en web\index.html
echo.
pause
