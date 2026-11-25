/**
 * ⚡ WebAssembly (WASM) Native Compiled Culling Engine (v31)
 * Runs compiled binary machine code directly inside a 64KB linear memory buffer
 * to cull 400+ @username signs & empty plots with ZERO JavaScript garbage-collection stutter
 * on 2GB-4GB RAM Android phones! Automatically falls back to pure JS if WASM is disabled.
 */

// 144-byte verified WebAssembly MVP binary exporting `memory` (1 page = 64KB) & `cullBatch(count, cx, cz, maxDistSq)`
const WASM_CULL_BINARY = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0,
  1, 9, 1, 96, 4, 127, 125, 125, 125, 1, 127,
  3, 2, 1, 0,
  5, 3, 1, 0, 1,
  7, 22, 2, 6, 109, 101, 109, 111, 114, 121, 2, 0, 9, 99, 117, 108, 108, 66, 97, 116, 99, 104, 0, 0,
  10, 90, 1, 88, 2, 3, 127, 2, 125, 2, 64, 3, 64,
  32, 4, 32, 0, 78, 13, 1,
  32, 4, 65, 3, 116, 42, 2, 0, 32, 1, 147, 33, 7,
  32, 4, 65, 3, 116, 42, 2, 4, 32, 2, 147, 33, 8,
  32, 7, 32, 7, 148, 32, 8, 32, 8, 148, 146, 32, 3, 93, 33, 6,
  32, 4, 32, 6, 58, 0, 128, 128, 1,
  32, 5, 32, 6, 106, 33, 5,
  32, 4, 65, 1, 106, 33, 4,
  12, 0, 11, 11, 32, 5, 11
]);

export class WasmPerfEngine {
  constructor() {
    this.ready = false;
    this.cullBatch = null;
    this.coordsF32 = null;
    this.flagsU8 = null;
    this._init();
  }

  async _init() {
    if (typeof WebAssembly === "undefined") return;
    try {
      const { instance } = await WebAssembly.instantiate(WASM_CULL_BINARY);
      const mem = instance.exports.memory;
      this.cullBatch = instance.exports.cullBatch;
      // Offset 0..16383: up to 2048 packed (x, z) Float32 pairs
      this.coordsF32 = new Float32Array(mem.buffer, 0, 4096);
      // Offset 16384..18431: 2048 Uint8 visibility flags (0 or 1)
      this.flagsU8 = new Uint8Array(mem.buffer, 16384, 2048);
      this.ready = true;
    } catch (err) {
      console.warn("WASM init skipped (JS fallback active):", err.message);
    }
  }

  /**
   * Batch-culls an array of objects containing `{ x, z }` & applies visibility to `item[targetProp]`.
   * Runs inside compiled WebAssembly machine code when ready!
   */
  cullList(items, targetProp, cx, cz, maxDistSq) {
    const n = items.length;
    if (n === 0) return 0;

    if (this.ready && n <= 2048) {
      const f32 = this.coordsF32;
      for (let i = 0; i < n; i++) {
        const it = items[i];
        f32[i * 2] = it.x;
        f32[i * 2 + 1] = it.z;
      }
      const visCount = this.cullBatch(n, cx, cz, maxDistSq);
      const u8 = this.flagsU8;
      for (let i = 0; i < n; i++) {
        items[i][targetProp].visible = u8[i] === 1;
      }
      return visCount;
    }

    // Transparent pure-JS fallback
    let visCount = 0;
    for (let i = 0; i < n; i++) {
      const it = items[i];
      const dx = it.x - cx;
      const dz = it.z - cz;
      const v = dx * dx + dz * dz < maxDistSq;
      it[targetProp].visible = v;
      if (v) visCount++;
    }
    return visCount;
  }
}
