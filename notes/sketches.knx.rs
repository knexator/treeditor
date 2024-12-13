(rename-param 1 "new_v" (quote
    (fn main ((u f32) (v f32) f32 (+ u v)))
))
->
(fn main ((u f32) (new_v f32) f32 (+ u new_v)))

(fn rename-param (
    (param_index u32) 
    (new_param_name string)
    (('fn' fn_name old_params body) FnDef)
) FnDef
    (let* (((old_name type) (nth old_params param_index))
           (new_params (replace params index (pair new_param_name type))))
        (list 'fn' fn_name new_params (rename-var old_name new_param_name body))))

(type (Expr ))

(type (FnDef (inTypes ...) (outType Type)) (NamedTuple (
    (_ (Literal String fn))
    (name String)
    (params (List (NamedTuple (
        (param_name String)
        (param_type Type)
    ))))
    (return_type outType)
    (body (Expr Nil return_type)) // returning return_type
)))

(type (BoundedInt (min_inclusive Int) (max_exclusive Int)) (NamedTuple (
    (value Int)
)))

(BoundedInt -3 6)

(type (List (e Type)) (Union (
    (nil (Literal String nil))
    (pair (NamedTuple (
        (head e)
    )))
)))