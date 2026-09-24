import assert from "node:assert/strict";

/** Independent minimal rasterizer for the renderer's closed SVG path grammar. */
export function svgMatrix(svg) {
  const viewBox = /viewBox="0 0 (\d+) (\d+)"/u.exec(svg);
  const blackPath = /<path fill="#000" d="([^"]+)"\/>/u.exec(svg);
  assert.notEqual(viewBox, null);
  assert.notEqual(blackPath, null);
  assert.equal(viewBox[1], viewBox[2]);
  const edge = Number(viewBox[1]);
  const matrix = Array.from({ length: edge }, () => Array(edge).fill(false));
  const command = /M(\d+),(\d+)h1v1h-1z/gu;
  let count = 0;
  for (const match of blackPath[1].matchAll(command)) {
    const x = Number(match[1]);
    const y = Number(match[2]);
    assert.ok(x > 0 && x < edge - 1 && y > 0 && y < edge - 1);
    matrix[y][x] = true;
    count += 1;
  }
  assert.ok(count > 0);
  return matrix;
}
