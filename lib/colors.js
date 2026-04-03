const isTTY = process.stdout.isTTY;

export const yellow = isTTY ? "\x1b[33m" : "";
export const green = isTTY ? "\x1b[32m" : "";
export const blue = isTTY ? "\x1b[34m" : "";
export const cyan = isTTY ? "\x1b[36m" : "";
export const dim = isTTY ? "\x1b[2m" : "";
export const bold = isTTY ? "\x1b[1m" : "";
export const reset = isTTY ? "\x1b[0m" : "";
