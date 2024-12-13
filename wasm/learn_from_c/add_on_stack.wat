(module $add_on_stack.wasm
  (type $t0 (func))
  (type $t1 (func (param i32 i32) (result i32)))
  (func $__wasm_call_ctors (export "__wasm_call_ctors") (type $t0))
  (func $add_from_stack (export "add_from_stack") (type $t1) (param $p0 i32) (param $p1 i32) (result i32)
    (local $l2 i32) (local $l3 i32) (local $l4 i32) (local $l5 i32) (local $l6 i32) (local $l7 i32) (local $l8 i32) (local $l9 i32)
    (local.set $l2
      (global.get $__stack_pointer))
    (local.set $l3
      (i32.const 16))
    (local.set $l4
      (i32.sub
        (local.get $l2)
        (local.get $l3)))
    (i32.store offset=12
      (local.get $l4)
      (local.get $p0))
    (i32.store offset=8
      (local.get $l4)
      (local.get $p1))
    (local.set $l5
      (i32.load offset=12
        (local.get $l4)))
    (local.set $l6
      (i32.load
        (local.get $l5)))
    (local.set $l7
      (i32.load offset=8
        (local.get $l4)))
    (local.set $l8
      (i32.load
        (local.get $l7)))
    (local.set $l9
      (i32.add
        (local.get $l6)
        (local.get $l8)))
    (return
      (local.get $l9)))
  (func $main_thing (export "main_thing") (type $t1) (param $p0 i32) (param $p1 i32) (result i32)
    (local $l2 i32) (local $l3 i32) (local $l4 i32) (local $l5 i32) (local $l6 i32) (local $l7 i32) (local $l8 i32) (local $l9 i32) (local $l10 i32) (local $l11 i32) (local $l12 i32) (local $l13 i32)
    (local.set $l2
      (global.get $__stack_pointer))
    (local.set $l3
      (i32.const 16))
    (local.set $l4
      (i32.sub
        (local.get $l2)
        (local.get $l3)))
    (global.set $__stack_pointer
      (local.get $l4))
    (i32.store offset=12
      (local.get $l4)
      (local.get $p0))
    (i32.store offset=8
      (local.get $l4)
      (local.get $p1))
    (local.set $l5
      (i32.const 12))
    (local.set $l6
      (i32.add
        (local.get $l4)
        (local.get $l5)))
    (local.set $l7
      (local.get $l6))
    (local.set $l8
      (i32.const 8))
    (local.set $l9
      (i32.add
        (local.get $l4)
        (local.get $l8)))
    (local.set $l10
      (local.get $l9))
    (local.set $l11
      (call $add_from_stack
        (local.get $l7)
        (local.get $l10)))
    (local.set $l12
      (i32.const 16))
    (local.set $l13
      (i32.add
        (local.get $l4)
        (local.get $l12)))
    (global.set $__stack_pointer
      (local.get $l13))
    (return
      (local.get $l11)))
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
