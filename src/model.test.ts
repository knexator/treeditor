import { expect, test } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Asdf } from './wobbly_model';
import { Env, envFromToplevel, outerEval } from './base_interpreter';

expect.extend({
    toBeAsdf(received: Asdf, expected: Asdf) {
        if (received.equals(expected)) {
            return { pass: true, message: () => 'yes' };
        }
        else {
            return { pass: false, message: () => `Got:\n\t${received.toCutreString()}\nexpected:\n\t${expected.toCutreString()}` };
        }
    },
    toBeLitAsdf(received: Asdf, expected: string) {
        if (received.equals(Asdf.fromCutre(expected))) {
            return { pass: true, message: () => 'yes' };
        }
        else {
            return { pass: false, message: () => `Got:\n\t${received.toCutreString()}\nexpected:\n\t${expected}` };
        }
    },
});

test('parsing', () => {
    expect(Asdf.fromCutre('hola')).toBeLitAsdf('hola');

    expect(Asdf.fromCutre('hola')).not.toBeLitAsdf('adios');

    expect(Asdf.fromCutre('(hola)')).toBeAsdf(Asdf.fromRaw(['hola']));

    expect(Asdf.fromCutre('((hola))')).toBeAsdf(Asdf.fromRaw([['hola']]));

    expect(Asdf.fromCutre('(hola buenas)')).toBeAsdf(Asdf.fromRaw(['hola', 'buenas']));

    expect(Asdf.fromCutre('(hola (buenos dias) etc)')).toBeAsdf(Asdf.fromRaw(['hola', ['buenos', 'dias'], 'etc']));

    expect(Asdf.fromCutre(`(hola 
                buenas   )`)).toBeAsdf(Asdf.fromRaw(['hola', 'buenas']));

    // expectError(Asdf.fromCutreString(`(hola`));
});

test('built in vaus', () => {
    expect(
        outerEval(Asdf.fromCutre('($first 1 2 3)'), Env.standard()),
    ).toBeLitAsdf('1');

    expect(
        outerEval(Asdf.fromCutre('($quote (1 2 3))'), Env.standard()),
    ).toBeLitAsdf('(1 2 3)');

    expect(
        outerEval(Asdf.fromCutre('($list 1 2 3)'), Env.standard()),
    ).toBeLitAsdf('(1 2 3)');

    expect(
        outerEval(Asdf.fromCutre('(+ #1 #2)'), Env.standard()),
    ).toBeLitAsdf('#3');

    expect(
        outerEval(Asdf.fromCutre('(+ (+ #1 #2) #3 #4)'), Env.standard()),
    ).toBeLitAsdf('#10');

    expect(
        outerEval(Asdf.fromCutre('(<? (+ #1 #2) #5)'), Env.standard()),
    ).toBeLitAsdf('#true');

    expect(
        outerEval(Asdf.fromCutre(`($let ( (x #1) (y (+ #2 #3)) ) (+ x y))`), Env.standard()),
    ).toBeLitAsdf('#6');
});

// test('basic eval', () => {
//     const env = envFromToplevel(Asdf.fromCutreString(`(toplevel
//         ($define! first ($lambda (a b) a))
//         ($def second (a b) b))`));

//     expect(outerEval(Asdf.fromCutreString('(first 1 2)'), env)!
//         .equals(new Asdf('1'))).toBe(true);
//     expect(outerEval(Asdf.fromCutreString('(second 1 2)'), env)!
//         .equals(new Asdf('2'))).toBe(true);
// });

// test('params destructuring', () => {
//     const env = envFromToplevel(Asdf.fromCutreString(`(toplevel
//         ($define! full ($vau a _ a)))`));

//     expect(outerEval(Asdf.fromCutreString('(full 1 2)'), env)!
//         .equals(Asdf.fromCutreString('(1 2)'))).toBe(true);
//     // expect(outerEval(Asdf.fromCutreString('(second 1 2)'), env)!
//     //     .equals(new Asdf('2'))).toBe(true);
// });
