/*************************************************************
 *
 *  Copyright (c) 2018 The MathJax Consortium
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/**
 * @fileoverview  Implements the SVGmfrac wrapper for the MmlMfrac object
 *
 * @author dpvc@mathjax.org (Davide Cervone)
 */

import {SVGWrapper, SVGConstructor} from '../Wrapper.js';
import {CommonMfrac, CommonMfracMixin} from '../../common/Wrappers/mfrac.js';
import {MmlMfrac} from '../../../core/MmlTree/MmlNodes/mfrac.js';
import {SVGmo} from './mo.js';

/*****************************************************************/
/**
 * The SVGmfrac wrapper for the MmlMfrac object
 *
 * @template N  The HTMLElement node class
 * @template T  The Text node class
 * @template D  The Document class
 */
export class SVGmfrac<N, T, D> extends CommonMfracMixin<SVGConstructor<N, T, D>>(SVGWrapper) {

    public static kind = MmlMfrac.prototype.kind;

    public bevel: SVGmo<N, T, D>;

    /************************************************/

    /**
     * @override
     */
    public toSVG(parent: N) {
        this.standardSVGnode(parent);
        const {linethickness, bevelled} = this.node.attributes.getList('linethickness', 'bevelled');
        const display = this.isDisplay();
        if (bevelled) {
            this.makeBevelled(display);
        } else {
            const thickness = this.length2em(String(linethickness));
            if (thickness === 0) {
                this.makeAtop(display);
            } else {
                this.makeFraction(display, thickness);
            }
        }
    }

    /************************************************/

    /**
     * @param {boolean} display  True when fraction is in display mode
     * @param {number} t         The rule line thickness
     */
    protected makeFraction(display: boolean, t: number) {
        const svg = this.element;
        const {numalign, denomalign} = this.node.attributes.getList('numalign', 'denomalign');
        const [num, den] = this.childNodes;
        const nbox = num.getBBox();
        const dbox = den.getBBox();

        const tex = this.font.params;
        const a = tex.axis_height;
        const d = .1; // line's extra left- and right-padding
        const pad = (this.node.getProperty('withDelims') ? 0 : tex.nulldelimiterspace);
        const W = Math.max(nbox.w * nbox.rscale, dbox.w * dbox.rscale);
        const nx = this.getAlignX(W, nbox.w * nbox.rscale, numalign as string) + d + pad;
        const dx = this.getAlignX(W, dbox.w * dbox.rscale, denomalign as string) + d + pad;
        const {T, u, v} = this.getTUV(display, t);

        num.toSVG(svg);
        num.place(nx, a + u  + T);
        den.toSVG(svg);
        den.place(dx, a - v  - T);

        this.adaptor.append(svg, this.svg('rect', {
            width: this.fixed(W + 2 * d), height: this.fixed(t),
            x: this.fixed(pad), y: this.fixed(a - t / 2)
        }));
    }

    /************************************************/

    /**
     * @param {boolean} display  True when fraction is in display mode
     */
    protected makeAtop(display: boolean) {
        const svg = this.element;
        const {numalign, denomalign} = this.node.attributes.getList('numalign', 'denomalign');
        const [num, den] = this.childNodes;
        const nbox = num.getBBox();
        const dbox = den.getBBox();

        const tex = this.font.params;
        const pad = (this.node.getProperty('withDelims') ? 0 : tex.nulldelimiterspace);
        const W = Math.max(nbox.w * nbox.rscale, dbox.w * dbox.rscale);
        const nx = this.getAlignX(W, nbox.w * nbox.rscale, numalign as string) + pad;
        const dx = this.getAlignX(W, dbox.w * dbox.rscale, denomalign as string) + pad;
        const {u, v} = this.getUVQ(display);

        num.toSVG(svg);
        num.place(nx, u);
        den.toSVG(svg);
        den.place(dx, -v);
    }

    /************************************************/

    /**
     * @param {boolean} display  True when fraction is in display mode
     */
    protected makeBevelled(display: boolean) {
        const svg = this.element;
        const [num, den] = this.childNodes;
        const {u, v, delta, nbox} = this.getBevelData(display);
        const w = nbox.w * nbox.rscale;

        num.toSVG(svg);
        this.bevel.toSVG(svg);
        den.toSVG(svg);

        num.place(0, u);
        this.bevel.place(w - delta / 2, 0);
        den.place(w + this.bevel.getBBox().w - delta, v);
    }

}
