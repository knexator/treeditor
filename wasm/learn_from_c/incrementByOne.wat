(module $incrementByOne.wasm
  (type $t0 (func))
  (type $t1 (func (param i32 i32 i32)))
  (func $__wasm_call_ctors (export "__wasm_call_ctors") (type $t0))
  (func $incrementByOne (export "incrementByOne") (type $t1) (param $p0 i32) (param $p1 i32) (param $p2 i32)
    (local $l3 i32) (local $l4 i32) (local $l5 i32) (local $l6 i32) (local $l7 i32)
    (block $B0
      (br_if $B0
        (i32.lt_s
          (local.get $p1)
          (i32.const 1)))
      (local.set $l3
        (i32.and
          (local.get $p1)
          (i32.const 3)))
      (local.set $l4
        (i32.const 0))
      (block $B1
        (br_if $B1
          (i32.lt_u
            (local.get $p1)
            (i32.const 4)))
        (local.set $l5
          (i32.and
            (local.get $p1)
            (i32.const 2147483644)))
        (local.set $p1
          (i32.const 0))
        (local.set $l4
          (i32.const 0))
        (loop $L2
          (i32.store
            (local.tee $l6
              (i32.add
                (local.get $p2)
                (local.get $p1)))
            (i32.add
              (i32.load
                (local.tee $l7
                  (i32.add
                    (local.get $p0)
                    (local.get $p1))))
              (i32.const 1)))
          (i32.store
            (i32.add
              (local.get $l6)
              (i32.const 4))
            (i32.add
              (i32.load
                (i32.add
                  (local.get $l7)
                  (i32.const 4)))
              (i32.const 1)))
          (i32.store
            (i32.add
              (local.get $l6)
              (i32.const 8))
            (i32.add
              (i32.load
                (i32.add
                  (local.get $l7)
                  (i32.const 8)))
              (i32.const 1)))
          (i32.store
            (i32.add
              (local.get $l6)
              (i32.const 12))
            (i32.add
              (i32.load
                (i32.add
                  (local.get $l7)
                  (i32.const 12)))
              (i32.const 1)))
          (local.set $p1
            (i32.add
              (local.get $p1)
              (i32.const 16)))
          (br_if $L2
            (i32.ne
              (local.get $l5)
              (local.tee $l4
                (i32.add
                  (local.get $l4)
                  (i32.const 4)))))))
      (br_if $B0
        (i32.eqz
          (local.get $l3)))
      (local.set $p1
        (i32.add
          (local.get $p0)
          (local.tee $l6
            (i32.shl
              (local.get $l4)
              (i32.const 2)))))
      (local.set $l6
        (i32.add
          (local.get $p2)
          (local.get $l6)))
      (loop $L3
        (i32.store
          (local.get $l6)
          (i32.add
            (i32.load
              (local.get $p1))
            (i32.const 1)))
        (local.set $p1
          (i32.add
            (local.get $p1)
            (i32.const 4)))
        (local.set $l6
          (i32.add
            (local.get $l6)
            (i32.const 4)))
        (br_if $L3
          (local.tee $l3
            (i32.add
              (local.get $l3)
              (i32.const -1)))))))
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
