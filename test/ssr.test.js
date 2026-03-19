import { describe, it, expect } from 'vitest';
import { h, tags, renderToString } from '../ztools.ssr.js';

describe('ssr props compatibility', () => {
  it('supports explicit attrs/props/on bags', () => {
    const html = renderToString(
      h('button', {
        attrs: { 'data-role': 'cta', hidden: false },
        props: { className: 'btn', type: 'button' },
        on: { click: () => {} },
      }, 'Save')
    );

    expect(html).toBe('<button data-role="cta" class="btn" type="button">Save</button>');
  });

  it('supports reactive-like getter values in attrs/props bags', () => {
    const html = renderToString(
      h('div', {
        attrs: { 'data-state': () => 'on' },
        props: { title: () => 'hello' },
      })
    );

    expect(html).toBe('<div data-state="on" title="hello"></div>');
  });

  it('keeps legacy syntax together with bags', () => {
    const html = renderToString(
      h('input', {
        attrs: { 'data-kind': 'field' },
        props: { type: 'text' },
        className: 'legacy-ok',
        value: 'A',
        onInput: () => {},
      })
    );

    expect(html).toBe('<input data-kind="field" type="text" class="legacy-ok" value="A">');
  });

  it('supports callable tags(...) factory in SSR', () => {
    const t = tags('div', 'a');

    const html = renderToString(
      t.div(
        { className: 'box' },
        t.a({ href: '#ok' }, 'Open')
      )
    );

    expect(html).toBe('<div class="box"><a href="#ok">Open</a></div>');
  });
});
