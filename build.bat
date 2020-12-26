@echo off
if "%1" == "" @echo on && echo Usage: && echo $ build module-name && @echo off && findstr "^::" "%~f0"&GOTO:EOF

rem wat2wasm -o %1/%1.wasm %1.wat
node wasm2js.js %1
