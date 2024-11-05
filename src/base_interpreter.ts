import { assertEmpty } from './kommon/kommon';
import { Asdf } from './wobbly_model';

type Value = Asdf | FnkDef;

class Env {
    public map: Map<string, Value>;
    constructor(
        public parents: Env[],
    ) {
        this.map = new Map();
    }

    add(key: string, value: Value): void {
        this.map.set(key, value);
    }

    lookup(key: string): Value | null {
        const v = this.map.get(key);
        if (v !== undefined) return v;
        for (const p of this.parents) {
            const cur = p.lookup(key);
            if (cur !== null) return cur;
        }
        return null;
    }
}

class FnkDef {
    constructor(
        public typed: boolean,
        public params: Asdf,
        public return_type: Asdf,
        public body: Asdf,
    ) { }
}

export function envFromToplevel(expr: Asdf): Env {
    const [toplevel, ...defs] = expr.innerValues();
    assertAtom(toplevel, 'toplevel');
    const result = new Env([]);
    for (const def of defs) {
        if (def.isLeaf()) continue;
        if (def.innerValues().length === 0) continue;
        const first = def.innerValues()[0];
        if (first.isAtom('fn')) {
            const [fn, fn_name, params, return_type, body, ...extra] = def.innerValues();
            assertAtom(fn, 'fn');
            assertEmpty(extra);
            result.add(fn_name.atomValue(), new FnkDef(true, params, return_type, body));
        }
        else if (first.isAtom('def')) {
            const [fn, fn_name, params, body, ...extra] = def.innerValues();
            assertAtom(fn, 'def');
            assertEmpty(extra);
            result.add(fn_name.atomValue(), new FnkDef(false, params, new Asdf('TODO: simplify this'), body));
        }
    }
    return result;
}

export function outerEval(expr: Asdf, env: Env): Asdf | null {
    const res = myEval(expr, env);
    if (res !== null && res instanceof Asdf) return res;
    return null;
}

export function myEval(expr: Asdf, env: Env): Value | null {
    if (expr.isLeaf()) return env.lookup(expr.atomValue());
    if (expr.innerValues().length === 0) return null;
    const [first, ...rest] = expr.innerValues();
    const fn = myEval(first, env);
    if (fn !== null && fn instanceof FnkDef) {
        const params = fn.params.innerValues();
        if (rest.length !== params.length) return null;
        const new_env = new Env([env]);
        for (let k = 0; k < params.length; k++) {
            if (fn.typed) {
                const [name, type, ...extra] = params[k].innerValues();
                if (extra.length > 0) return null;
                new_env.add(name.atomValue(), rest[k]);
            }
            else {
                new_env.add(params[k].atomValue(), rest[k]);
            }
        }
        return myEval(fn.body, new_env);
    }
    return new Asdf('adios');
}

function assertAtom(thing: Asdf, expected: string) {
    if (thing.atomValue() !== expected) throw new Error('bad input');
}

// function eval()
// const FnDef =
// (type FnDef (NamedTuple (
//     (_ (Literal String fn))
//     (name String)
//     (params (List (NamedTuple (
//         (param_name String)
//         (param_type Type)
//     ))))
//     (return_type Type)
//     (body (Expr return_type)) // returning return_type
// )))

// function toTypeScript(funk: Funk) {
//     const ['fn', name, params, returnType, body] = funk;
// }
