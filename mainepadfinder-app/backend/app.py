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


# Connects the backend to the MySQL database
# Author: Ashley Pike
db = mysql.connector.connect(
    host = os.getenv("DB_HOST"),
    user = os.getenv("DB_USER"),
    password = os.getenv("DB_PASSWORD"),
    database = os.getenv("DB_NAME")
)
cursor = db.cursor(dictionary=True)

# This decorator wraps a function with a check to see if the user has a valid token before proceeding
# Author: Ashley Pike
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

# Signup allows a new user to be added to the database corresponding to the provided user data
# Author: Ashley Pike
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

# This function checks supplied username and password against the database
# and provides a session token to the user for authentication
# Author: Ashley Pike
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

    response = jsonify({"message": "Login successful"})
    response.set_cookie('token', token, expires=expiresAt, secure=True, httponly=True, samesite="None")

    cursor.execute("INSERT INTO SESSIONS (TOKEN, USER_ID, CREATED_AT, EXPIRES_AT) VALUES (%s, %s, %s, %s)", (token, userID, createdAt, expiresAt))
    db.commit()

    return response, 200

@app.post("/api/logout")
@login_required
def logout():
    token = request.cookies.get("token")

    if token:
        cursor.execute("DELETE FROM SESSIONS WHERE TOKEN = %s", (token,))
        db.commit()

    response = jsonify({"message": "Logged out"})
    response.set_cookie("token", "", expires=0, secure=True, httponly=True, samesite="None")
    return response, 200

@app.get("/api/me")
@login_required
def me():
    user_id = g.user_id
    
    cursor.execute(
        "SELECT USER_ID, USERNAME, EMAIL FROM USERS WHERE USER_ID = %s",
        (user_id,)
    )
    user = cursor.fetchone()

    if not user:
        return jsonify({"error": "User not found."}), 404

    return jsonify({
        "user_id": user["USER_ID"],
        "username": user["USERNAME"],
        "email": user["EMAIL"]
    }), 200

# This profile retrieves all profile details pertaining to the user of the account currently logged in.
# If no user is logged in, redirect to login page in accordance with @login_required
# Author: Jeffrey Fosgate (December 3, 2025 -- Updated December 6, 2025)
@app.get("/api/profile")
@login_required
def get_prof_details():
    cursor.execute("SELECT * FROM USERS WHERE USER_ID = %s", (g.user_id,))
    prof_details = cursor.fetchone()

    if not prof_details:
        return jsonify({"error": "Profile not found."}), 404
    
    return jsonify(prof_details, status=200)

# Is the chosen property (prop_id) trending UP (0) or DOWN (1)? Return (-1) if this cannot be discerned due to insufficient data.
# Author: Jeffrey Fosgate (December 6, 2025)
def prop_price_trending(prop_id):
    cursor.execute("SELECT * FROM PROP_PRICE_HISTORY WHERE PROP_ID = %s ORDER BY PRICE_START DESC", prop_id)
    prop_hist_data = cursor.fetchall()
    if len(prop_hist_data) < 2:
        return -1
    elif prop_hist_data[0] > prop_hist_data[1]: # If this property's most recent price is higher than it was before...
        return 0
    else:
        return 1

# Author: Ashley Pike
if __name__ == "__main__":
    app.run(
        host='localhost',
        port=5000,
        ssl_context=(os.getenv('SSL_CERT_PATH'), os.getenv('SSL_KEY_PATH')),
        debug=True
    )
