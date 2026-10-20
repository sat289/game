:root {
    --primary: #4f46e5;
    --primary-hover: #4338ca;
    --accent: #f59e0b;
    --danger: #ef4444;
    --bg: #0f172a;
    --card-bg: #1e293b;
    --text: #f8fafc;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
    background-color: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

#app {
    width: 100%;
    max-width: 1000px;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.screen {
    display: none;
    width: 100%;
    animation: fadeIn 0.3s ease-in-out;
}

.screen.active {
    display: flex;
    justify-content: center;
}

.card {
    background: var(--card-bg);
    padding: 30px;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    width: 100%;
    max-width: 450px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

h1, h2 {
    color: var(--text);
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: left;
}

label {
    font-size: 0.9rem;
    color: #94a3b8;
}

input {
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #334155;
    background: #0f172a;
    color: white;
    font-size: 1rem;
}

.btn-container, .menu-options, .room-actions, .join-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.btn {
    padding: 12px 20px;
    border-radius: 8px;
    border: none;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
}

.btn:active {
    transform: scale(0.98);
}

.btn.primary { background: var(--primary); color: white; }
.btn.primary:hover { background: var(--primary-hover); }
.btn.secondary { background: #334155; color: white; }
.btn.secondary:hover { background: #475569; }
.btn.accent { background: var(--accent); color: #0f172a; }
.btn.danger { background: var(--danger); color: white; }
.btn.google { background: #db4437; color: white; }
.btn.small { padding: 6px 12px; font-size: 0.8rem; align-self: center; }

#game-screen .card, .game-container {
    display: flex;
    flex-direction: row;
    gap: 20px;
    max-width: 900px;
    background: var(--card-bg);
    padding: 20px;
    border-radius: 16px;
}

.game-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

#board {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    grid-template-rows: repeat(10, 1fr);
    width: 450px;
    height: 450px;
    background: #cbd5e1;
    border: 4px solid #475569;
    border-radius: 8px;
}

.cell {
    border: 1px solid rgba(0,0,0,0.1);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.75rem;
    font-weight: bold;
    color: #334155;
    position: relative;
}

.cell:nth-child(odd) { background: #e2e8f0; }
.cell:nth-child(even) { background: #f1f5f9; }

.sidebar {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 200px;
}

.dice-section {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.dice {
    font-size: 4rem;
    cursor: pointer;
}

.token {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    position: absolute;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.token-0 { background: #ef4444; }
.token-1 { background: #3b82f6; }
.token-2 { background: #10b981; }
.token-3 { background: #f59e0b; }

#leaderboard-list {
    list-style: none;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 250px;
    overflow-y: auto;
}

#leaderboard-list li {
    background: #0f172a;
    padding: 10px;
    border-radius: 6px;
    font-size: 0.95rem;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
