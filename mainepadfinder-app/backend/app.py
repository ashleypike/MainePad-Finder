from flask import Flask, request, jsonify, g
from flask_cors import CORS
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
import mysql.connector
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
    database = os.getenv("DB_NAME") #,
    ##ssl_ca = os.getenv("CA_PATH"),
    ##ssl_cert = os.getenv("DATABASE_CERT_PATH"),
    ##ssl_key = os.getenv("DATABASE_KEY_PATH")
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
    username = data["username"]
    password = data["password"]
    email = data["email"]
    phoneNumber = data["phoneNumber"]
    gender = data["gender"]
    birthDate = data["birthDate"]
    displayName = data["displayName"]
    userType = data["userType"]

    hashedPassword = generate_password_hash(password)

    cursor.execute("SELECT USER_ID FROM USERS WHERE USERNAME = %s OR EMAIL = %s", (username, email))
    exists = cursor.fetchone()

    if exists:
        return jsonify({"error": "Failed to create user"}), 401

    parameters = (username, hashedPassword, email, phoneNumber, gender, birthDate, displayName, userType)
    cursor.callproc("INSERT_USER", parameters)
   
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

    parameters = (token, userID, createdAt, expiresAt)
    cursor.callproc("INSERT_SESSION", parameters)

    db.commit()

    return response, 200


# This function removes the session from the database
# and removes the token from cookies when user logs out
# Author: Ashley Pike
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

# This functions returns information about logged in user
# Author: Ashley Pike
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

# Retrieves information about the profile of the person currently logged in.
# Author: Jeffrey Fosgate (Created December 3, 2025 -- Last Updated December 8, 2025)
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

# Retrieves information about the properties owned by the person currently logged in.
# Author: Jeffrey Fosgate (Created December 6, 2025)
@app.get("/api/profile/properties")
@login_required
def get_my_properties():
    cursor.execute("SELECT * FROM PROPERTY WHERE LANDLORD_ID = %s", (g.user_id,))
    my_properties = cursor.fetchall()
    return jsonify(my_properties), 200

# Selects a matchmaking partner for the user currently logged in
# Author: Jeffrey Fosgate (Created December 7, 2025 -- Last Updated December 8, 2025)
@app.get("/api/matchmake")
@login_required
def select_matchmaking_partner():
    cursor.execute("SELECT USER_ID FROM USERS WHERE USER_ID != %s", (g.user_id,))
    other_users = cursor.fetchall()
    for user in [other_user["USER_ID"] for other_user in other_users]:
        cursor.execute("SELECT * FROM INTERUSER WHERE RENTER_ID = %s AND CONNECTION_ID = %s AND SWIPED = 1", (user, g.user_id, ))
        user_connection = cursor.fetchone()
        if not user_connection:        
            cursor.execute("SELECT PICTURE_URL, DISPLAY_NAME FROM USERS WHERE USER_ID = %s", (user, ))
            other_user_account = cursor.fetchone()
            other_user_account["MATCHMADE"] = 0
            return jsonify(other_user_account), 200
        else:
            if not user_connection["BLOCKED"]:
                cursor.execute("SELECT PICTURE_URL, DISPLAY_NAME FROM USERS WHERE USER_ID = %s", (user, ))
                other_user_account = cursor.fetchone()
                other_user_account["MATCHMADE"] = 1
                return jsonify(other_user_account), 200
            
    return jsonify({"error": "Could not find a matchmaking partner."}), 404

# Manages feedback provided by the matchmaker.
# Author: Jeffrey Fosgate (Created December 8, 2025)
@app.post("/api/matchmake/feedback")
@login_required
def matchmaking_feedback():
    data = request.get_json()
    partner_id = data["partner_id"]
    liked = data["liked"]

    if partner_id is None:
        return jsonify({"error": "Missing partner_id"}), 400

    # Record a swipe (accept matchmaking)
    cursor.execute("""
        INSERT INTO INTERUSER (RENTER_ID, CONNECTION_ID, SWIPED, BLOCKED)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE SWIPED = VALUES(SWIPED), BLOCKED = VALUES(BLOCKED)
    """, (
        g.user_id,
        partner_id,
        1 if liked else 0,
        0 if liked else 1
    ))

    db.commit()

    return jsonify({"message": "Feedback received"}), 200

# Is the chosen property (prop_id) trending UP (0) or DOWN (1)? Return (-1) if this cannot be discerned due to insufficient data.
# Author: Jeffrey Fosgate (December 7, 2025)
def prop_price_trending(prop_id):
    cursor.execute("SELECT * FROM PROP_PRICE_HISTORY WHERE PROPERTY_ID = %s ORDER BY PRICE_START DESC", prop_id)
    prop_hist_data = cursor.fetchall()
    if len(prop_hist_data) < 2:
        return -1
    elif prop_hist_data[0] > prop_hist_data[1]: # If this property's most recent price is higher than it was before...
        return 0
    else:
        return 1

# Arguments for running app.py
# Author: Ashley Pike
if __name__ == "__main__":
    app.run(
        host='localhost',
        port=5000,
        ssl_context=(os.getenv('FRONTEND_CERT_PATH'), os.getenv('FRONTEND_KEY_PATH')),
        debug=True
    )
