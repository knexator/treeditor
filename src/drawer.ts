import { Color, Transform, Vec2 } from 'kanvas2d';
import { DefaultMap, DefaultMapExtra, assertNotNull, at, commonPrefixLen, enumerate, eqArrays, fromCount, or, replace, reversedForEach, single, zip2 } from './kommon/kommon';
import { in01, inRange, isPointInPolygon, lerp, mod, randomFloat, randomInt, remap } from './kommon/math';
import Rand from 'rand-seed';
import { Random } from './kommon/random';
import { asListPlusSentinel, isNil, Sexpr, SexprAddress } from './model';

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
