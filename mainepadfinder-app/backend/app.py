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
    database = os.getenv("DB_NAME")
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

# get_prof_details() written by Jeffrey Fosgate (December 3, 2025)
@app.get("/api/profile")
@login_required
def get_prof_details():
    cursor.execute("SELECT * FROM USERS WHERE USER_ID = %s", (g.user_id))
    prof_details = cursor.fetchone()

    if not prof_details:
        return jsonify({"error": "Profile not found."}), 404
    
    return jsonify(prof_details, status=200)

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

@app.post("/api/properties")
def get_properties():
    """
    Return property listings joined with ADDRESS, filtered in SQL.
    Expects body like:
    {
        "city": "Portland",
        "minRent": 1000,
        "maxRent": 2500,
        "minBeds": 2,
        "minBaths": 1
    }
    All of the keys are optional
    """
    try:
        data = request.get_json(silent=True) or {}

        city = data.get("city")
        min_rent = data.get("minRent")
        max_rent = data.get("maxRent")
        min_beds = data.get("minBeds")
        min_baths = data.get("minBaths")

        # Base query: join PROPERTY + ADDRESS, then add WHERE conditions as needed
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

    except Exception as e:
        print("Error in /api/listing/<id>:", e)
        return jsonify({"error": "Failed to load listing"}), 500

    
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



if __name__ == "__main__":
    
    ssl_cert = os.getenv("SSL_CERT_PATH")
    ssl_key = os.getenv("SSL_KEY_PATH")

    if ssl_cert and ssl_key and os.path.exists(ssl_cert) and os.path.exists(ssl_key):
        print(f" Starting HTTPS backend on https://localhost:5000")
        app.run(
            host="localhost",
            port=5000,
            ssl_context=(ssl_cert, ssl_key),
            debug=True,
        )
    else:
        print("SSL cert/key missing")
        
        

