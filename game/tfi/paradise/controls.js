// ST GAMES: THE PARADISE - Input Handler
class ParadiseControls {
  constructor() {
    this.keys = {};
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }
}
window.paradiseControls = null;
