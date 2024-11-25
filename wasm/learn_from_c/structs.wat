(module $structs.wasm
  (type $t0 (func))
  (type $t1 (func (param i32 f32 f32)))
  (type $t2 (func (param i32 i32 f32 f32)))
  (type $t3 (func (param i32 i32 f32)))
  (type $t4 (func (param i32 i32 i32)))
  (type $t5 (func (param i32 i32) (result f32)))
  (func $__wasm_call_ctors (export "__wasm_call_ctors") (type $t0))
  (func $create_point (export "create_point") (type $t1) (param $p0 i32) (param $p1 f32) (param $p2 f32)
    (f32.store offset=4
      (local.get $p0)
      (local.get $p2))
    (f32.store
      (local.get $p0)
      (local.get $p1)))
  (func $translate_point (export "translate_point") (type $t2) (param $p0 i32) (param $p1 i32) (param $p2 f32) (param $p3 f32)
    (f32.store
      (local.get $p0)
      (f32.add
        (f32.load
          (local.get $p1))
        (local.get $p2)))
    (f32.store offset=4
      (local.get $p0)
      (f32.add
        (f32.load offset=4
          (local.get $p1))
        (local.get $p3))))
  (func $scale_point (export "scale_point") (type $t3) (param $p0 i32) (param $p1 i32) (param $p2 f32)
    (f32.store
      (local.get $p0)
      (f32.mul
        (f32.load
          (local.get $p1))
        (local.get $p2)))
    (f32.store offset=4
      (local.get $p0)
      (f32.mul
        (f32.load offset=4
          (local.get $p1))
        (local.get $p2))))
  (func $add_points (export "add_points") (type $t4) (param $p0 i32) (param $p1 i32) (param $p2 i32)
    (f32.store
      (local.get $p0)
      (f32.add
        (f32.load
          (local.get $p1))
        (f32.load
          (local.get $p2))))
    (f32.store offset=4
      (local.get $p0)
      (f32.add
        (f32.load offset=4
          (local.get $p1))
        (f32.load offset=4
          (local.get $p2)))))
  (func $sub_points (export "sub_points") (type $t4) (param $p0 i32) (param $p1 i32) (param $p2 i32)
    (f32.store
      (local.get $p0)
      (f32.sub
        (f32.load
          (local.get $p1))
        (f32.load
          (local.get $p2))))
    (f32.store offset=4
      (local.get $p0)
      (f32.sub
        (f32.load offset=4
          (local.get $p1))
        (f32.load offset=4
          (local.get $p2)))))
  (func $distanceSquared (export "distanceSquared") (type $t5) (param $p0 i32) (param $p1 i32) (result f32)
    (local $l2 f32)
    (f32.add
      (f32.mul
        (local.tee $l2
          (f32.sub
            (f32.load
              (local.get $p0))
            (f32.load
              (local.get $p1))))
        (local.get $l2))
      (f32.mul
        (local.tee $l2
          (f32.sub
            (f32.load offset=4
              (local.get $p0))
            (f32.load offset=4
              (local.get $p1))))
        (local.get $l2))))
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
