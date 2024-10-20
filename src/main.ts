import * as twgl from 'twgl.js';
import GUI from 'lil-gui';
import { Input, KeyCode, Mouse, MouseButton } from './kommon/input';
import { DefaultMap, assertNotNull, at, fromCount, fromRange, getFromStorage, last, objectMap, repeat, reversedForEach, zip2 } from './kommon/kommon';
import { mod, towards, lerp, inRange, clamp, argmax, argmin, max, remap, clamp01, randomInt, randomFloat, randomChoice, doSegmentsIntersect, closestPointOnSegment, roundTo } from './kommon/math';
import { initGL2, Vec2, Color, GenericDrawer, StatefulDrawer, CircleDrawer, m3, CustomSpriteDrawer, Transform, IRect, IColor, IVec2, FullscreenShader } from 'kanvas2d';
import { Drawer } from './drawer';
import { concatAddresses, doNil, doPair, getAtLocalAddress, isValidAddress, parentAdress, parseSexpr, randomAtom, setAtLocalAddress, Sexpr, SexprAddress } from './model';
import { Asdf, Cursor, Address } from './wobbly_model';

const input = new Input();
const canvas = document.querySelector<HTMLCanvasElement>('#ctx_canvas')!;
const drawer = new Drawer(canvas.getContext('2d')!);

const CONFIG = {
    _0_1: 0.0,
};

// const gui = new GUI();
// gui.add(CONFIG, '_0_1', 0, 1).listen();

// let cur_sexpr: Sexpr = parseSexpr('(+ (* 3 3) 2)');
// // let cur_sexpr: Sexpr = parseSexpr('()');
// let cur_selected: SexprAddress = [];
// let normal_mode = true;

let mode: 'normal' | 'writing' = 'normal';

// let asdf3: Asdf = Asdf.fromRaw(['toplevel', ['fn', 'main', [['u', 'f32'], ['v', 'f32']], 'f32',
//     ['if', ['<', 'u', '0'], ['+', ['*', 'dx', 'dx'], ['*', 'dy', 'dy']], ['+', ['*', 'dx', 'dx'], ['*', 'dy', 'dy']]]]]);
let asdf3: Asdf = Asdf.fromRaw(['toplevel', ['fn', 'main', [['u', 'f32'], ['v', 'f32']], 'f32',
    ['let', [['dx', ['-', 'u', '.5']], ['dy', ['-', 'v', '.5']]], ['+', ['*', 'dx', 'dx'], ['*', 'dy', 'dy']]]]]);
// [['const', 'dx', ['u', '-', '.5']], ['return', 'dx']]]]);
// const cursor = new Cursor(new Address([1, 2, 0]));
let cur_selected = new Address([1, 2, 0]);

