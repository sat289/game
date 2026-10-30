 const FIREBASE_DB_URL = "https://friendsgame-872f5-default-rtdb.firebaseio.com";
const LOCAL_STORAGE_KEY = "st_fruit_merge_data_v1";

window.FruitStorage = {
  user: { isLoggedIn: false, key: "guest", name: "Guest Player", photo: "" },
  stats: { highScore: 0, totalMerges: 0, maxFruitTier: 0, gamesPlayed: 0, updatedAt: 0 },

  safeReadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  },

  detectUser() {
    const ghName = (localStorage.getItem("gh_user_name") || "").trim();
    const profileObj = this.safeReadJSON("st_player_profile", {});
    const validName = ghName || (profileObj.name && profileObj.name !== "ST Player" ? profileObj.name : "");

    if (validName) {
      this.user.isLoggedIn = true;
      this.user.name = validName;
      this.user.key = (profileObj.email || validName).toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      this.user.photo = localStorage.getItem("gh_user_photo") || profileObj.photo || "";
    }
    return this.user;
  },

  async init(onStatusChange) {
    this.detectUser();
    const saved = this.safeReadJSON(`${LOCAL_STORAGE_KEY}_${this.user.key}`, null) || this.safeReadJSON(`${LOCAL_STORAGE_KEY}_guest`, null);
    if (saved) this.stats = { ...this.stats, ...saved };
    if (onStatusChange) onStatusChange(this.user.isLoggedIn ? `${this.user.name} • Cloud` : "Local Storage (Guest)", this.user.isLoggedIn);
    return this.stats;
  },

  async recordProgress({ score = 0 }, onStatusChange) {
    if (score > this.stats.highScore) this.stats.highScore = score;
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${this.user.key}`, JSON.stringify(this.stats));
    } catch (_) {}

    if (this.user.isLoggedIn) {
      try {
        await fetch(`${FIREBASE_DB_URL}/fruit_merge/players/${this.user.key}.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: this.user.name, highScore: this.stats.highScore, updatedAt: Date.now() })
        });
        if (onStatusChange) onStatusChange("Cloud Synced", true);
      } catch (_) {}
    }
  },

  async fetchLeaderboard() {
    try {
      const res = await fetch(`${FIREBASE_DB_URL}/fruit_merge/players.json`);
      const data = await res.json();
      return data ? Object.values(data).sort((a, b) => (b.highScore || 0) - (a.highScore || 0)).slice(0, 15) : [];
    } catch (_) { return []; }
  }
};
