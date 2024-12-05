const args = process.argv.slice(2);
const wasmCode = await Bun.file(args[0]).arrayBuffer();
const wasmModule = await WebAssembly.compile(wasmCode);
const instance = await WebAssembly.instantiate(wasmModule, {
    env: {
        consoleLogNumber: (arg) => console.log(arg),
    }
});
const wasm_exports = instance.exports;
const wasm_memory = new Uint8Array(wasm_exports.memory.buffer);
wasm_exports.main();
