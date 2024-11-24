// main.js
const wasmCode = await Bun.file("add.wasm").arrayBuffer();
const wasmModule = await WebAssembly.compile(wasmCode);
const instance = await WebAssembly.instantiate(wasmModule);
const { add } = instance.exports;

// Test the add function
console.log("5 + 3 =", add(5, 3));  // Should print "5 + 3 = 8"
console.log("123 + 456 =", add(123, 456));  // Should print "123 + 456 = 579"
