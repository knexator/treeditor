import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);
const wasmCode = await Bun.file(args[0]).arrayBuffer();
const wasmModule = await WebAssembly.compile(wasmCode);
const instance = await WebAssembly.instantiate(wasmModule, {
    env: {
        consoleLogNumber: (arg) => console.log(arg),
        loadFile: (ptr_to_filename_z, ptr_dst) => {
            const file_name = getCString(ptr_to_filename_z);
            const resolved_path = path.resolve(file_name);
            const file_contents = fs.readFileSync(resolved_path);
            wasm_memory.set(file_contents, ptr_dst);
            wasm_memory[ptr_dst + file_contents.length] = 0;
            return file_contents.length + 1;
        }
    }
});
const wasm_exports = instance.exports;
const wasm_memory = new Uint8Array(wasm_exports.memory.buffer);
wasm_exports.main();

// Read a null-terminated string from WASM memory
function getCString(ptr_z) {
    let str = '';
    for (let i = ptr_z; wasm_memory[i] !== 0; i++) {
        str += String.fromCharCode(wasm_memory[i]);
    }
    return str;
}
