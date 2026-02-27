export type Signal<T> = {
  (): T;
  set(next: T): void;
};

export declare function signal<T>(initial: T): Signal<T>;
export declare function computed<T>(fn: () => T): Signal<T>;
export declare function effect(fn: () => void): () => void;
export declare function batch<T>(fn: () => T): T;
export declare function onCleanup(fn: () => void): void;

export declare function h(tag: string, ...args: any[]): HTMLElement;
export declare function tag(name: string): (...args: any[]) => HTMLElement;
export declare function createTags(...tagNames: string[]): Array<(...args: any[]) => HTMLElement>;

export declare function Show<T>(
  when: (() => T) | T,
  render: (value: T) => Node,
  fallback?: () => Node
): Comment;

export declare function For<T>(
  listSignal: () => T[],
  renderItem: (item: T, index: Signal<number>) => Node,
  keyFn?: (item: T, idx: number) => string | number
): HTMLElement;

export declare function mount(Component: () => Node, container: Element): () => void;
