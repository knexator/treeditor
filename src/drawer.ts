import { Color, Transform, Vec2 } from 'kanvas2d';
import { DefaultMap, DefaultMapExtra, assertEmpty, assertNotNull, at, commonPrefixLen, enumerate, eqArrays, fromCount, or, replace, reversedForEach, single, zip2 } from './kommon/kommon';
import { in01, inRange, isPointInPolygon, lerp, mod, randomFloat, randomInt, remap } from './kommon/math';
import Rand from 'rand-seed';
import { Random } from './kommon/random';
import { asListPlusSentinel, isNil, Sexpr, SexprAddress } from './model';
import { Address, Asdf } from './wobbly_model';

// TODO: pretty printing https://dspace.mit.edu/bitstream/handle/1721.1/6503/AIM-1102.pdf
export class Drawer {
    constructor(
        public ctx: CanvasRenderingContext2D,
    ) { }

    get lineHeight(): number {
        return this.screenSize.y / 20;
    }

    get screenSize(): Vec2 {
        return new Vec2(this.ctx.canvas.width, this.ctx.canvas.height);
    }

    clear() {
        this.ctx.globalAlpha = 1;
        this.ctx.resetTransform();
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    mainProgram(text: string): void {
        this.ctx.textBaseline = 'top';
        this.ctx.font = `${this.lineHeight}px monospace`;
        this.ctx.fillStyle = 'white';

        const lineSize = this.lineHeight * 1.2;
        text.split('\n').forEach((l, k) => {
            this.fillText(l, new Vec2(10, 10 + k * lineSize));
        });
    }

    drawBasic(main: Asdf, highlighted: Address, mode: 'normal' | 'writing'): void {
        this.ctx.textBaseline = 'top';
        this.ctx.font = `${this.lineHeight}px monospace`;
        this.ctx.fillStyle = 'white';

        const lineSize = this.lineHeight * 1.2;

        // let highlighted_data: {} | null = null;
        function asdfToText(x: Asdf, address: Address, max_columns: number, indent: number): string {
            if (x.isLeaf()) {
                const str = x.data;
                if (typeof str !== 'string') throw new Error('unreachable');
                if (highlighted.equals(address)) {
                    return ';' + str + ';';
                }
                else {
                    return str;
                }
            }
            let result = '(';
            let remaining_columns = max_columns - 1;
            x.forEachChild((child, k) => {
                let stuff = asdfToText(child, address.plus(k), remaining_columns, indent);
                let cols = usedColumns(stuff) + 1;
                // if ((cols > remaining_columns || stuff.includes('\n')) && !(k == 1 && (x.childAt(0)?.isLeaf() ?? false) && x.childAt(0)!.data === 'let')) {
                if (cols > remaining_columns || stuff.includes('\n')) {
                    result += '\n' + '\t'.repeat(indent + 1);
                    remaining_columns = max_columns - 1;
                    stuff = asdfToText(child, address.plus(k), remaining_columns, indent + 1);
                    cols = usedColumns(stuff) + 1;
                }
                result += stuff;
                result += (k + 1 === x.childCount()) ? '' : ' ';
                remaining_columns -= cols;
            });
            result += ')';
            if (highlighted.equals(address)) {
                result = ';' + result + ';';
            }
            return result;
        }

        function usedColumns(x: string): number {
            return Math.max(...x.replace(/;/g, '').split('\n').map(l => l.length));
        }

        const text = asdfToText(main, new Address([]), Math.floor(1.6 * this.ctx.canvas.width / this.lineHeight), 0);

        const [before, high, after, ...extra] = text.split(';');
        assertEmpty(extra);

        const plain_text = before + asSpaces(high) + after;
        plain_text.split('\n').forEach((l, k) => {
            this.fillText(l, new Vec2(10, 10 + k * lineSize));
        });

        this.ctx.fillStyle = mode === 'normal'
            ? 'cyan'
            : 'yellow';
        const high_text = asSpaces(before) + high + asSpaces(after);
        high_text.split('\n').forEach((l, k) => {
            this.fillText(l, new Vec2(10, 10 + k * lineSize));
        });

        function asSpaces(x: string): string {
            return x.replace(/[^\s]/g, ' ');
        }
    }

    mainThing(expr: Sexpr, highlighted: SexprAddress, normal_mode: boolean) {
        this.ctx.textBaseline = 'top';
        this.ctx.font = `${this.lineHeight}px monospace`;
        this.asdf(expr, [], highlighted, normal_mode, new Vec2(10, 10));
    }

    private setHighlighted(highlighted: boolean, normal_mode: boolean): void {
        this.ctx.fillStyle = highlighted
            ? normal_mode
                ? 'cyan'
                : 'yellow'
            : 'white';
    }

    private asdf(expr: Sexpr, cur_address: SexprAddress, highlighted_address: SexprAddress, normal_mode: boolean, top_left: Vec2): number {
        const indentSize = 40;
        const lineSize = this.lineHeight * 1.2;

        // this.setHighlighted(false);
        const highlighted = commonPrefixLen(cur_address, highlighted_address) >= highlighted_address.length;
        const { list, sentinel } = asListPlusSentinel(expr);
        if (list.length === 0) {
            this.setHighlighted(highlighted, normal_mode);
            this.fillText(sentinel.value, top_left);
            return 1;
        }
        else {
            this.setHighlighted(highlighted, normal_mode);
            this.fillText('(', top_left);
            let offset = 1;
            let address_helper = [...cur_address];
            for (const [k, cosa] of enumerate(list)) {
                offset += this.asdf(cosa, [...address_helper, 'l'], highlighted_address, normal_mode, top_left.addXY(indentSize, offset * lineSize));
                address_helper = [...address_helper, 'r'];
            }
            // if (!isNil(sentinel)) {
            {
                this.setHighlighted(highlighted, normal_mode);
                this.fillText('.', top_left.addXY(indentSize, offset * lineSize));
                offset += 1;
                offset += this.asdf(sentinel, [...address_helper, 'r'], highlighted_address, normal_mode, top_left.addXY(indentSize, offset * lineSize));
            }
            this.setHighlighted(highlighted, normal_mode);
            this.fillText(')', top_left.addY(offset * lineSize));
            offset += 1;
            return offset;
        }
    }

    drawCircle(center: Vec2, radius: number) {
        this.ctx.moveTo(center.x + radius, center.y);
        this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    }

    moveTo(pos: Vec2) {
        this.ctx.moveTo(pos.x, pos.y);
    }

    lineTo(pos: Vec2) {
        this.ctx.lineTo(pos.x, pos.y);
    }

    fillText(text: string, pos: Vec2) {
        this.ctx.fillText(text, pos.x, pos.y);
    }
}
