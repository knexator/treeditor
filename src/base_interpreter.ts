import * as fs from 'fs';
import * as path from 'path';

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
DEFAULT_ENV.add('*', new BuiltInVau((params: Asdf[], env: Env) => {
    const numbers = params.map((p) => {
        const v = myEval(p, env);
        if (!(v instanceof Asdf)) throw new Error('not all values were numbers');
        return v.numberValue();
    });
    return Asdf.fromNumber(numbers.reduce((n, acc) => n * acc, 1));
}));
DEFAULT_ENV.add('-', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 2) throw new Error(`expected 2 params`);
    const numbers = params.map((p) => {
        const v = myEval(p, env);
        if (!(v instanceof Asdf)) throw new Error('not all values were numbers');
        return v.numberValue();
    });
    return Asdf.fromNumber(numbers[0] - numbers[1]);
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
DEFAULT_ENV.add('$if', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 3) throw new Error(`expected 3 params`);
    const [cond, if_true, if_false] = params;
    if (asAsdf(myEval(cond, env)).boolValue()) {
        return myEval(if_true, env);
    }
    else {
        return myEval(if_false, env);
    }
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
DEFAULT_ENV.add('$letrec', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 2) throw new Error(`expected 2 params`);
    const [bindings, body] = params;
    const new_env = new Env([env]);
    for (const binding of bindings.innerValues()) {
        const [formal_tree, value_expr, ...extra] = binding.innerValues();
        assertEmpty(extra);
        matchBindings(formal_tree, myEval(value_expr, new_env), new_env);
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
            new_env.add(env_name, vau_env);
        }
        return myEval(body, new_env);
    });
}));
DEFAULT_ENV.add('$lambda', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 2) throw new Error(`expected 2 params`);
    const [formal_tree, body] = params;
    return new BuiltInVau((lambda_params: Asdf[], lambda_env: Env) => {
        const new_env = new Env([env]);
        const evaluated_params = lambda_params.map(p => myEval(p, lambda_env));
        // @ts-expect-error TODO: allow user code to return Values, not just Asdfs
        matchBindings(formal_tree, new Asdf(evaluated_params), new_env);
        return myEval(body, new_env);
    });
}));
DEFAULT_ENV.add('$define!', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 2) throw new Error(`expected 2 params`);
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
DEFAULT_ENV.add('operate', new BuiltInVau((params: Asdf[], env: Env) => {
    // (operate $first ($quote (a b c))) == a
    const [operand_expr, params_expr, ...extra] = params;
    if (extra.length > 1) throw new Error('expected 2 or 3 params');
    const operand_to_use = myEval(operand_expr, env);
    const params_to_use = myEval(params_expr, env);
    const env_to_use = (extra.length === 0) ? env : myEval(extra[0], env);
    if (!(env_to_use instanceof Env)) throw new Error('expected an Env');
    if (operand_to_use instanceof BuiltInVau) {
        if (!(params_to_use instanceof Asdf)) throw new Error('params are not an Asdf');
        if (params_to_use.isLeaf()) throw new Error('TODO: allow a single param');
        return operand_to_use.value(params_to_use.innerValues(), env_to_use);
    }
    else {
        throw new Error('not an operand');
    }
}));
DEFAULT_ENV.add('=?', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 2) throw new Error(`expected 2 params`);
    const [lhs, rhs] = params.map(p => myEval(p, env));
    if (lhs instanceof Asdf && rhs instanceof Asdf) {
        return Asdf.fromBool(lhs.equals(rhs));
    }
    throw new Error('bad params');
}));
DEFAULT_ENV.add('atom?', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 1) throw new Error(`expected 1 param`);
    const [val] = params.map(p => myEval(p, env));
    if (val instanceof Asdf) {
        return Asdf.fromBool(val.isLeaf());
    }
    throw new Error('bad params');
}));
DEFAULT_ENV.add('in?', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 2) throw new Error(`expected 2 params`);
    const [val, list] = params.map(p => asAsdf(myEval(p, env)));
    for (const v of list.innerValues()) {
        if (val.equals(v)) return Asdf.fromBool(true);
    }
    return Asdf.fromBool(false);
}));
DEFAULT_ENV.add('withHead', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 2) throw new Error(`expected 2 params`);
    const [val, list] = params.map(p => asAsdf(myEval(p, env)));
    return new Asdf([val, ...list.innerValues()]);
}));
DEFAULT_ENV.add('len', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 1) throw new Error(`expected 1 param`);
    const [val] = params.map(p => myEval(p, env));
    if (val instanceof Asdf) {
        return Asdf.fromNumber(val.innerValues().length);
    }
    throw new Error('bad params');
}));
DEFAULT_ENV.add('first', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 1) throw new Error(`expected 1 param`);
    const [val] = params.map(p => myEval(p, env));
    if (val instanceof Asdf) {
        return val.innerValues()[0];
    }
    throw new Error('bad params');
}));
DEFAULT_ENV.add('second', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 1) throw new Error(`expected 1 param`);
    const [val] = params.map(p => myEval(p, env));
    if (val instanceof Asdf) {
        return val.innerValues()[1];
    }
    throw new Error('bad params');
}));
DEFAULT_ENV.add('rest', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 1) throw new Error(`expected 1 param`);
    const [val] = params.map(p => myEval(p, env));
    if (val instanceof Asdf) {
        return new Asdf(val.innerValues().slice(1));
    }
    throw new Error('bad params');
}));
DEFAULT_ENV.add('chars', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 1) throw new Error(`expected 1 param`);
    const [val] = params.map(p => myEval(p, env));
    if (val instanceof Asdf) {
        return Asdf.fromRaw(val.atomValue().split(''));
    }
    throw new Error('bad params');
}));
DEFAULT_ENV.add('join', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 1) throw new Error(`expected 1 param`);
    const [val] = params.map(p => myEval(p, env));
    if (val instanceof Asdf) {
        return Asdf.fromRaw(val.innerValues().map(v => v.atomValue()).join(''));
    }
    throw new Error('bad params');
}));
DEFAULT_ENV.add('$cond', new BuiltInVau((params: Asdf[], env: Env) => {
    for (const clause of params) {
        const [cond, body, ...extra] = clause.innerValues();
        if (extra.length > 0) throw new Error('bad params');
        if (asAsdf(myEval(cond, env)).boolValue()) {
            return myEval(body, env);
        }
    }
    // return new Asdf('#inert');
    throw new Error('no valid cond!');
}));
DEFAULT_ENV.add('$match', new BuiltInVau((params: Asdf[], env: Env) => {
    const [expr, ...clauses] = params;
    const value = asAsdf(myEval(expr, env));
    for (const clause of clauses) {
        const [formal, body, ...extra] = clause.innerValues();
        if (extra.length > 0) throw new Error('bad params');
        const new_env = new Env([env]);
        if (tryToMatchBindings(formal, value, new_env)) {
            return myEval(body, new_env);
        }
    }
    throw new Error('could not match!');
}));
DEFAULT_ENV.add('load', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 1) throw new Error(`expected 1 param`);
    const [val] = params.map(p => asAsdf(myEval(p, env)));
    const resolvedPath = path.resolve(asAsdf(env.lookup('__file__')!).atomValue(), '..', val.atomValue());
    const fileContents = fs.readFileSync(resolvedPath, 'utf8');
    const main = Asdf.fromCutre(fileContents);
    return main;
}));

