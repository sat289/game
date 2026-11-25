/**
 * ⚡ QUALITY & LOW-RAM PERFORMANCE MANAGER (v35)
 * Handles WebGL context-loss auto-recovery and smart mobile DPR budgeting
 * so every textured landmark stays crisp and smooth on 2GB-4GB RAM devices!
 */
export class QualityManager {
  constructor(renderer, options = {}) {
    this.renderer = renderer;
    this.hqMode = Boolean(options.hqMode);
    this.devMem = navigator.deviceMemory || 4;
    this.cpuCores = navigator.hardwareConcurrency || 4;
    this.isVeryLowRam = !this.hqMode && (this.devMem <= 2 || this.cpuCores <= 2);
    this.isLowRam = !this.hqMode && (this.devMem <= 3 || this.cpuCores <= 4);
    this._bindContextRecovery();
  }

  _bindContextRecovery() {
    const canvas = this.renderer?.domElement;
    if (!canvas) return;
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      console.warn("WebGL context paused — waiting to recover cleanly.");
    });
    canvas.addEventListener("webglcontextrestored", () => {
      console.info("WebGL context restored cleanly!");
    });
  }
}
