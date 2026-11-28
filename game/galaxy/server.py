import json
import os
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder='.')
SAVE_FILE = 'player_save.json'

DEFAULT_SAVE = {
    "coins": 3099,
    "gems": 200,
    "selectedShip": "cobra",
    "shipLevels": {"cobra": 1, "seraphim": 1, "azure": 1, "crimson": 1, "cryo": 1},
    "unlockedLevel": 0,
    "stars": {},
    "bestScores": {}
}

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@app.route('/api/save', methods=['GET'])
def get_save():
    if os.path.exists(SAVE_FILE):
        with open(SAVE_FILE, 'r', encoding='utf-8') as f:
            return jsonify(json.load(f))
    return jsonify(DEFAULT_SAVE)

@app.route('/api/save', methods=['POST'])
def post_save():
    data = request.get_json(force=True)
    with open(SAVE_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    return jsonify({"status": "saved"})

if __name__ == '__main__':
    print("🚀 Space Shooter Server running at http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
