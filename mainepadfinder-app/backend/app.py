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
# NOTE: frontend is now http://localhost:5173 (no https)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])  # frontend is HTTP now
  # allows frontend to communicate with backend

# Add CORS headers so the react can talk to the flask backend and send cookies 
#Author: Sophia Priola
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response

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

    cursor.execute("SELECT USER_ID FROM USERS WHERE USERNAME = %s OR EMAIL = %s", (username, email))
    exists = cursor.fetchone()

    if exists:
        return jsonify({"error": "Failed to create user"}), 401

    parameters = (email, username, hashedPassword, phoneNumber, birthDate, displayName, gender, userType)
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
    # dev: cookie is not secure because we are on HTTP
    response.set_cookie(
        "token",
        token,
        expires=expiresAt,
        secure=False,          # was True
        httponly=True,
        samesite="Lax",        # was "None" (requires secure=True)
    )

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
    response.set_cookie(
        "token",
        "",
        expires=0,
        secure=False,          # was True
        httponly=True,
        samesite="Lax",
    )
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

# Retrieves all profile details pertaining to the user of the account currently logged in.
# If no user is logged in, redirect to login page in accordance with @login_required
# Author: Jeffrey Fosgate (December 3, 2025 -- Updated December 7, 2025)
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

# Retrieves all properties belonging to the person currently logged in.
# Author: Jeffrey Fosgate (December 7, 2025)
@app.get("/api/profile/properties")
@login_required
def get_my_properties():
    cursor.execute("SELECT * FROM PROPERTY WHERE LANDLORD_ID = %s", (g.user_id,))
    my_properties = cursor.fetchall()
    return jsonify(my_properties), 200

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
    

# This function retrieves property listings from the database, joining with address information
# and applying filters based on the request body.
# Author: Sophia Priola
@app.post("/api/properties")
def get_properties():
    try:
        data = request.get_json(silent=True) or {}

        # All keys are optional allows us to filter by any combination of these 
        city = data.get("city")
        min_rent = data.get("minRent")
        max_rent = data.get("maxRent")
        min_beds = data.get("minBeds")
        min_baths = data.get("minBaths")

        # Base query: join PROPERTY + ADDRESS, we add the WHERE condition when needed 
        sql = """
            SELECT 
                P.PROPERTY_ID,
                P.UNIT_LABEL,
                P.RENT_COST,
                P.BEDROOMS,
                P.BATHROOMS,
                P.CAN_RENT,
                P.SQFT,
                A.CITY,
                A.STATE_CODE,
                A.STREET,
                A.ZIPCODE
            FROM PROPERTY AS P
            JOIN ADDRESS AS A
            ON P.ADDR_ID = A.ADDR_ID
            WHERE 1=1
        """

        params = []

        if city:
            sql += " AND A.CITY LIKE %s"
            params.append(f"%{city}%")

        if min_rent is not None:
            sql += " AND P.RENT_COST >= %s"
            params.append(min_rent)

        if max_rent is not None:
            sql += " AND P.RENT_COST <= %s"
            params.append(max_rent)

        if min_beds is not None:
            sql += " AND P.BEDROOMS >= %s"
            params.append(min_beds)

        if min_baths is not None:
            sql += " AND P.BATHROOMS >= %s"
            params.append(min_baths)

        cursor.execute(sql, tuple(params))
        rows = cursor.fetchall()

        # Shape results into what the frontend expects
        properties = []
        for row in rows:
            title = row["UNIT_LABEL"]
            if not title:
                pieces = []
                if row["BEDROOMS"] is not None:
                    pieces.append(f"{row['BEDROOMS']} bed")
                if row["BATHROOMS"] is not None:
                    pieces.append(f"{row['BATHROOMS']} bath")
                title = " • ".join(pieces) if pieces else "Untitled unit"

            properties.append({
                "id": row["PROPERTY_ID"],
                "title": title,
                "rent": row["RENT_COST"],
                "beds": row["BEDROOMS"],
                "baths": row["BATHROOMS"],
                "canRent": bool(row["CAN_RENT"]),
                "sqft": row["SQFT"],
                "city": row["CITY"],
                "state": row["STATE_CODE"],
                "addressLine1": row["STREET"],
                "addressLine2": None,         
                "zipCode": row["ZIPCODE"],
            })

        return jsonify(properties), 200

    except Exception as e:
        print("Error in /api/properties:", e)
        return jsonify({"error": "Failed to load properties"}), 500
    

