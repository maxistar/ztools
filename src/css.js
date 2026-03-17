// src/css.js
export function css(strings, ...values) {
    let out = "";
    for (let i = 0; i < strings.length; i++) {
        out += strings[i];
        if (i < values.length) out += String(values[i]);
    }
    return out;
}
