game.wasm: game.kwt build_kwasm.knx
	bun ../../src/knx.ts ./build_kwasm.knx
	wat2wasm game.wat -o game.wasm

.PHONY: all
all: game.wasm
