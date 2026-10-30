/**
 * ST Games - Fruit Merge Reloaded
 * Hybrid Cloud (Firebase Realtime DB) + LocalStorage Data Manager
 */

const FIREBASE_DB_URL = "https://friendsgame-872f5-default-rtdb.firebaseio.com";
const LOCAL_STORAGE_KEY = "st_fruit_merge_data_v1";

window.FruitStorage = {
  user: {
    isLoggedIn: false,
    key: "guest",
    name: "Guest Player",
    photo: ""
  },
  stats: {
    highScore: 0,
    totalMerges: 0,
    maxFruitTier: 0,
    gamesPlayed: 0,
    updatedAt: 0
  },

  safeReadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  },

  detectUser() {
    const ghName = (localStorage.getItem("gh_user_name") || "").trim();
    const profileObj = this.safeReadJSON("st_player_profile", {});
    const profileName = (profileObj.name || "").trim();
    const savedEmail = (localStorage.getItem("gh_user_email") || profileObj.email || "").trim();

    const validName = ghName || (profileName && profileName !== "ST Player" ? profileName : "");

    if (validName) {
      const rawId = savedEmail || validName;
      this.user.isLoggedIn = true;
      this.user.name = validName;
      this.user.key = rawId.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      this.user.photo =
        localStorage.getItem("gh_user_photo") ||
        localStorage.getItem("st_user_photo") ||
        profileObj.photo ||
        "";
    } else {
      this.user.isLoggedIn = false;
      this.user.name = "Guest Player";
      this.user.key = "guest";
      this.user.photo = "";
    }

    // Also register 'fruit game' in ST Games played list for Achievements
    try {
      const played = new Set(this.safeReadJSON("st_played_games", []));
      played.add("fruit game");
      localStorage.setItem("st_played_games", JSON.stringify([...played]));
    } catch (_) {}

    return this.user;
  },

  loadLocal() {
    const saved = this.safeReadJSON(`${LOCAL_STORAGE_KEY}_${this.user.key}`, null);
    const guestSaved = this.safeReadJSON(`${LOCAL_STORAGE_KEY}_guest`, null);
    const source = saved || guestSaved;
    if (source) {
      this.stats.highScore = Math.max(this.stats.highScore, Number(source.highScore) || 0);
      this.stats.totalMerges = Math.max(this.stats.totalMerges, Number(source.totalMerges) || 0);
      this.stats.maxFruitTier = Math.max(this.stats.maxFruitTier, Number(source.maxFruitTier) || 0);
      this.stats.gamesPlayed = Math.max(this.stats.gamesPlayed, Number(source.gamesPlayed) || 0);
      this.stats.updatedAt = Number(source.updatedAt) || 0;
    }
    return this.stats;
  },

  saveLocal() {
    this.stats.updatedAt = Date.now();
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${this.user.key}`, JSON.stringify(this.stats));
    } catch (_) {}
  },

  async init(onStatusChange) {
    this.detectUser();
    this.loadLocal();

    if (!this.user.isLoggedIn) {
      if (onStatusChange) onStatusChange("Local Storage (Guest)", false);
      return this.stats;
    }

    if (onStatusChange) onStatusChange(`Syncing ${this.user.name}...`, true);

    try {
      const res = await fetch(`${FIREBASE_DB_URL}/fruit_merge/players/${this.user.key}.json`);
      if (res.ok) {
        const remote = await res.json();
        if (remote) {
          this.stats.highScore = Math.max(this.stats.highScore, Number(remote.highScore) || 0);
          this.stats.totalMerges = Math.max(this.stats.totalMerges, Number(remote.totalMerges) || 0);
          this.stats.maxFruitTier = Math.max(this.stats.maxFruitTier, Number(remote.maxFruitTier) || 0);
          this.stats.gamesPlayed = Math.max(this.stats.gamesPlayed, Number(remote.gamesPlayed) || 0);
          this.saveLocal();
        }
      }
      await this.syncToCloud();
      if (onStatusChange) onStatusChange(`${this.user.name} • Cloud Synced`, true);
    } catch (err) {
      if (onStatusChange) onStatusChange(`${this.user.name} • Offline Local`, false);
    }

    return this.stats;
  },

  async recordProgress({ score = 0, mergedTier = 0, addMerge = false, gameOver = false }, onStatusChange) {
    let changed = false;

    if (score > this.stats.highScore) {
      this.stats.highScore = score;
      changed = true;
    }
    if (mergedTier > this.stats.maxFruitTier) {
      this.stats.maxFruitTier = mergedTier;
      changed = true;
    }
    if (addMerge) {
      this.stats.totalMerges += 1;
    }
    if (gameOver) {
      this.stats.gamesPlayed += 1;
      changed = true;
    }

    this.saveLocal();

    if (this.user.isLoggedIn && (changed || this.stats.totalMerges % 10 === 0)) {
      await this.syncToCloud(onStatusChange);
    }
  },

  async syncToCloud(onStatusChange) {
    if (!this.user.isLoggedIn) return;
    try {
      const payload = {
        name: this.user.name,
        photo: this.user.photo || "",
        highScore: this.stats.highScore,
        totalMerges: this.stats.totalMerges,
        maxFruitTier: this.stats.maxFruitTier,
        gamesPlayed: this.stats.gamesPlayed,
        updatedAt: Date.now()
      };
      await fetch(`${FIREBASE_DB_URL}/fruit_merge/players/${this.user.key}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (onStatusChange) onStatusChange(`${this.user.name} • Cloud Synced`, true);
    } catch (_) {
      if (onStatusChange) onStatusChange(`${this.user.name} • Saved Locally`, false);
    }
  },

  async fetchLeaderboard() {
    try {
      const res = await fetch(`${FIREBASE_DB_URL}/fruit_merge/players.json`);
      if (!res.ok) return [];
      const data = await res.json();
      if (!data) return [];
      return Object.values(data)
        .filter(item => item && typeof item.highScore === "number")
        .sort((a, b) => b.highScore - a.highScore)
        .slice(0, 15);
    } catch (_) {
      return [];
    }
  }
};
