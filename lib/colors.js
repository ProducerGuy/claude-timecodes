const isTTY = process.stdout.isTTY;

export const Y = isTTY ? "\x1b[33m" : "";
export const G = isTTY ? "\x1b[32m" : "";
export const B = isTTY ? "\x1b[34m" : "";
export const C = isTTY ? "\x1b[36m" : "";
export const DIM = isTTY ? "\x1b[2m" : "";
export const BOLD = isTTY ? "\x1b[1m" : "";
export const R = isTTY ? "\x1b[0m" : "";
