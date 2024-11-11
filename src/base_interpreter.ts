import { assertEmpty, assertNotNull, zip2 } from './kommon/kommon';
import { Asdf } from './wobbly_model';

class BuiltInVau {
    constructor(
        public value: (params: Asdf[], env: Env) => Value,
    ) { }
}

type Value = Asdf | FnkDef | BuiltInVau | Env;

export class Env {
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

    static standard(): Env {
        return new Env([DEFAULT_ENV]);
    }
}

const DEFAULT_ENV: Env = new Env([]);
DEFAULT_ENV.add('$first', new BuiltInVau((params: Asdf[], env: Env) => {
    return params[0];
}));
DEFAULT_ENV.add('$quote', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 1) throw new Error(`$quote expects 1 argument, got ${params.length}`);
    return params[0];
}));
DEFAULT_ENV.add('list', new BuiltInVau((params: Asdf[], env: Env) => {
    const vals = params.map(e => myEval(e, env));
    // @ts-expect-error TODO
    return new Asdf(vals);
}));
DEFAULT_ENV.add('+', new BuiltInVau((params: Asdf[], env: Env) => {
    const numbers = params.map((p) => {
        const v = myEval(p, env);
        if (!(v instanceof Asdf)) throw new Error('not all values were numbers');
        return v.numberValue();
    });
    return Asdf.fromNumber(numbers.reduce((n, acc) => n + acc, 0));
}));
DEFAULT_ENV.add('<?', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 2) throw new Error(`expected 2 params`);
    const numbers = params.map((p) => {
        const v = myEval(p, env);
        if (!(v instanceof Asdf)) throw new Error('not all values were numbers');
        return v.numberValue();
    });
    return Asdf.fromBool(numbers[0] < numbers[1]);
}));
DEFAULT_ENV.add('$let', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 2) throw new Error(`expected 2 params`);
    const [bindings, body] = params;
    const new_env = new Env([env]);
    for (const binding of bindings.innerValues()) {
        const [formal_tree, value_expr, ...extra] = binding.innerValues();
        assertEmpty(extra);
        matchBindings(formal_tree, myEval(value_expr, env), new_env);
    }
    return myEval(body, new_env);
}));
DEFAULT_ENV.add('$vau', new BuiltInVau((params: Asdf[], env: Env) => {
    // ($vau x _ x) == $list
    // ($vau (x) _ x) == $quote
    // ($vau (x) dyn_env (eval x dyn_env)) == idenitity
    if (params.length !== 3) throw new Error(`expected 3 params`);
    const [formal_tree, env_name_expr, body] = params;
    const env_name = env_name_expr.atomValue();
    return new BuiltInVau((vau_params: Asdf[], vau_env: Env) => {
        const new_env = new Env([env]);
        matchBindings(formal_tree, new Asdf(vau_params), new_env);
        if (env_name !== '_') {
            new_env.add('_', vau_env);
        }
        return myEval(body, new_env);
    });
}));
DEFAULT_ENV.add('$define!', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 2) throw new Error(`expected 3 params`);
    const [formal_tree, value_expr] = params;
    const value = myEval(value_expr, env);
    matchBindings(formal_tree, value, env);
    return new Asdf('#inert');
}));
DEFAULT_ENV.add('$sequence', new BuiltInVau((params: Asdf[], env: Env) => {
    let last_value: Value = new Asdf('#inert');
    for (const expr of params) {
        last_value = myEval(expr, env);
    }
    return last_value;
}));

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
            result.add(fn_name.atomValue(), new FnkDef(false, params, new Asdf('TODO:-simplify-this'), body));
        }
    }
    return result;
}

export function outerEval(expr: Asdf, env: Env): Asdf | null {
    try {
        const res = myEval(expr, env);
        if (res instanceof Asdf) return res;
        return null;
    }
    catch (error) {
        console.log('got error', error);
        return null;
    }
}

// TODO: lambda params destructuring
export function myEval(expr: Asdf, env: Env): Value {
    console.log('evaluating: ', expr.toCutreString());
    if (expr.isLeaf()) {
        if (expr.atomValue()[0] === '#') return expr;
        return assertNotNull(env.lookup(expr.atomValue()));
    }
    const [raw_first, ...rest] = expr.innerValues();
    const first = myEval(raw_first, env);
    if (first instanceof FnkDef) {
        const params = first.params.innerValues();
        if (rest.length !== params.length) throw new Error('bad number of params');
        const new_env = new Env([env]);
        for (let k = 0; k < params.length; k++) {
            if (first.typed) {
                const [name, type, ...extra] = params[k].innerValues();
                if (extra.length > 0) throw new Error('bad format in param');
                ;
                new_env.add(name.atomValue(), rest[k]);
            }
            else {
                new_env.add(params[k].atomValue(), rest[k]);
            }
        }
        return myEval(first.body, new_env);
    }
    else if (first instanceof BuiltInVau) {
        return first.value(rest, env);
    }
    else if (first instanceof Asdf) {
        // TODO: move these to BuiltInVaus
        if (first.isAtom('#apply')) {
            // (apply car (one two)) -> one
            const [fn2_expr, params, ...extra] = rest;
            if (extra.length > 0) throw new Error('bad format in #apply');
            // TEMP HACK until params destructuring
            return myEval(new Asdf([fn2_expr, params]), env);
            // return myEval(new Asdf([fn2_expr, ...params.innerValues()]), env);
        }
        throw new Error(`no idea how to eval the expr: ${expr.toCutreString()}`);
    }
    else if (first instanceof Env) {
        throw new Error(`no idea how to eval an env`);
    }
    else {
        const _: never = first;
        throw new Error('unreachable');
    }
}

function matchBindings(formal_tree: Asdf, value: Value, env_to_add_stuff: Env): void {
    if (formal_tree.isLeaf()) {
        if (formal_tree.atomValue() !== '_') {
            env_to_add_stuff.add(formal_tree.atomValue(), value);
        }
    }
    else {
        const tree_ins = formal_tree.innerValues();
        if (!(value instanceof Asdf)) throw new Error('Can\'t do nested stuff with a non-Asdf value');
        const params_ins = value.innerValues();
        if (params_ins.length !== tree_ins.length) throw new Error('bad number of params');
        for (const [tree, param] of zip2(tree_ins, params_ins)) {
            matchBindings(tree, param, env_to_add_stuff);
        }
    }
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
