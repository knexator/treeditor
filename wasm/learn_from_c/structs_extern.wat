(module $structs_extern.wasm
  (type $t0 (func (param i32 i32 i32)))
  (type $t1 (func))
  (type $t2 (func (param i32 i32) (result f32)))
  (func $sub_points (import "env" "sub_points") (type $t0) (param i32 i32 i32))
  (func $__wasm_call_ctors (export "__wasm_call_ctors") (type $t1))
  (func $distanceSquared (export "distanceSquared") (type $t2) (param $p0 i32) (param $p1 i32) (result f32)
    (local $l2 i32) (local $l3 f32) (local $l4 f32)
    (global.set $__stack_pointer
      (local.tee $l2
        (i32.sub
          (global.get $__stack_pointer)
          (i32.const 32))))
    (i64.store offset=16
      (local.get $l2)
      (i64.load align=4
        (local.get $p0)))
    (i64.store offset=8
      (local.get $l2)
      (i64.load align=4
        (local.get $p1)))
    (call $sub_points
      (i32.add
        (local.get $l2)
        (i32.const 24))
      (i32.add
        (local.get $l2)
        (i32.const 16))
      (i32.add
        (local.get $l2)
        (i32.const 8)))
    (local.set $l3
      (f32.load offset=28
        (local.get $l2)))
    (local.set $l4
      (f32.load offset=24
        (local.get $l2)))
    (global.set $__stack_pointer
      (i32.add
        (local.get $l2)
        (i32.const 32)))
    (f32.add
      (f32.mul
        (local.get $l4)
        (local.get $l4))
      (f32.mul
        (local.get $l3)
        (local.get $l3))))
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
