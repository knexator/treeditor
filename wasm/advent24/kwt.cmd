@echo off
@REM npx tsx ./src/knx.ts %*
@REM bun ./src/knx.ts %*

bun ../../src/knx.ts ./build_kwasm.knx %1
wat2wasm %~n1.wat -o %~n1.wasm
bun run_wasm.js %~n1.wasm
rm %~n1.wasm %~n1.wat
