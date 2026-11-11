# ST GAMES – THE PARADISE (TFI Edition)

**Tagline:** *Explore Together. Survive Together. Reach Paradise.*

## Hosting on `https://stgames.online/game/tfi`

All file imports, sprite paths, audio paths, `manifest.json`, and `sw.js` use relative URLs (`./...`), so you can upload the contents of `ST-GAMES-THE-PARADISE/` directly into your `/game/tfi/` folder on `stgames.online`:

```text
https://stgames.online/game/tfi/
├── index.html
├── style.css
├── game.js
├── characters.js
├── controls.js
├── audio.js
├── dialogue.js
├── missions.js
├── manifest.json
├── sw.js
└── assets/
    ├── audio/
    │   ├── start-dialogue.mp3
    │   ├── paradise-bgm.mp3
    │   ├── ee-desham-manadhe.mp3
    │   ├── ee-jaaga-manadhe.mp3
    │   ├── level-clear.mp3
    │   ├── gameover.mp3
    │   ├── danger-alert.mp3
    │   ├── police-coming.mp3
    │   ├── pass.mp3
    │   └── pass-dialogue.mp3
    ├── images/
    │   ├── icon.svg
    │   ├── leader.png
    │   ├── mother.png
    │   ├── tribal.png
    │   ├── rebel.png
    │   ├── dog.png
    │   ├── crow.png
    │   ├── baby.png
    │   ├── guard_pistol.png
    │   └── guard_bazooka.png
    ├── models/
    │   └── characters.json
    └── textures/
        └── theme.json
```

## Key Features
- **Slow Progressive Police Speed:** Police start slow on Level 1 (`guardSpeed: 19.0`) and gradually increase speed by `+1.3` per level.
- **Watchtower Sniper Mechanic After Level 4:** Levels 1–4 feature foot police and barricades; starting on Level 5+, police build elevated Watchtowers with red alerts and sniper laser lock-on.
- **Auto-Play Studio Audio:** Automatically plays `start-dialogue.mp3` and `paradise-bgm.mp3` (*Aaya Sher* at soft 22% volume), alternates *"Ee desham manadhe!"* and *"Ee jaaga manadhe!"* on every baby pass, plays `level-clear.mp3` (*Yesha Nagula*) on victory, and plays `gameover.mp3` on defeat.
- **LocalStorage Level Persistence:** Automatically saves and resumes from the exact stopped level (`st_games_paradise_save` & `paradise_current_level`).
