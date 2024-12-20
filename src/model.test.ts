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
        if (!(received instanceof Asdf)) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            return { pass: false, message: () => `Got something weird: ${received}` };
        }
        if (Asdf.fromCutre(expected).equals(received)) {
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

    expect(Asdf.fromCutre('hola // coment')).toBeLitAsdf('hola');

    expect(Asdf.fromCutre(`(hola 
                    muy  // commented line
                buenas   ) // extra`)).toBeAsdf(Asdf.fromRaw(['hola', 'muy', 'buenas']));
});

test('built in vaus', () => {
    expect(
        outerEval(Asdf.fromCutre('($first 1 2 3)'), Env.standard()),
    ).toBeLitAsdf('1');

    expect(
        outerEval(Asdf.fromCutre('($quote (1 2 3))'), Env.standard()),
    ).toBeLitAsdf('(1 2 3)');

    expect(
        outerEval(Asdf.fromCutre('(list #1 #2 #3)'), Env.standard()),
    ).toBeLitAsdf('(1 2 3)');

    expect(
        outerEval(Asdf.fromCutre('(+ #1 #2)'), Env.standard()),
    ).toBeLitAsdf('3');

    expect(
        outerEval(Asdf.fromCutre('(+ (+ #1 #2) #3 #4)'), Env.standard()),
    ).toBeLitAsdf('10');

    expect(
        outerEval(Asdf.fromCutre('(<? (+ #1 #2) #5)'), Env.standard()),
    ).toBeLitAsdf('true');

    expect(
        outerEval(Asdf.fromCutre('($if (<? (+ #1 #2) #5) #yay #nay)'), Env.standard()),
    ).toBeLitAsdf('yay');

    expect(
        outerEval(Asdf.fromCutre('(chars #hola)'), Env.standard()),
    ).toBeLitAsdf('(h o l a)');

    expect(
        outerEval(Asdf.fromCutre('(join (chars #hola))'), Env.standard()),
    ).toBeLitAsdf('hola');

    expect(
        outerEval(Asdf.fromCutre(`($let ( (x #1) (y (+ #2 #3)) ) (+ x y))`), Env.standard()),
    ).toBeLitAsdf('6');

    expect(
        outerEval(Asdf.fromCutre(`($let ( ($firstSecond ($vau (a (b c) d) _ b)) ) ($firstSecond (1 2) (3 4) (5 6)))`), Env.standard()),
    ).toBeLitAsdf('3');

    expect(
        outerEval(Asdf.fromCutre(`($sequence ($define! x (+ #1 #2)) x)`), Env.standard()),
    ).toBeLitAsdf('3');

    expect(
        outerEval(Asdf.fromCutre(`($sequence 
            ($define! inc ($lambda (x) (+ #1 x)))
            (inc (+ #1 #2)))`), Env.standard()),
    ).toBeLitAsdf('4');

    expect(
        outerEval(Asdf.fromCutre(`($letrec ((fact ($lambda (n) ($if (<? n #2) #1 (* n (fact (- n #1))))))) (fact #4))`), Env.standard()),
    ).toBeLitAsdf('24');

    expect(
        outerEval(Asdf.fromCutre(`($sequence 
            ($define! x #1)
            ($define! y #2)
            ($provide! (x) ($sequence
                ($define! x #3)
                ($define! y #4)))
            (list x y))`), Env.standard()),
    ).toBeLitAsdf('(3 2)');

    expect(
        outerEval(Asdf.fromCutre(`($sequence 
            ($define! x #1)
            ($define! y #2)
            ($import! (x) ($let ((env (make-standard-env))) ($sequence
                ($set! env x #3)
                ($set! env y #4)
                env)))
            (list x y))`), Env.standard()),
    ).toBeLitAsdf('(3 2)');

    expect(
        outerEval(Asdf.fromCutre(`($let (( (head . tail) (list #1 #2 #3))) (list head tail))`), Env.standard()),
    ).toBeLitAsdf('(1 (2 3))');

    expect(
        outerEval(Asdf.fromCutre(`($let (( (head . tail) (list #1))) (list head tail))`), Env.standard()),
    ).toBeLitAsdf('(1 ())');

    expect(
        outerEval(Asdf.fromCutre(`(toUpperCase #Hola)`), Env.standard()),
    ).toBeLitAsdf('HOLA');

    expect(
        outerEval(Asdf.fromCutre(`(joinWithSeparator (map (chars #Hola) toUpperCase) EMPTY_STRING)`), Env.standard()),
    ).toBeLitAsdf('HOLA');

    // like apply but for operatives
    expect(
        outerEval(Asdf.fromCutre('(operate $first ($quote (a b c)))'), Env.standard()),
    ).toBeLitAsdf('a');
});

test('bugs', () => {
    expect(
        outerEval(Asdf.fromCutre(`($match ($quote (!params $i i32 $j i32 $r i32 $g i32 $b i32))
            ((#!params . rest)  #good)
            (_ #bad))`), Env.standard()),
    ).toBeLitAsdf('good');

    expect(Asdf.fromCutre(`(foo
        // bar
    )`).toCutreString()).toBe('(foo)');
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
