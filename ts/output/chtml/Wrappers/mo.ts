/*************************************************************
 *
 *  Copyright (c) 2017-2021 The MathJax Consortium
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
 * @fileoverview  Implements the CHTMLmo wrapper for the MmlMo object
 *
 * @author dpvc@mathjax.org (Davide Cervone)
 */

import {CHTMLWrapper, CHTMLConstructor, StringMap} from '../Wrapper.js';
import {CommonMoMixin, DirectionVH} from '../../common/Wrappers/mo.js';
import {MmlMo} from '../../../core/MmlTree/MmlNodes/mo.js';
import {StyleList} from '../../../util/StyleList.js';
import {DIRECTION} from '../FontData.js';

/*****************************************************************/
/**
 * The CHTMLmo wrapper for the MmlMo object
 *
 * @template N  The HTMLElement node class
 * @template T  The Text node class
 * @template D  The Document class
 */
// @ts-ignore
export class CHTMLmo<N, T, D> extends
CommonMoMixin<CHTMLConstructor<any, any, any>>(CHTMLWrapper) {

  /**
   * The mo wrapper
   */
  public static kind = MmlMo.prototype.kind;

  /**
   * @override
   */
  public static styles: StyleList = {
    'mjx-stretchy-h': {
      display: 'inline-table',
      width: '100%'
    },
    'mjx-stretchy-h > *': {
      display: 'table-cell',
      width: 0
    },
    'mjx-stretchy-h > * > mjx-c': {
      display: 'inline-block',
      transform: 'scalex(1.0000001)'      // improves blink positioning
    },
    'mjx-stretchy-h > mjx-ext': {
      '/* IE */ overflow': 'hidden',
      '/* others */ overflow': 'clip visible',
      width: '100%',
      'text-align': 'center'
    },
    'mjx-stretchy-h > mjx-ext > mjx-c': {
      transform: 'scalex(500)',
      width: 0
    },
    'mjx-stretchy-h > mjx-beg > mjx-c': {
      'margin-right': '-.1em'
    },
    'mjx-stretchy-h > mjx-end > mjx-c': {
      'margin-left': '-.1em'
    },

    'mjx-stretchy-v': {
      display: 'inline-block'
    },
    'mjx-stretchy-v > *': {
      display: 'block'
    },
    'mjx-stretchy-v > mjx-beg': {
      height: 0
    },
    'mjx-stretchy-v > mjx-end > mjx-c': {
      display: 'block'
    },
    'mjx-stretchy-v > * > mjx-c': {
      transform: 'scaley(1.0000001)',       // improves Firefox and blink positioning
      'transform-origin': 'left center',
    },
    'mjx-stretchy-v > mjx-ext': {
      display: 'block',
      height: '100%',
      'box-sizing': 'border-box',
      border: '0px solid transparent',
      '/* IE */ overflow': 'hidden',
      '/* others */ overflow': 'visible clip',
    },
    'mjx-stretchy-v > mjx-ext > mjx-c': {
      width: 'auto',
      'box-sizing': 'border-box',
      transform: 'scaleY(500) translateY(.075em)',
      overflow: 'visible'
    },
    'mjx-mark': {
      display: 'inline-block',
      height: 0
    }

  };

  /**
   * @override
   */
  public toCHTML(parent: N) {
    const attributes = this.node.attributes;
    const symmetric = (attributes.get('symmetric') as boolean) && this.stretch.dir !== DIRECTION.Horizontal;
    const stretchy = this.stretch.dir !== DIRECTION.None;
    if (stretchy && this.size === null) {
      this.getStretchedVariant([]);
    }
    let chtml = this.standardCHTMLnode(parent);
    if (stretchy && this.size < 0) {
      this.stretchHTML(chtml);
    } else {
      if (symmetric || attributes.get('largeop')) {
        const u = this.em(this.getCenterOffset());
        if (u !== '0') {
          this.adaptor.setStyle(chtml, 'verticalAlign', u);
        }
      }
      if (this.node.getProperty('mathaccent')) {
        this.adaptor.setStyle(chtml, 'width', '0');
        this.adaptor.setStyle(chtml, 'margin-left', this.em(this.getAccentOffset()));
      }
      for (const child of this.childNodes) {
        child.toCHTML(chtml);
      }
    }
  }

  /**
   * Create the HTML for a multi-character stretchy delimiter
   *
   * @param {N} chtml  The parent element in which to put the delimiter
   */
  protected stretchHTML(chtml: N) {
    const c = this.getText().codePointAt(0);
    this.font.delimUsage.add(c);
    this.childNodes[0].markUsed();
    const delim = this.stretch;
    const stretch = delim.stretch;
    const stretchv = this.font.getStretchVariants(c);
    const content: N[] = [];
    //
    //  Set up the beginning, extension, and end pieces
    //
    this.createPart('mjx-beg', stretch[0], stretchv[0], content);
    this.createPart('mjx-ext', stretch[1], stretchv[1], content);
    if (stretch.length === 4) {
      //
      //  Braces have a middle and second extensible piece
      //
      this.createPart('mjx-mid', stretch[3], stretchv[3], content);
      this.createPart('mjx-ext', stretch[1], stretchv[1], content);
    }
    this.createPart('mjx-end', stretch[2], stretchv[2], content);
    //
    //  Set the styles needed
    //
    const styles: StringMap = {};
    const {h, d, w} = this.bbox;
    if (delim.dir === DIRECTION.Vertical) {
      //
      //  Vertical needs an extra (empty) element to get vertical position right
      //  in some browsers (e.g., Safari)
      //
      content.push(this.html('mjx-mark'));
      styles.height = this.em(h + d);
      styles.verticalAlign = this.em(-d);
    } else {
      styles.width = this.em(w);
    }
    //
    //  Make the main element and add it to the parent
    //
    const dir = DirectionVH[delim.dir];
    const properties = {class: this.char(delim.c || c), style: styles};
    const html = this.html('mjx-stretchy-' + dir, properties, content);
    this.adaptor.append(chtml, html);
  }

  /**
   * Create an element of a multi-character assembly
   *
   * @param {string} part    The part to create
   * @param {number} n       The unicode character to use
   * @param {string} v       The variant for the character
   * @param {N[]} content    The DOM assembly
   */
  protected createPart(part: string, n: number, v: string, content: N[]) {
    if (n) {
      let c = (this.font.getChar(v, n)[3].c as string || String.fromCodePoint(n))
        .replace(/\\[0-9A-F]+/ig, (x) => String.fromCodePoint(parseInt(x.substr(1), 16)));
      content.push(this.html(part, {}, [this.html('mjx-c', {}, [this.text(c)])]));
    }
  }

}
