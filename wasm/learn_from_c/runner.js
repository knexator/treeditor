const wasmCode = await Bun.file("add_mine.wasm").arrayBuffer();
const wasmModule = await WebAssembly.compile(wasmCode);
const instance = await WebAssembly.instantiate(wasmModule);
const { add } = instance.exports;

// Test the add function
console.log("5 + 3 =", add(5, 3));  // Should print "5 + 3 = 8"
console.log("123 + 456 =", add(123, 456));  // Should print "123 + 456 = 579"

// Benchmark the WASM function
console.log("\nBenchmarking WASM add function:");
const start = performance.now();
let sum = 0;
for (let i = 0; i < 1_000_000; i++) {
    sum = add(sum, i);
}
const end = performance.now();
console.log(`Performed 1 million additions in ${(end - start).toFixed(2)}ms`);
console.log(`Final sum: ${sum}`);
