﻿export function rgbToHex(r: number, g: number, b: number) {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}
