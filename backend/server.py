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
import random
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from generator import GenerationError, generate_startup

dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path=dotenv_path)

# In-memory store for generated OTPs: { identifier: otp_code }
otp_store = {}

def send_otp_email(email_address, otp_code):
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = os.environ.get("SMTP_PORT")
    smtp_username = os.environ.get("SMTP_USERNAME")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    smtp_sender = os.environ.get("SMTP_SENDER", smtp_username)

    if not smtp_host or not smtp_username or not smtp_password:
        print(f"[SMTP MOCK] No SMTP credentials configured in .env. Generated OTP for {email_address}: {otp_code}")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_sender
        msg['To'] = email_address
        msg['Subject'] = "Your VisionCraft AI Verification Code"

        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #0b0b16; color: #ffffff; padding: 20px; border-radius: 10px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #111122; padding: 30px; border-radius: 12px; border: 1px solid #222244;">
                <h2 style="color: #8b5cf6; text-align: center; margin-bottom: 24px;">VisionCraft AI Verification</h2>
                <p style="color: #e2e8f0; font-size: 16px; line-height: 24px;">Hello,</p>
                <p style="color: #e2e8f0; font-size: 16px; line-height: 24px;">We received a request to verify your account. Please use the following 6-digit One-Time Password (OTP) to proceed:</p>
                <div style="text-align: center; margin: 35px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ffffff; background-color: rgba(139, 92, 246, 0.2); padding: 12px 28px; border-radius: 10px; border: 1px solid rgba(139, 92, 246, 0.45); text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);">{otp_code}</span>
                </div>
                <p style="color: #94a3b8; font-size: 14px; line-height: 20px;">This code is valid for 10 minutes. If you did not request this code, you can safely ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #222244; margin: 30px 0;">
                <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">VisionCraft AI — The AI-Powered Startup Incubator</p>
            </div>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        port = int(smtp_port) if smtp_port else 587
        if port == 465:
            server = smtplib.SMTP_SSL(smtp_host, port)
        else:
            server = smtplib.SMTP(smtp_host, port)
            server.starttls()

        server.login(smtp_username, smtp_password)
        server.sendmail(smtp_sender, email_address, msg.as_string())
        server.quit()
        print(f"[SMTP SUCCESS] OTP successfully sent to {email_address}")
        return True
    except Exception as e:
        print(f"[SMTP ERROR] Failed to send email to {email_address}: {e}")
        return False


app = Flask(__name__, static_folder='../web', static_url_path='')
CORS(app)  # allow the Expo app (different origin/device) to call this API

@app.route("/")
def index():
    return app.send_static_file("login.html")


@app.post("/api/login")
def login():
    payload = request.get_json(silent=True) or {}
    identifier = (payload.get("identifier") or "").strip()
    password = (payload.get("password") or "").strip()

    if not identifier or not password:
        return jsonify({"error": "Identifier and password are required."}), 400

    # Simple mock authentication validation
    if "fail" in identifier or password == "wrongpwd":
        return jsonify({"error": "Incorrect password or identifier."}), 401
    
    if "notfound" in identifier:
        return jsonify({"error": "User not found."}), 404

    return jsonify({
        "success": True,
        "token": "mock-jwt-token-abcdef123456"
    })


@app.post("/api/register")
def register():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip()
    mobile = (payload.get("mobile") or "").strip()
    password = (payload.get("password") or "").strip()

    if not name or not email or not mobile or not password:
        return jsonify({"error": "All fields (name, email, mobile, password) are required."}), 400

    if len(mobile) != 10 or not mobile.isdigit():
        return jsonify({"error": "Mobile number must be exactly 10 digits."}), 400

    if "@" not in email or "." not in email:
        return jsonify({"error": "Please enter a valid email address."}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400

    if "fail" in email or "fail" in mobile:
        return jsonify({"error": "User registration failed. Try another email or number."}), 400

    return jsonify({
        "success": True,
        "message": "Account created successfully! Please sign in."
    })


@app.post("/api/forgot-password")
@app.post("/api/send-otp")
def send_otp():
    payload = request.get_json(silent=True) or {}
    identifier = (payload.get("identifier") or "").strip()

    if not identifier:
        return jsonify({"error": "Registered email or mobile is required."}), 400

    if "invalid" in identifier:
        return jsonify({"error": "User not found with this identifier."}), 404

    # Generate a random 6-digit verification code
    otp_code = f"{random.randint(100000, 999999)}"
    otp_store[identifier] = otp_code

    # Check if identifier is an email and attempt sending
    is_email = "@" in identifier and "." in identifier
    if is_email:
        email_sent = send_otp_email(identifier, otp_code)
        if email_sent:
            return jsonify({
                "success": True,
                "message": "Verification OTP sent successfully to your email."
            })
        else:
            # Fallback to local printing if email sending fails or SMTP is unconfigured
            return jsonify({
                "success": True,
                "message": f"OTP generated (SMTP unconfigured/failed). Check server console or use {otp_code}."
            })
    else:
        # Mock SMS verification path for mobile numbers
        print(f"[SMS MOCK] Generated SMS OTP for {identifier}: {otp_code}")
        return jsonify({
            "success": True,
            "message": f"OTP sent successfully via SMS. Check console or use {otp_code}."
        })


@app.post("/api/verify-otp")
def verify_otp():
    payload = request.get_json(silent=True) or {}
    identifier = (payload.get("identifier") or "").strip()
    otp = (payload.get("otp") or "").strip()

    if not identifier or not otp:
        return jsonify({"error": "Identifier and OTP are required."}), 400

    actual_otp = otp_store.get(identifier)

    # Allow the actual OTP or the general mock backup codes for backward compatibility
    if (actual_otp and otp == actual_otp) or otp in ("123456", "000000"):
        # Clear the verification code after successful match
        otp_store.pop(identifier, None)
        return jsonify({
            "success": True,
            "message": "OTP verified successfully."
        })

    return jsonify({"error": "Invalid OTP verification code."}), 400


@app.post("/api/reset-password")
def reset_password():
    payload = request.get_json(silent=True) or {}
    identifier = (payload.get("identifier") or "").strip()
    password = (payload.get("password") or "").strip()

    if not identifier or not password:
        return jsonify({"error": "Identifier and new password are required."}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400

    return jsonify({
        "success": True,
        "message": "Password changed successfully. Please login again."
    })

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