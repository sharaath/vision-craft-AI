"""
server.py

Flask backend for the VisionCraftAI Expo/React Native app.
Exposes POST /api/generate, which the app calls to turn an idea/audience/problem
into a full startup blueprint using generator.py (Claude API).

Run:
    pip install -r requirements.txt
    export ANTHROPIC_API_KEY=sk-ant-...     (or put it in a .env file)
    python server.py

The app's App.js currently points at a hardcoded SERVER_URL like
http://10.168.79.119:8000 — update that to match the machine running this
server (run `ipconfig`/`ifconfig` to find your LAN IP), or switch to using
your computer's IP so a physical device on the same Wi-Fi can reach it.
"""

import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from generator import GenerationError, generate_startup

dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path=dotenv_path)

app = Flask(__name__)
CORS(app)  # allow the Expo app (different origin/device) to call this API

PORT = int(os.environ.get("PORT", 8000))


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/generate")
def generate():
    payload = request.get_json(silent=True) or {}

    idea = (payload.get("idea") or "").strip()
    audience = (payload.get("audience") or "").strip()
    problem = (payload.get("problem") or "").strip()

    missing = [name for name, value in
               [("idea", idea), ("audience", audience), ("problem", problem)]
               if not value]
    if missing:
        return jsonify({"error": f"Missing required field(s): {', '.join(missing)}"}), 400

    try:
        result = generate_startup(idea, audience, problem)
    except GenerationError as exc:
        app.logger.error("Generation failed: %s", exc)
        return jsonify({"error": str(exc)}), 502

    return jsonify(result)


@app.errorhandler(404)
def not_found(_err):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def server_error(_err):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    if not os.environ.get("GEMINI_API_KEY"):
        print("WARNING: GEMINI_API_KEY is not set. Set it in your environment or a .env file.")
    app.run(host="0.0.0.0", port=PORT, debug=True)