let last_timestamp_millis = 0;
// main loop; game logic lives here
function every_frame(cur_timestamp_millis: number) {
    const delta_time = (cur_timestamp_millis - last_timestamp_millis) / 1000;
    last_timestamp_millis = cur_timestamp_millis;
    input.startFrame();
    twgl.resizeCanvasToDisplaySize(canvas);

    const global_t = cur_timestamp_millis / 1000;
    drawer.clear();

    drawer.drawBasic(asdf3, cur_selected, mode);

    if (mode === 'normal') {
        if (input.keyboard.wasPressed(KeyCode.ArrowRight) || input.keyboard.wasPressed(KeyCode.KeyJ)) {
            // (.. [a] b ..) => (.. a [b] ..)
            if (cur_selected.data.length > 0) {
                cur_selected = cur_selected.nextSibling().validOrNull(asdf3) ?? cur_selected;
            }
        }
        else if (input.keyboard.wasPressed(KeyCode.ArrowLeft) || input.keyboard.wasPressed(KeyCode.KeyK)) {
            // (.. a [b] ..) => (.. [a] b ..)
            if (cur_selected.data.length > 0) {
                cur_selected = cur_selected.prevSibling(asdf3) ?? cur_selected;
            }
        }
        else if (input.keyboard.wasPressed(KeyCode.ArrowDown) || input.keyboard.wasPressed(KeyCode.KeyL)) {
            // [(a ..)] => ([a] ..)
            cur_selected = cur_selected.firstChild().validOrNull(asdf3) ?? cur_selected;
        }
        else if (input.keyboard.wasPressed(KeyCode.ArrowUp) || input.keyboard.wasPressed(KeyCode.KeyH)) {
            // ([a] ..) => [(a ..)]
            cur_selected = cur_selected.parent() ?? cur_selected;
        }
        else if (input.keyboard.wasPressed(KeyCode.KeyI)) {
            // [a] -> ([a])
            asdf3 = asdf3.setAt(cur_selected, new Asdf([asdf3.getAt(cur_selected)!]));
        }
        else if (input.keyboard.wasPressed(KeyCode.KeyM)) {
            // [(a)] -> [a]
            const stuff = asdf3.getAt(cur_selected)!;
            if (!stuff.isLeaf() && stuff.childCount() === 1) {
                asdf3 = asdf3.setAt(cur_selected, stuff.childAt(0)!);
            }
        }
        else if (input.keyboard.wasPressed(KeyCode.KeyY)) {
            // (.. [a] ..) -> (.. a [a] ..)
            const to_duplicate = asdf3.getAt(cur_selected)!;
            asdf3 = asdf3.insertBefore(cur_selected, to_duplicate);
            cur_selected = cur_selected.nextSibling();
        }
        else if (input.keyboard.wasPressed(KeyCode.KeyD)) {
            // (.. [a] b ..) -> (.. [b] ..)
            // (.. a [b]) -> (.. [a])
            // ([a]) -> [()]
            if (cur_selected.data.length > 0) {
                asdf3 = asdf3.deleteAt(cur_selected) ?? asdf3;
                cur_selected = cur_selected.validFor(asdf3)
                    ? cur_selected
                    : cur_selected.safePrevSibling() ?? cur_selected.parent()!;
            }
        }
        else if (input.keyboard.wasPressed(KeyCode.Digit1)) {
            // [(a b ..)] -> (a [b] ..)
            cur_selected = cur_selected.plus(1).validOrNull(asdf3) ?? cur_selected;
        }
        else if (input.keyboard.wasPressed(KeyCode.Digit2)) {
            // [(a b c ..)] -> (a b [c] ..)
            cur_selected = cur_selected.plus(2).validOrNull(asdf3) ?? cur_selected;
        }
        else if (input.keyboard.wasPressed(KeyCode.Digit3)) {
            cur_selected = cur_selected.plus(3).validOrNull(asdf3) ?? cur_selected;
        }
        else if (input.keyboard.wasPressed(KeyCode.Digit4)) {
            cur_selected = cur_selected.plus(4).validOrNull(asdf3) ?? cur_selected;
        }
        else if (input.keyboard.wasPressed(KeyCode.Digit5)) {
            cur_selected = cur_selected.plus(5).validOrNull(asdf3) ?? cur_selected;
        }
        else if (input.keyboard.wasPressed(KeyCode.BracketRight)) {
            // go to variable definition
            const my_var = asdf3.getAt(cur_selected)!;
            if (my_var.isLeaf()) {
                const my_var_name = my_var.data;
                if (typeof my_var_name !== 'string') throw new Error('unreachable');
                let maybe_address = cur_selected.parent();
                while (maybe_address !== null) {
                    const stuff_at_maybe = asdf3.getAt(maybe_address)!;
                    console.log(stuff_at_maybe);
                    if (stuff_at_maybe.childCount() >= 2
                        && stuff_at_maybe.childAt(0)!.isAtom('let')) {
                        const bindings = stuff_at_maybe.childAt(1)!;
                        let result: Address | null = null;
                        bindings.forEachChild((v, k) => {
                            if (v.childCount() === 2 && v.childAt(0)!.isAtom(my_var_name)) {
                                result = maybe_address!.plus(1).plus(k).plus(0);
                                return;
                            }
                        });
                        if (result !== null) {
                            cur_selected = result;
                            break;
                        }
                    }
                    else if (stuff_at_maybe.childCount() >= 5
                        && stuff_at_maybe.childAt(0)!.isAtom('fn')) {
                        const params = stuff_at_maybe.childAt(2)!;
                        let result: Address | null = null;
                        params.forEachChild((v, k) => {
                            if (v.childCount() === 2 && v.childAt(0)!.isAtom(my_var_name)) {
                                result = maybe_address!.plus(2).plus(k).plus(0);
                                return;
                            }
                        });
                        if (result !== null) {
                            cur_selected = result;
                            break;
                        }
                    }
                    maybe_address = maybe_address.parent();
                }
            }
        }
        // else if
        // // (.. [a] ..) -> [a] (.. ..)
        else if (input.keyboard.wasPressed(KeyCode.KeyC)) {
            // change atom name
            if (asdf3.getAt(cur_selected)!.isLeaf()) {
                mode = 'writing';
            }
        }
    }
    else if (mode === 'writing') {
        const thing = asdf3.getAt(cur_selected)!;
        if (!thing.isLeaf()) throw new Error('unreachable');
        const val = thing.data;
        if (typeof val !== 'string') throw new Error('unreachable');

        if (input.keyboard.wasPressed(KeyCode.Backspace)) {
            asdf3 = asdf3.setAt(cur_selected, new Asdf(val.slice(0, -1)));
        }
        else if (input.keyboard.wasPressed(KeyCode.Escape) || input.keyboard.wasPressed(KeyCode.Backslash)) {
            mode = 'normal';
        }
        else {
            if (input.keyboard.text.length > 0) {
                asdf3 = asdf3.setAt(cur_selected, new Asdf(val + input.keyboard.text));
            }
        }
    }
    else {
        const _: never = mode;
    }

    // drawer.mainProgram(renderAsdf(asdf3, new Address([]), cursor));

    // THE THING
    // drawer.mainThing(cur_sexpr, cur_selected, normal_mode);

    // if (normal_mode) {
    //     if (input.keyboard.wasPressed(KeyCode.ArrowLeft)) {
    //         cur_selected.push('l');
    //     }
    //     else if (input.keyboard.wasPressed(KeyCode.ArrowRight)) {
    //         cur_selected.push('r');
    //     }
    //     else if (input.keyboard.wasPressed(KeyCode.ArrowUp)) {
    //         cur_selected.pop();
    //     }
    //     // make selected thing into list
    //     else if (input.keyboard.wasPressed(KeyCode.KeyI)) {
    //         // [a] -> ([a])
    //         cur_sexpr = setAtLocalAddress(cur_sexpr, cur_selected,
    //             doPair(getAtLocalAddress(cur_sexpr, cur_selected), doNil()));
    //         cur_selected = concatAddresses(cur_selected, ['l']);
    //     }
    //     // append element
    //     else if (input.keyboard.wasPressed(KeyCode.KeyA)) {
    //         // ([a] . b) -> (a [N] . b)
    //         if (cur_selected.length > 0 && at(cur_selected, -1) == 'l') {
    //             const parent_address = parentAdress(cur_selected);
    //             cur_sexpr = setAtLocalAddress(cur_sexpr, parent_address,
    //                 doPair(getAtLocalAddress(cur_sexpr, cur_selected),
    //                     doPair(randomAtom(), getAtLocalAddress(cur_sexpr, concatAddresses(parent_address, ['r'])))));
    //             cur_selected = concatAddresses(parent_address, ['r', 'l']);
    //         }
    //     }
    //     // select next element of the list
    //     else if (input.keyboard.wasPressed(KeyCode.KeyJ)) {
    //         // ([a] b . c) => (a [b] . c)
    //         if (cur_selected.length > 0 && at(cur_selected, -1) == 'l') {
    //             const new_address = concatAddresses(parentAdress(cur_selected), ['r', 'l']);
    //             if (isValidAddress(cur_sexpr, new_address)) {
    //                 cur_selected = new_address;
    //             }
    //         }
    //     }
    //     // select prev element of the list
    //     else if (input.keyboard.wasPressed(KeyCode.KeyK)) {
    //         // (a [b] . c) => ([a] b . c)
    //         if (cur_selected.length > 1 && at(cur_selected, -1) == 'l') {
    //             const new_address = concatAddresses(parentAdress(parentAdress(cur_selected)), ['l']);
    //             if (isValidAddress(cur_sexpr, new_address)) {
    //                 cur_selected = new_address;
    //             }
    //         }
    //     }
    //     // enter pair
    //     else if (input.keyboard.wasPressed(KeyCode.KeyL)) {
    //         // [(a . b)] => ([a] . b)
    //         const new_address = concatAddresses(cur_selected, ['l']);
    //         if (isValidAddress(cur_sexpr, new_address)) {
    //             cur_selected = new_address;
    //         }
    //     }
    //     // exit list
    //     else if (input.keyboard.wasPressed(KeyCode.KeyH)) {
    //         // (... [a] ...) => [(... a ...)]
    //         if (cur_selected.length > 0) {
    //             let new_address = parentAdress(cur_selected);
    //             while (new_address.length > 0 && at(new_address, -1) === 'r') {
    //                 new_address = parentAdress(new_address);
    //             }
    //             if (isValidAddress(cur_sexpr, new_address)) {
    //                 cur_selected = new_address;
    //             }
    //         }
    //     }
    //     // delete thing
    //     else if (input.keyboard.wasPressed(KeyCode.KeyD)) {
    //         // (a . [b]) -> [a]
    //         // ([a] . b) -> [b]
    //         if (cur_selected.length > 0) {
    //             const last = at(cur_selected, -1);
    //             const other = last === 'l' ? 'r' : 'l';
    //             const parent_address = parentAdress(cur_selected);
    //             cur_sexpr = setAtLocalAddress(cur_sexpr, parent_address,
    //                 getAtLocalAddress(cur_sexpr, concatAddresses(parent_address, [other])));
    //             cur_selected = parent_address;
    //         }
    //     }
    //     // change atom name
    //     else if (input.keyboard.wasPressed(KeyCode.KeyC)) {
    //         const thing = getAtLocalAddress(cur_sexpr, cur_selected);
    //         if (thing.type === 'atom') {
    //             thing.value = '';
    //             normal_mode = false;
    //         }
    //     }
    // }
    // else {
    //     const thing = getAtLocalAddress(cur_sexpr, cur_selected);
    //     if (thing.type !== 'atom') throw new Error('unreachable');

    //     if (input.keyboard.wasPressed(KeyCode.Backspace)) {
    //         thing.value = thing.value.slice(0, -1);
    //     }
    //     else if (input.keyboard.wasPressed(KeyCode.Backslash)) {
    //         normal_mode = true;
    //     }
    //     else {
    //         thing.value += input.keyboard.text;
    //     }
    // }
    // // (doThing stuff) -> stuff
    // // (doThing a b) -> (doThing b a)

    animation_id = requestAnimationFrame(every_frame);
}