function asAsdf(v: Value): Asdf {
    if (v instanceof Asdf) return v;
    throw new Error('bad param');
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
    const result = Env.standard();
    for (const expr of defs) {
        try {
            myEval(expr, result);
        }
        catch {
            // nothing
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

// TODO: remove FnkDef
export function myEval(expr: Asdf, env: Env): Value {
    // console.log('evaluating: ', expr.toCutreString());
    if (expr.isLeaf()) {
        if (expr.atomValue()[0] === '#') return new Asdf(expr.atomValue().slice(1));
        return assertNotNull(env.lookup(expr.atomValue()), `undefined variable: ${expr.atomValue()}`);
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
    if (!tryToMatchBindings(formal_tree, value, env_to_add_stuff)) {
        throw new Error('bad params');
    }
}

// TODO: allow matching [first, ...rest]
function tryToMatchBindings(formal_tree: Asdf, value: Value, env_to_add_stuff: Env): boolean {
    if (formal_tree.isLeaf()) {
        const v = formal_tree.atomValue();
        if (v === '_') {
            // ignore the value
            return true;
        }
        else if (v[0] === '#') {
            return (value instanceof Asdf) && (value.isAtom(v.slice(1)));
        }
        else {
            env_to_add_stuff.add(formal_tree.atomValue(), value);
            return true;
        }
    }
    else {
        const tree_ins = formal_tree.innerValues();
        if (!(value instanceof Asdf)) return false;
        if (value.isLeaf()) return false;
        const params_ins = value.innerValues();
        if (params_ins.length !== tree_ins.length) return false;
        for (const [tree, param] of zip2(tree_ins, params_ins)) {
            if (!tryToMatchBindings(tree, param, env_to_add_stuff)) {
                return false;
            }
        }
        return true;
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

// TODO: $match
