(module $add.wasm
  (type $t0 (func))
  (type $t1 (func (param i32 i32) (result i32)))
  (func $__wasm_call_ctors (export "__wasm_call_ctors") (type $t0))
  (func $add (export "add") (type $t1) (param $p0 i32) (param $p1 i32) (result i32)
    (i32.add
      (local.get $p1)
      (local.get $p0)))
  (memory $memory (export "memory") 2)
  (global $__stack_pointer (mut i32) (i32.const 66560))
  (global $__dso_handle (export "__dso_handle") i32 (i32.const 1024))
  (global $__data_end (export "__data_end") i32 (i32.const 1024))
  (global $__stack_low (export "__stack_low") i32 (i32.const 1024))
  (global $__stack_high (export "__stack_high") i32 (i32.const 66560))
  (global $__global_base (export "__global_base") i32 (i32.const 1024))
  (global $__heap_base (export "__heap_base") i32 (i32.const 66560))
  (global $__heap_end (export "__heap_end") i32 (i32.const 131072))
  (global $__memory_base (export "__memory_base") i32 (i32.const 0))
  (global $__table_base (export "__table_base") i32 (i32.const 1)))
