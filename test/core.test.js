import { describe, it, expect } from 'vitest';
import { signal, computed, effect, batch, createTags, createChainTags, chainTags, For, Show, mount } from '../ztools.js';

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

  it('createChainTags merges smart props across chained calls', () => {
    const { button } = createChainTags('button');
    const node = button
      .className('primary')
      .style({ color: 'red' })
      .p({ className: 'wide', style: { backgroundColor: 'black' }, type: 'button' })('Click');

    expect(node.className).toBe('primary wide');
    expect(node.style.color).toBe('red');
    expect(node.style.backgroundColor).toBe('black');
    expect(node.getAttribute('type')).toBe('button');
    expect(node.textContent).toBe('Click');
  });

  it('chainTags can force attrs and props independently', () => {
    const value = signal('hello');
    const input = chainTags.input
      .attr('value', 'attr-value')
      .prop('value', () => value())
      .attr('data-mode', 'forced')();

    expect(input.getAttribute('value')).toBe('attr-value');
    expect(input.value).toBe('hello');
    expect(input.getAttribute('data-mode')).toBe('forced');

    value.set('updated');
    expect(input.value).toBe('updated');
    expect(input.getAttribute('value')).toBe('attr-value');
  });

  it('chain builders keep events and inline props working', () => {
    let clicks = 0;
    const node = chainTags.button
      .className('base')
      .onClick(() => {
        clicks += 1;
      })
      ({ className: 'inline', type: 'button' }, 'Run');

    node.click();

    expect(clicks).toBe(1);
    expect(node.className).toBe('base inline');
    expect(node.getAttribute('type')).toBe('button');
    expect(node.textContent).toBe('Run');
  });
});
