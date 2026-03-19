import { describe, it, expect } from 'vitest';
import { signal, computed, effect, batch, createTags, tags, For, Show, mount } from '../ztools.js';

describe('reactive core', () => {
  it('signal/effect reacts to set', () => {
    const s = signal(1);
    let value = 0;
    effect(() => {
      value = s();
    });
    expect(value).toBe(1);
    s.set(5);
    expect(value).toBe(5);
  });

  it('computed derives values', () => {
    const a = signal(2);
    const b = computed(() => a() * 3);
    expect(b()).toBe(6);
    a.set(4);
    expect(b()).toBe(12);
  });

  it('batch coalesces updates', () => {
    const a = signal(0);
    let runs = 0;
    effect(() => {
      a();
      runs += 1;
    });

    batch(() => {
      a.set(1);
      a.set(2);
      a.set(3);
    });

    expect(a()).toBe(3);
    expect(runs).toBe(2); // initial + one batched rerun
  });
});

describe('dom helpers', () => {
  it('mount renders component', () => {
    const [div] = createTags('div');
    const root = document.createElement('div');
    document.body.appendChild(root);

    const dispose = mount(() => div('hello'), root);
    expect(root.textContent).toBe('hello');

    dispose();
    expect(root.textContent).toBe('');
  });

  it('For renders keyed list', () => {
    const [div] = createTags('div');
    const list = signal([{ id: 1, t: 'A' }, { id: 2, t: 'B' }]);

    const node = For(list, (item) => div(item.t), (item) => item.id);
    document.body.appendChild(node);

    expect(node.textContent).toContain('A');
    expect(node.textContent).toContain('B');

    list.set([{ id: 2, t: 'B' }, { id: 3, t: 'C' }]);
    expect(node.textContent).toContain('B');
    expect(node.textContent).toContain('C');
  });

  it('For keeps DOM order in sync when items are reordered', () => {
    const [div] = createTags('div');
    const list = signal([
      { id: '1', t: 'A' },
      { id: '2', t: 'B' },
      { id: '3', t: 'C' },
    ]);

    const node = For(list, (item) => div({ 'data-id': item.id }, item.t), (item) => item.id);
    document.body.appendChild(node);

    const order1 = Array.from(node.children).map((el) => el.getAttribute('data-id'));
    expect(order1).toEqual(['1', '2', '3']);

    list.set([
      { id: '3', t: 'C' },
      { id: '1', t: 'A' },
      { id: '2', t: 'B' },
    ]);

    const order2 = Array.from(node.children).map((el) => el.getAttribute('data-id'));
    expect(order2).toEqual(['3', '1', '2']);
  });

  it('Show toggles rendered branch', async () => {
    const [div] = createTags('div');
    const visible = signal(true);

    const host = div(
      Show(
        () => visible(),
        () => div({ id: 'on' }, 'ON'),
        () => div({ id: 'off' }, 'OFF')
      )
    );

    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 0));
    expect(host.textContent).toBe('ON');

    visible.set(false);
    expect(host.textContent).toBe('OFF');

    visible.set(true);
    expect(host.textContent).toBe('ON');
  });

  it('supports explicit attrs/props/on bags', () => {
    const [button] = createTags('button');
    let clicks = 0;

    const node = button({
      attrs: { 'data-role': 'cta' },
      props: { type: 'button', textContent: 'Save' },
      on: { click: () => clicks++ },
    });

    document.body.appendChild(node);

    expect(node.getAttribute('data-role')).toBe('cta');
    expect(node.type).toBe('button');
    expect(node.textContent).toBe('Save');

    node.click();
    expect(clicks).toBe(1);
  });

  it('keeps legacy prop syntax working together with bags', () => {
    const [input] = createTags('input');
    const value = signal('A');
    let inputEvents = 0;

    const node = input({
      attrs: { 'data-kind': 'field' },
      props: { value },
      on: { input: () => inputEvents++ },
      className: 'legacy-ok',
      onChange: () => inputEvents++,
    });

    document.body.appendChild(node);

    expect(node.getAttribute('data-kind')).toBe('field');
    expect(node.className).toBe('legacy-ok');
    expect(node.value).toBe('A');

    value.set('B');
    expect(node.value).toBe('B');

    node.dispatchEvent(new Event('input'));
    node.dispatchEvent(new Event('change'));
    expect(inputEvents).toBe(2);
  });

  it('supports reactive attrs and boolean attr removal in attrs bag', () => {
    const [div] = createTags('div');
    const state = signal(true);

    const node = div({
      attrs: {
        'data-state': () => (state() ? 'on' : 'off'),
        hidden: () => !state(),
      },
    });

    document.body.appendChild(node);

    expect(node.getAttribute('data-state')).toBe('on');
    expect(node.hasAttribute('hidden')).toBe(false);

    state.set(false);
    expect(node.getAttribute('data-state')).toBe('off');
    expect(node.hasAttribute('hidden')).toBe(true);
  });

  it('supports on bag with both click and onClick keys', () => {
    const [button] = createTags('button');
    let count = 0;

    const node = button({
      on: {
        click: () => count++,
        onClick: () => count++,
      },
    }, 'Go');

    document.body.appendChild(node);
    node.click();

    expect(count).toBe(2);
  });

  it('supports ref callback for imperative element access', () => {
    const [div, input, button] = createTags('div', 'input', 'button');
    let inputEl;

    const node = div(
      input({ ref: (el) => { inputEl = el; } }),
      button({ onClick: () => inputEl.focus() }, 'Focus')
    );

    document.body.appendChild(node);

    const btn = node.querySelector('button');
    btn.click();

    expect(inputEl).toBeInstanceOf(HTMLInputElement);
    expect(document.activeElement).toBe(inputEl);
  });

  it('supports tags(...) callable factory in addition to tags.div getter style', () => {
    const t = tags('div', 'a');

    const node = t.div(
      { className: 'box' },
      t.a({ href: '#ok' }, 'Open')
    );

    document.body.appendChild(node);

    expect(node.tagName).toBe('DIV');
    expect(node.className).toBe('box');
    expect(node.querySelector('a')?.getAttribute('href')).toBe('#ok');
    expect(node.textContent).toBe('Open');
  });
});
