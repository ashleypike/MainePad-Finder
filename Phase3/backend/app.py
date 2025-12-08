from flask import Flask, request, jsonify, g
from flask_cors import CORS
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
import mysql.connector
import re
import secrets

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["https://localhost:5173"])  # allows frontend to communicate with backend

db = mysql.connector.connect(
    host = os.getenv("DB_HOST"),
    user = os.getenv("DB_USER"),
    password = os.getenv("DB_PASSWORD"),
    database = os.getenv("DB_NAME"),
)
cursor = db.cursor(dictionary=True)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.cookies.get('token')

        if not token:
            return jsonify({"error": "Session cookie not found."}), 401
        
        now = datetime.now(timezone.utc)

        cursor.execute("SELECT USER_ID FROM SESSIONS WHERE TOKEN = %s AND EXPIRES_AT > %s", (token, now))
        session_data = cursor.fetchone()

        if not session_data:
            return jsonify({"error": "Invalid or expired session."}), 401
        
        g.user_id = session_data["USER_ID"]

        return f(*args, **kwargs)
    return decorated_function

@app.post("/api/signup")
def signup():
    data = request.get_json()
    email = data["email"]
    username = data["username"]
    password = data["password"]
    phoneNumber = data["phoneNumber"]
    birthDate = data["birthDate"]
    displayName = data["displayName"]
    gender = data["gender"]
    userType = data["userType"]

    hashedPassword = generate_password_hash(password)

    cursor.execute(
        "INSERT INTO USERS (USERNAME, PASS_WORD, EMAIL, PHONE_NUMBER, GENDER, BIRTH_DATE, DISPLAY_NAME) VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (username, hashedPassword, email, phoneNumber, gender, birthDate, displayName)
    )

    userID = cursor.lastrowid
    
    if userType == "Renter":
        cursor.execute("INSERT INTO RENTER (USER_ID) VALUES (%s)", (userID,))
    elif userType == "Landlord":
        cursor.execute("INSERT INTO LANDLORD (USER_ID) VALUES (%s)", (userID,))
    else:
        db.rollback()
        return jsonify({"error": "Invalid user type"}), 401
        
    db.commit()

    return jsonify({"message": "User created successfully"}), 201

@app.get("/api/profile")
@login_required
def get_prof_details():
    cursor.execute("SELECT EMAIL, PHONE_NUMBER, GENDER, USER_DESC, PICTURE_URL, DISPLAY_NAME FROM USERS WHERE USER_ID = %s", (g.user_id,))
    prof_details = cursor.fetchone()

    if not prof_details:
        return jsonify({"error": "Profile not found."}), 404

    cursor.execute("SELECT USER_ID FROM LANDLORD WHERE USER_ID = %s", (g.user_id,))
    isLandlord = cursor.fetchone()
    prof_details["IS_LANDLORD"] = True if isLandlord else False
    
    return jsonify(prof_details), 200

@app.get("/api/profile/properties")
@login_required
def get_my_properties():
    cursor.execute("SELECT * FROM PROPERTY WHERE LANDLORD_ID = %s", (g.user_id,))
    my_properties = cursor.fetchall()
    return jsonify(my_properties), 200

@app.get("/api/matchmake")
@login_required
def select_matchmaking_partner():
    cursor.execute("SELECT USER_ID FROM USERS WHERE NOT USER_ID = %s", (g.user_id,))
    other_users = cursor.fetchall()
    for user in other_users:
        cursor.execute("SELECT * FROM INTERUSER WHERE ")

@app.post("/api/matchmake/<id>")
@login_required
def set_interuser():
    data = request.get_json()


# Is the chosen property (prop_id) trending UP (0) or DOWN (1)? Return (-1) if this cannot be discerned due to insufficient data.
def prop_price_trending(prop_id):
    cursor.execute("SELECT * FROM PROP_PRICE_HISTORY WHERE PROP_ID = %s ORDER BY PRICE_START DESC", prop_id)
    prop_hist_data = cursor.fetchall()
    if len(prop_hist_data) < 2:
        return -1
    elif prop_hist_data[0] > prop_hist_data[1]: # If this property's most recent price is higher than it was before...
        return 0
    else:
        return 1

@app.post("/api/login")
def login():
    data = request.get_json()
    username = data["username"]
    password = data["password"]

    cursor.execute("SELECT USER_ID, PASS_WORD FROM USERS WHERE USERNAME = %s", (username,))
    user = cursor.fetchone()

    if not user or not check_password_hash(user["PASS_WORD"], password):
        return jsonify({"error": "Invalid credentials"}), 401
    
    token = secrets.token_hex(32)
    userID = user["USER_ID"]
    createdAt = datetime.now(timezone.utc)
    expiresAt = createdAt + timedelta(days=1)

    resp = jsonify({"message": "Login successful"})
    resp.set_cookie('token', token, expires=expiresAt, secure=True, httponly=True, samesite="None")

    cursor.execute("INSERT INTO SESSIONS (TOKEN, USER_ID, CREATED_AT, EXPIRES_AT) VALUES (%s, %s, %s, %s)", (token, userID, createdAt, expiresAt))
    db.commit()

    return resp, 200


if __name__ == "__main__":
    app.run(
        host='localhost',
        port=5000,
        ssl_context=(os.getenv('SSL_CERT_PATH'), os.getenv('SSL_KEY_PATH')),
        debug=True
    )
