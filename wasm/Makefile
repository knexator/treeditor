add.wasm: add.wat
	wat2wasm add.wat -o add.wasm

.PHONY: test_wasi
test_wasi:
	wasmtime hello_wasi.wat