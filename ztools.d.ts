export type EffectRunner = (() => void) & {
  deps: Set<EffectRunner>[];
  cleanups: Array<() => void>;
  owner: Owner | null;
};

export interface Owner {
  parent: Owner | null;
  effects: EffectRunner[];
  cleanups: Array<() => void>;
}

export type Signal<T> = {
  (): T;
  set(next: T): void;
};

export type Reactive<T> = T | (() => T);

export type Child =
  | Node
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => Node | string | number | boolean | null | undefined)
  | Child[];

export type EventProps<E extends HTMLElement> = {
  [K in keyof GlobalEventHandlersEventMap as `on${Capitalize<K & string>}`]?: (
    this: E,
    ev: GlobalEventHandlersEventMap[K]
  ) => unknown;
};

export type ElementProps<E extends HTMLElement> = EventProps<E> & {
  ref?: (el: E) => void;
  className?: Reactive<string>;
  textContent?: Reactive<string | number | null | undefined>;
  style?:
    | Partial<CSSStyleDeclaration>
    | (() => Partial<CSSStyleDeclaration> | null | undefined)
    | null
    | undefined;
  [key: string]: unknown;
};

export type ElementArg<E extends HTMLElement> = ElementProps<E> | Child;

export type Component<P = Record<string, unknown>> = (
  props: P,
  ...children: Child[]
) => Node;

export declare function __getActiveOwner(): Owner | null;
export declare function __setActiveOwner(owner: Owner | null): void;
export declare function __createOwner(parent?: Owner | null): Owner;
export declare function __cleanupOwner(owner: Owner | null | undefined): void;

export declare function signal<T>(initial: T): Signal<T>;
export declare function computed<T>(fn: () => T): Signal<T>;
export declare function effect(fn: () => void): EffectRunner;
export declare function batch<T>(fn: () => T): T;
export declare function onCleanup(fn: () => void): void;

export declare function h<K extends keyof HTMLElementTagNameMap>(
  target: K,
  ...args: ElementArg<HTMLElementTagNameMap[K]>[]
): HTMLElementTagNameMap[K];
export declare function h(
  target: string,
  ...args: ElementArg<HTMLElement>[]
): HTMLElement;
export declare function h<T extends Node>(
  target: T,
  ...args: ElementArg<T extends HTMLElement ? T : HTMLElement>[]
): T;
export declare function h<P>(
  target: Component<P>,
  props?: P,
  ...children: Child[]
): Node;

export declare function tag<K extends keyof HTMLElementTagNameMap>(
  name: K
): (
  ...args: ElementArg<HTMLElementTagNameMap[K]>[]
) => HTMLElementTagNameMap[K];
export declare function tag(
  name: string
): (...args: ElementArg<HTMLElement>[]) => HTMLElement;

export declare function createTags<
  K extends readonly (keyof HTMLElementTagNameMap)[]
>(
  ...tagNames: K
): {
  [I in keyof K]: (
    ...args: ElementArg<HTMLElementTagNameMap[K[I]]>[]
  ) => HTMLElementTagNameMap[K[I]];
};
export declare function createTags(
  ...tagNames: string[]
): Array<(...args: ElementArg<HTMLElement>[]) => HTMLElement>;

export declare const tags: {
  [tagName: string]: (...args: ElementArg<HTMLElement>[]) => HTMLElement;
};

export interface AttrBag {
  __zAttrBag: true;
  value: Record<string, unknown>;
}

export interface PropBag {
  __zPropBag: true;
  value: Record<string, unknown>;
}

export interface ChainBuilder<E extends HTMLElement = HTMLElement> {
  (...args: ElementArg<E>[]): E;
  p(props?: ElementProps<E>): ChainBuilder<E>;
  smart(props?: ElementProps<E>): ChainBuilder<E>;
  attrs(attrs?: Record<string, unknown>): ChainBuilder<E>;
  a(attrs?: Record<string, unknown>): ChainBuilder<E>;
  attr(name: string, value: unknown): ChainBuilder<E>;
  propsOnly(props?: Record<string, unknown>): ChainBuilder<E>;
  po(props?: Record<string, unknown>): ChainBuilder<E>;
  prop(name: string, value: unknown): ChainBuilder<E>;
  className(...names: Array<string | false | null | undefined>): ChainBuilder<E>;
  c(...names: Array<string | false | null | undefined>): ChainBuilder<E>;
  id(id: string): ChainBuilder<E>;
  style(styleObj?: Partial<CSSStyleDeclaration> | null): ChainBuilder<E>;
  on(eventName: string, fn: EventListener): ChainBuilder<E>;
  onClick(fn: EventListener): ChainBuilder<E>;
  onInput(fn: EventListener): ChainBuilder<E>;
  onChange(fn: EventListener): ChainBuilder<E>;
  onKeydown(fn: EventListener): ChainBuilder<E>;
  onSubmit(fn: EventListener): ChainBuilder<E>;
  data(name: string, value: unknown): ChainBuilder<E>;
  aria(name: string, value: unknown): ChainBuilder<E>;
  tagName: string;
  _smartProps: Record<string, unknown>;
  _attrs: Record<string, unknown>;
  _props: Record<string, unknown>;
}

export declare function createChainTags<K extends keyof HTMLElementTagNameMap>(
  ...tagNames: K[]
): { [P in K]: ChainBuilder<HTMLElementTagNameMap[P]> };
export declare function createChainTags(
  ...tagNames: string[]
): Record<string, ChainBuilder<HTMLElement>>;

export declare const chainTags: {
  [tagName: string]: ChainBuilder<HTMLElement>;
};

export declare function Show<T>(
  when: (() => T) | T,
  render: (value: T) => Node,
  fallback?: () => Node
): Comment;

export declare function For<T>(
  listSignal: () => T[],
  renderItem: (item: T, index: Signal<number>) => Node,
  keyFn?: (item: T, idx: number) => string | number
): HTMLSpanElement;

export declare function enhance(
  root: Element,
  setup: (root: Element) => void
): () => void;

export declare function mount(
  Component: () => Node,
  container: Element & { __ztoolsDispose?: (() => void) | null }
): () => void;
