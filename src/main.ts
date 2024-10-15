import * as twgl from 'twgl.js';
import GUI from 'lil-gui';
import { Input, KeyCode, Mouse, MouseButton } from './kommon/input';
import { DefaultMap, assertNotNull, at, fromCount, fromRange, getFromStorage, last, objectMap, repeat, reversedForEach, zip2 } from './kommon/kommon';
import { mod, towards, lerp, inRange, clamp, argmax, argmin, max, remap, clamp01, randomInt, randomFloat, randomChoice, doSegmentsIntersect, closestPointOnSegment, roundTo } from './kommon/math';
import { initGL2, Vec2, Color, GenericDrawer, StatefulDrawer, CircleDrawer, m3, CustomSpriteDrawer, Transform, IRect, IColor, IVec2, FullscreenShader } from 'kanvas2d';
import { Drawer } from './drawer';
import { concatAddresses, doNil, doPair, getAtLocalAddress, isValidAddress, parentAdress, parseSexpr, randomAtom, setAtLocalAddress, Sexpr, SexprAddress } from './model';

const input = new Input();
const canvas = document.querySelector<HTMLCanvasElement>('#ctx_canvas')!;
const drawer = new Drawer(canvas.getContext('2d')!);

const CONFIG = {
    _0_1: 0.0,
};

const gui = new GUI();
gui.add(CONFIG, '_0_1', 0, 1).listen();

// const cur_sexpr: Sexpr = parseSexpr('(+ (3 3 . 3) 2)');
let cur_sexpr: Sexpr = parseSexpr('()');
let cur_selected: SexprAddress = [];
let normal_mode = true;

let last_timestamp_millis = 0;
// main loop; game logic lives here
function every_frame(cur_timestamp_millis: number) {
    const delta_time = (cur_timestamp_millis - last_timestamp_millis) / 1000;
    last_timestamp_millis = cur_timestamp_millis;
    input.startFrame();
    twgl.resizeCanvasToDisplaySize(canvas);

    const global_t = cur_timestamp_millis / 1000;
    drawer.clear();

    // THE THING
    drawer.mainThing(cur_sexpr, cur_selected, normal_mode);

    if (normal_mode) {
        if (input.keyboard.wasPressed(KeyCode.ArrowLeft)) {
            cur_selected.push('l');
        }
        else if (input.keyboard.wasPressed(KeyCode.ArrowRight)) {
            cur_selected.push('r');
        }
        else if (input.keyboard.wasPressed(KeyCode.ArrowUp)) {
            cur_selected.pop();
        }
        // make selected thing into list
        else if (input.keyboard.wasPressed(KeyCode.KeyI)) {
            // [a] -> ([a])
            cur_sexpr = setAtLocalAddress(cur_sexpr, cur_selected,
                doPair(getAtLocalAddress(cur_sexpr, cur_selected), doNil()));
            cur_selected = concatAddresses(cur_selected, ['l']);
        }
        // append element
        else if (input.keyboard.wasPressed(KeyCode.KeyA)) {
            // ([a] . b) -> (a [N] . b)
            if (cur_selected.length > 0 && at(cur_selected, -1) == 'l') {
                const parent_address = parentAdress(cur_selected);
                cur_sexpr = setAtLocalAddress(cur_sexpr, parent_address,
                    doPair(getAtLocalAddress(cur_sexpr, cur_selected),
                        doPair(randomAtom(), getAtLocalAddress(cur_sexpr, concatAddresses(parent_address, ['r'])))));
                cur_selected = concatAddresses(parent_address, ['r', 'l']);
            }
        }
        // select next element of the list
        else if (input.keyboard.wasPressed(KeyCode.KeyJ)) {
            // ([a] b . c) => (a [b] . c)
            if (cur_selected.length > 0 && at(cur_selected, -1) == 'l') {
                const new_address = concatAddresses(parentAdress(cur_selected), ['r', 'l']);
                if (isValidAddress(cur_sexpr, new_address)) {
                    cur_selected = new_address;
                }
            }
        }
        // select prev element of the list
        else if (input.keyboard.wasPressed(KeyCode.KeyK)) {
            // (a [b] . c) => ([a] b . c)
            if (cur_selected.length > 1 && at(cur_selected, -1) == 'l') {
                const new_address = concatAddresses(parentAdress(parentAdress(cur_selected)), ['l']);
                if (isValidAddress(cur_sexpr, new_address)) {
                    cur_selected = new_address;
                }
            }
        }
        // enter pair
        else if (input.keyboard.wasPressed(KeyCode.KeyL)) {
            // [(a . b)] => ([a] . b)
            const new_address = concatAddresses(cur_selected, ['l']);
            if (isValidAddress(cur_sexpr, new_address)) {
                cur_selected = new_address;
            }
        }
        // exit list
        else if (input.keyboard.wasPressed(KeyCode.KeyH)) {
            // (... [a] ...) => [(... a ...)]
            if (cur_selected.length > 0) {
                let new_address = parentAdress(cur_selected);
                while (new_address.length > 0 && at(new_address, -1) === 'r') {
                    new_address = parentAdress(new_address);
                }
                if (isValidAddress(cur_sexpr, new_address)) {
                    cur_selected = new_address;
                }
            }
        }
        // delete thing
        else if (input.keyboard.wasPressed(KeyCode.KeyD)) {
            // (a . [b]) -> [a]
            // ([a] . b) -> [b]
            if (cur_selected.length > 0) {
                const last = at(cur_selected, -1);
                const other = last === 'l' ? 'r' : 'l';
                const parent_address = parentAdress(cur_selected);
                cur_sexpr = setAtLocalAddress(cur_sexpr, parent_address,
                    getAtLocalAddress(cur_sexpr, concatAddresses(parent_address, [other])));
                cur_selected = parent_address;
            }
        }
        // change atom name
        else if (input.keyboard.wasPressed(KeyCode.KeyC)) {
            const thing = getAtLocalAddress(cur_sexpr, cur_selected);
            if (thing.type === 'atom') {
                thing.value = '';
                normal_mode = false;
            }
        }
    }
    else {
        const thing = getAtLocalAddress(cur_sexpr, cur_selected);
        if (thing.type !== 'atom') throw new Error('unreachable');

        if (input.keyboard.wasPressed(KeyCode.Backspace)) {
            thing.value = thing.value.slice(0, -1);
        }
        else if (input.keyboard.wasPressed(KeyCode.Backslash)) {
            normal_mode = true;
        }
        else {
            thing.value += input.keyboard.text;
        }
    }
    // (doThing stuff) -> stuff
    // (doThing a b) -> (doThing b a)

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