if (import.meta.hot) {
    // if (import.meta.hot.data.cur_thing !== undefined) {
    //     // cur_thing = import.meta.hot.data.cur_thing;
    //     const old_thing = import.meta.hot.data.cur_thing as ExecutingSolution;
    //     if (old_thing.constructor.name == 'ExecutingSolution') {
    //         console.log('stuff');
    //         cur_thing = old_thing;
    //         Object.setPrototypeOf(cur_thing, ExecutingSolution.prototype);
    //         // cur_thing = Object.assign(new ExecutingSolution(), old_thing);

    //         let cosa = cur_thing.cur_execution_state;
    //         Object.setPrototypeOf(cosa, ExecutionState.prototype);
    //         while (cosa.parent !== null) {
    //             Object.setPrototypeOf(cosa.parent, ExecutionState.prototype);
    //             cosa = cosa.parent;
    //         }
    //     }
    // }

    // if (import.meta.hot === undefined) throw new Error('unreachable');
    import.meta.hot.accept();
    import.meta.hot.accept('./executing_solution.ts', (_) => { });

    import.meta.hot.dispose((data) => {
        input.mouse.dispose();
        input.keyboard.dispose();
        cancelAnimationFrame(animation_id);
        // gui.destroy();
        // data.cur_thing = cur_thing;
    });
}

let animation_id: number;
const loading_screen_element = document.querySelector<HTMLDivElement>('#loading_screen');
if (loading_screen_element) {
    loading_screen_element.innerText = 'Press to start!';
    document.addEventListener('pointerdown', (_event) => {
        loading_screen_element.style.opacity = '0';
        animation_id = requestAnimationFrame(every_frame);
    }, { once: true });
}
else {
    animation_id = requestAnimationFrame(every_frame);
}
