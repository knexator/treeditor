(module $reduce.wasm
  (type $t0 (func))
  (type $t1 (func (param i32 i32) (result i32)))
  (func $__wasm_call_ctors (export "__wasm_call_ctors") (type $t0))
  (func $numberFromString (export "numberFromString") (type $t1) (param $p0 i32) (param $p1 i32) (result i32)
    (local $l2 i32) (local $l3 i32) (local $l4 i32)
    (local.set $l2
      (i32.const 0))
    (block $B0
      ;; if start >= end, break early
      (br_if $B0
        (i32.ge_u
          (local.get $p0)
          (local.get $p1)))
      (local.set $l3
        (i32.const 0))
      (local.set $p0
        (local.get $p0))
      (loop $L1
        ;; result = result * 10 + mem[p0] - 48
        (local.set $l3
          (local.tee $l2
            (i32.add
              (i32.add
                (i32.mul
                  (local.get $l3)
                  (i32.const 10))
                (i32.load8_s
                  (local.tee $p0
                    (local.get $p0))))
              (i32.const -48))))
        ;; p0 += 1
        (local.set $p0
          (local.tee $l4
            (i32.add
              (local.get $p0)
              (i32.const 1))))
        (local.set $l2
          (local.get $l2))
        ;; jump back to L1 if p0 != p1
        (br_if $L1
          (i32.ne
            (local.get $l4)
            (local.get $p1)))))
    (local.get $l2))
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