# This function retrieves a single property listing along with its landlord information
# Author: Sophia Priola
@app.get("/api/listing/<int:property_id>")
def get_listing_with_landlord(property_id):
    try:
        # Call the stored procedure
        cursor.execute("CALL GET_LISTING_WITH_LANDLORD(%s)", (property_id,))
        row = cursor.fetchone()

        while cursor.nextset():
            pass

        if not row:
            return jsonify({"error": "Listing not found"}), 404

        result = {
            "id": row["PROPERTY_ID"],
            "unitLabel": row["UNIT_LABEL"],
            "rent": row["RENT_COST"],
            "beds": row["BEDROOMS"],
            "baths": row["BATHROOMS"],
            "sqft": row["SQFT"],
            "canRent": row["CAN_RENT"],   # 0 = available, 1 = not
            "city": row["CITY"],
            "state": row["STATE_CODE"],
            "zip": row.get("ZIP_CODE"),
            "avgRating": row.get("AVG_RATING"),
            "landlordName": row.get("LANDLORD_NAME"),
            "landlordEmail": row.get("LANDLORD_EMAIL"),
            "landlordPhone": row.get("LANDLORD_PHONE"),
        }

        return jsonify(result), 200

    # If there are errors we print the error message 
    except Exception as e:
        print("Error in /api/listing/<id>:", e)
        return jsonify({"error": "Failed to load listing"}), 500


# This function retrieves 'best deal' properties from the BEST_DEAL_PROPERTIES view
# Author: Sophia Priola 
@app.route("/api/properties/deals", methods=["POST"])
def get_property_deals():
    """
    Return 'best deal' properties from BEST_DEAL_PROPERTIES view.
    Optional JSON body:
    {
        "city": "Portland"   # if given, limit to that city (LIKE %city%)
    }
    """
    try:
        data = request.get_json(silent=True) or {}
        city = data.get("city")

        sql = """
            SELECT
                PROPERTY_ID,
                UNIT_LABEL,
                RENT_COST,
                BEDROOMS,
                BATHROOMS,
                CAN_RENT,
                SQFT,
                CITY,
                STATE_CODE,
                city_avg_rent,
                rent_pct_of_city_avg
            FROM BEST_DEAL_PROPERTIES
        """
        params = []

        if city:
            sql += " WHERE CITY LIKE %s"
            params.append(f"%{city}%")

        sql += " ORDER BY rent_pct_of_city_avg ASC, RENT_COST ASC LIMIT 50"

        cursor.execute(sql, tuple(params))
        rows = cursor.fetchall()

        deals = []
        for row in rows:
            title = row["UNIT_LABEL"]
            if not title:
                pieces = []
                if row["BEDROOMS"] is not None:
                    pieces.append(f"{row['BEDROOMS']} bed")
                if row["BATHROOMS"] is not None:
                    pieces.append(f"{row['BATHROOMS']} bath")
                title = " • ".join(pieces) if pieces else "Untitled unit"

            deals.append({
                "id": row["PROPERTY_ID"],
                "title": title,
                "rent": row["RENT_COST"],
                "beds": row["BEDROOMS"],
                "baths": row["BATHROOMS"],
                "canRent": bool(row["CAN_RENT"]),
                "sqft": row["SQFT"],
                "city": row["CITY"],
                "state": row["STATE_CODE"],
                "cityAvgRent": row["city_avg_rent"],
                "rentPctOfCityAvg": row["rent_pct_of_city_avg"],
            })

        return jsonify(deals), 200

    except Exception as e:
        print("Error in /api/properties/deals:", e)
        return jsonify({"error": "Failed to load best deals"}), 500

