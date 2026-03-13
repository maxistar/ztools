import { h } from "./dom.js";

function isPlainObject(x) {
  return !!x &&
    typeof x === "object" &&
    !Array.isArray(x) &&
    !(x instanceof Node) &&
    x.__zAttrBag !== true &&
    x.__zPropBag !== true;
}

function mergeClassName(a, b) {
  return [a, b].filter(Boolean).join(" ");
}

function mergeStyle(a, b) {
  if (a && b && isPlainObject(a) && isPlainObject(b)) {
    return { ...a, ...b };
  }
  return b ?? a;
}

function mergeProps(base, extra) {
  const out = { ...base, ...extra };

  if (base.className || extra.className) {
    out.className = mergeClassName(base.className, extra.className);
  }

  if (base.style || extra.style) {
    out.style = mergeStyle(base.style, extra.style);
  }

  return out;
}

function eventPropName(name) {
  if (!name) return "on";
  return "on" + name[0].toUpperCase() + name.slice(1);
}

function attrBag(obj) {
  return { __zAttrBag: true, value: obj || {} };
}

function propBag(obj) {
  return { __zPropBag: true, value: obj || {} };
}

function makeBuilder(tagName, storedProps = {}, forcedAttrs = {}, forcedProps = {}) {
  function builder(...args) {
    let inlineProps = null;
    let children = args;

    if (args.length > 0 && isPlainObject(args[0])) {
      inlineProps = args[0];
      children = args.slice(1);
    }

    const smartProps = inlineProps
      ? mergeProps(storedProps, inlineProps)
      : storedProps;

    const parts = [];

    if (Object.keys(smartProps).length > 0) parts.push(smartProps);
    if (Object.keys(forcedAttrs).length > 0) parts.push(attrBag(forcedAttrs));
    if (Object.keys(forcedProps).length > 0) parts.push(propBag(forcedProps));

    return h(tagName, ...parts, ...children);
  }

  builder.p = function (props) {
    return makeBuilder(
      tagName,
      mergeProps(storedProps, props || {}),
      forcedAttrs,
      forcedProps,
    );
  };

  builder.smart = builder.p;

  builder.attrs = function (attrs) {
    return makeBuilder(
      tagName,
      storedProps,
      { ...forcedAttrs, ...(attrs || {}) },
      forcedProps,
    );
  };

  builder.a = builder.attrs;

  builder.attr = function (name, value) {
    return makeBuilder(
      tagName,
      storedProps,
      { ...forcedAttrs, [name]: value },
      forcedProps,
    );
  };

  builder.propsOnly = function (props) {
    return makeBuilder(
      tagName,
      storedProps,
      forcedAttrs,
      { ...forcedProps, ...(props || {}) },
    );
  };

  builder.po = builder.propsOnly;

  builder.prop = function (name, value) {
    return makeBuilder(
      tagName,
      storedProps,
      forcedAttrs,
      { ...forcedProps, [name]: value },
    );
  };

  builder.className = function (...names) {
    const className = names.filter(Boolean).join(" ");
    return makeBuilder(
      tagName,
      mergeProps(storedProps, { className }),
      forcedAttrs,
      forcedProps,
    );
  };

  builder.c = builder.className;

  builder.id = function (id) {
    return makeBuilder(
      tagName,
      mergeProps(storedProps, { id }),
      forcedAttrs,
      forcedProps,
    );
  };

  builder.style = function (styleObj) {
    return makeBuilder(
      tagName,
      mergeProps(storedProps, { style: styleObj || {} }),
      forcedAttrs,
      forcedProps,
    );
  };

  builder.on = function (eventName, fn) {
    return makeBuilder(
      tagName,
      mergeProps(storedProps, {
        [eventPropName(eventName)]: fn,
      }),
      forcedAttrs,
      forcedProps,
    );
  };

  builder.onClick = function (fn) {
    return builder.on("click", fn);
  };

  builder.onInput = function (fn) {
    return builder.on("input", fn);
  };

  builder.onChange = function (fn) {
    return builder.on("change", fn);
  };

  builder.onKeydown = function (fn) {
    return builder.on("keydown", fn);
  };

  builder.onSubmit = function (fn) {
    return builder.on("submit", fn);
  };

  builder.data = function (name, value) {
    return builder.attr("data-" + name, value);
  };

  builder.aria = function (name, value) {
    return builder.attr("aria-" + name, value);
  };

  builder.tagName = tagName;
  builder._smartProps = storedProps;
  builder._attrs = forcedAttrs;
  builder._props = forcedProps;

  return builder;
}

export function createChainTags(...tagNames) {
  const out = {};
  for (let i = 0; i < tagNames.length; i++) {
    out[tagNames[i]] = makeBuilder(tagNames[i]);
  }
  return out;
}

export const chainTags = new Proxy(Object.create(null), {
  get(target, prop) {
    if (prop === Symbol.toStringTag) return "ztools.chainTags";
    if (typeof prop !== "string") return undefined;

    if (!target[prop]) {
      target[prop] = makeBuilder(prop);
    }
    return target[prop];
  },
});
