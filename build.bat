@echo off
if "%1" == "" @echo on && echo Usage: && echo $ build module-name && @echo off && findstr "^::" "%~f0"&GOTO:EOF

wat2wasm %1.wat
node wasm2js.js %1.wasm > wasm-module-%1.js
BatchSubstitute.bat %1 > index.html