# Create or update a review for a single property by the logged-in user.
# Uses the REVIEW table and enforces stars 1–5.
# Author: Sophia Priola
@app.post("/api/listing/<int:property_id>/review")
@login_required
def create_or_update_review(property_id):
    """
    Create or update a review for a single property by the logged-in user.
    Uses the REVIEW table and enforces stars 1–5.
    """
    try:
        data = request.get_json() or {}
        stars = data.get("stars")
        comments = (data.get("comments") or "").strip() or None

        # validate stars
        try:
            stars_val = float(stars)
        except (TypeError, ValueError):
            return jsonify({"error": "Stars must be a number between 1 and 5."}), 400

        if not (1 <= stars_val <= 5):
            return jsonify({"error": "Stars must be between 1 and 5."}), 400

        user_id = g.user_id  # from login_required

        cursor.execute(
            """
            INSERT INTO REVIEW (USER_ID, PROPERTY_ID, COMMENTS, STARS)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                COMMENTS = VALUES(COMMENTS),
                STARS = VALUES(STARS)
            """,
            (user_id, property_id, comments, stars_val),
        )
        db.commit()

        return jsonify({"message": "Review saved successfully"}), 201

    except Exception as e:
        print("Error in /api/listing/<id>/review:", e)
        return jsonify({"error": "Failed to save review"}), 500
    
# Return a conersation between the logged-in user and another user 
# Author: Sophia Priola
@app.get("/api/messages/thread")
@login_required
def get_message_thread():
    # current logged in user id from the decorator
    current_user_id = g.user_id

    other_username = (request.args.get("otherUsername") or "").strip()
    if not other_username:
        return jsonify({"error": "Missing username parameter"}), 400

    # look up the other user by username
    cursor.execute(
        "SELECT USER_ID, USERNAME FROM USERS WHERE USERNAME = %s",
        (other_username,)
    )
    other = cursor.fetchone()
    if not other:
        return jsonify({"error": "User not found."}), 404

    other_user_id = other["USER_ID"]

    # pull messages in both directions between these two users
    cursor.execute(
        """
        SELECT 
            M.MSG_ID,
            M.SENDER_ID,
            M.RECIPIENT_ID,
            M.MESSAGE_TEXTS,
            M.TIME_STAMP,
            SU.USERNAME AS SENDER_USERNAME
        FROM MESSAGE AS M
        JOIN USERS AS SU ON SU.USER_ID = M.SENDER_ID
        WHERE 
            (M.SENDER_ID = %s AND M.RECIPIENT_ID = %s)
            OR
            (M.SENDER_ID = %s AND M.RECIPIENT_ID = %s)
        ORDER BY M.TIME_STAMP ASC
        """,
        (current_user_id, other_user_id, other_user_id, current_user_id),
    )

    rows = cursor.fetchall()

    messages = []
    for row in rows:
        messages.append({
            "msgId": row["MSG_ID"],
            "text": row["MESSAGE_TEXTS"],
            "senderId": row["SENDER_ID"],
            "recipientId": row["RECIPIENT_ID"],
            "senderUsername": row["SENDER_USERNAME"],
            "sentAt": row["TIME_STAMP"].isoformat(),
            "isMine": row["SENDER_ID"] == current_user_id,
        })

    return jsonify(messages), 200

# This endpoint allows the logged-in user to send a message to another user
# Author: Sophia Priola
@app.post("/api/messages/send")
@login_required
def send_message():
    current_user_id = g.user_id

    data = request.get_json() or {}
    other_username = (data.get("otherUsername") or "").strip()
    text = (data.get("text") or "").strip()

    if not other_username:
        return jsonify({"error": "Recipient username is required"}), 400
    if not text:
        return jsonify({"error": "Message text is required"}), 400

    # find the recipient by username
    cursor.execute(
        "SELECT USER_ID FROM USERS WHERE USERNAME = %s",
        (other_username,)
    )
    other = cursor.fetchone()
    if not other:
        return jsonify({"error": "Recipient not found"}), 404

    recipient_id = other["USER_ID"]

    # insert the new message
    cursor.execute(
        """
        INSERT INTO MESSAGE (SENDER_ID, RECIPIENT_ID, MESSAGE_TEXTS)
        VALUES (%s, %s, %s)
        """,
        (current_user_id, recipient_id, text),
    )
    db.commit()

    return jsonify({"message": "Message sent"}), 201

# Author: Ashley Pike
# Arguments for running app.py
if __name__ == "__main__":
    app.run(
        host="localhost",
        port=5000,
        debug=True,   # no ssl_context here in dev
    )

        

