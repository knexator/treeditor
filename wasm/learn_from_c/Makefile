%.wat: %.c
	clang -O3 --target=wasm32 --no-standard-libraries -Wl,--export-all -Wl,--no-entry -Wl,--allow-undefined -o $(basename $<).wasm $<
	wasm2wat $(basename $<).wasm -f --inline-exports --inline-imports --generate-names -o $@
	# rm $(basename $<).wasm

all: $(patsubst %.c, %.wat, $(wildcard *.c))

.PHONY: all