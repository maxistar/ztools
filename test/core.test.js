import { describe, it, expect } from 'vitest';
import { signal, computed, effect, batch, createTags, For, mount } from '../ztools.js';

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
});
