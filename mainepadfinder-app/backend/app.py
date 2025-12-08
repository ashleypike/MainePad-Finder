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
db = mysql.connector.connect(
    host = os.getenv("DB_HOST"),
    user = os.getenv("DB_USER"),
    password = os.getenv("DB_PASSWORD"),
    database = os.getenv("DB_NAME")
)
cursor = db.cursor(dictionary=True)

# This decorator wraps a function with a check to see if the user has a valid token before proceeding
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

# This function checks supplied username and password against the database
# and provides a session token to the user for authentication
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


#Yunlong

#check role
def get_user_role(user_id: int) -> str:

    # check Landlord
    cursor.execute("SELECT 1 FROM LANDLORD WHERE USER_ID = %s", (user_id,))
    if cursor.fetchone():
        return "Landlord"

    # check Renter
    cursor.execute("SELECT 1 FROM RENTER WHERE USER_ID = %s", (user_id,))
    if cursor.fetchone():
        return "Renter"

    return "Unknown"


#Landlord check properties
@app.get("/api/properties")
@login_required
def list_properties():
    role = get_user_role(g.user_id)
    if role != "Landlord":
        return jsonify({"error": "Only landlords can view their properties."}), 403

    cursor.execute(
        """
        SELECT 
            p.PROPERTY_ID,
            p.RENT_COST,
            p.SQFT,
            p.BEDROOMS,
            p.BATHROOMS,
            p.CAN_RENT,
            p.UNIT_LABEL,
            p.PROPERTY_RATING,
            a.STREET,
            a.CITY,
            a.STATE_CODE,
            a.ZIPCODE
        FROM PROPERTY p
        JOIN ADDRESS a ON p.ADDR_ID = a.ADDR_ID
        WHERE p.LANDLORD_ID = %s
        ORDER BY p.PROPERTY_ID DESC
        """,
        (g.user_id,),
    )
    rows = cursor.fetchall()
    return jsonify(rows), 200

@app.post("/api/properties")
@login_required
def add_property():
    role = get_user_role(g.user_id)
    if role != "Landlord":
        return jsonify({"error": "Only landlords can add properties."}), 403

    data = request.get_json()

    required_fields = [
        "street", "city", "stateCode", "zipCode",
        "unitLabel", "rentCost", "sqft", "bedrooms", "bathrooms"
    ]
    missing = [f for f in required_fields if f not in data or data[f] in (None, "")]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    street = data["street"]
    city = data["city"]
    state_code = data["stateCode"]
    zip_code = data["zipCode"]
    unit_label = data["unitLabel"]
    rent_cost = int(data["rentCost"])
    sqft = int(data["sqft"])
    bedrooms = float(data["bedrooms"])
    bathrooms = float(data["bathrooms"])
    can_rent = 1 if data.get("canRent", True) else 0

    try:
        #insert ADDRESS
        cursor.execute(
            """
            INSERT INTO ADDRESS (STREET, CITY, STATE_CODE, ZIPCODE)
            VALUES (%s, %s, %s, %s)
            """,
            (street, city, state_code, zip_code),
        )
        addr_id = cursor.lastrowid

        #insert ADDRESS
        cursor.execute(
            """
            INSERT INTO PROPERTY (
                RENT_COST,
                PROPERTY_RATING,
                LANDLORD_ID,
                SQFT,
                BATHROOMS,
                BEDROOMS,
                CAN_RENT,
                UNIT_LABEL,
                ADDR_ID
            ) VALUES (%s, NULL, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                rent_cost,
                g.user_id,
                sqft,
                bathrooms,
                bedrooms,
                can_rent,
                unit_label,
                addr_id,
            ),
        )
        property_id = cursor.lastrowid
        db.commit()
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

    return jsonify({"message": "Property created", "propertyId": property_id}), 201

#Update property details, for rentcoset and canrent
@app.put("/api/properties/<int:property_id>")
@login_required
def update_property(property_id: int):
    role = get_user_role(g.user_id)
    if role != "Landlord":
        return jsonify({"error": "Only landlords can update properties."}), 403

    data = request.get_json() or {}

    fields = []
    params = []

    if "rentCost" in data:
        fields.append("RENT_COST = %s")
        params.append(int(data["rentCost"]))

    if "canRent" in data:
        fields.append("CAN_RENT = %s")
        params.append(1 if data["canRent"] else 0)

    if not fields:
        return jsonify({"error": "No fields to update."}), 400

    params.append(property_id)
    params.append(g.user_id)

    sql = f"""
        UPDATE PROPERTY
        SET {', '.join(fields)}
        WHERE PROPERTY_ID = %s AND LANDLORD_ID = %s
    """

    cursor.execute(sql, tuple(params))
    db.commit()

    if cursor.rowcount == 0:
        return jsonify({"error": "Property not found or not owned by this landlord."}), 404

    return jsonify({"message": "Property updated"}), 200

#get user settings
@app.get("/api/settings")
@login_required
def get_settings():
    cursor.execute(
        """
        SELECT USERNAME, EMAIL, PHONE_NUMBER, DISPLAY_NAME, GENDER
        FROM USERS
        WHERE USER_ID = %s
        """,
        (g.user_id,),
    )
    user = cursor.fetchone()

    role = get_user_role(g.user_id)
    renter_settings = None

    if role == "Renter":
        cursor.execute(
            """
            SELECT DISTANCE_MAX, GENDER_PREFERRED
            FROM RENTER_SETTINGS
            WHERE USER_ID = %s
            """,
            (g.user_id,),
        )
        renter_settings = cursor.fetchone()

    return jsonify(
        {
            "user": user,
            "role": role,
            "renterSettings": renter_settings,
        }
    ), 200

#put user settings
@app.put("/api/settings")
@login_required
def update_settings():
    data = request.get_json() or {}

    email = data.get("email")
    phone_number = data.get("phoneNumber")
    display_name = data.get("displayName")

    #update USERS table
    if any([email, phone_number, display_name]):
        cursor.execute(
            """
            UPDATE USERS
            SET
                EMAIL        = COALESCE(%s, EMAIL),
                PHONE_NUMBER = COALESCE(%s, PHONE_NUMBER),
                DISPLAY_NAME = COALESCE(%s, DISPLAY_NAME)
            WHERE USER_ID = %s
            """,
            (email, phone_number, display_name, g.user_id),
        )

    role = get_user_role(g.user_id)

    #update RENTER_SETTINGS table
    if role == "Renter":
        distance_max = data.get("distanceMax")
        gender_preferred = data.get("genderPreferred")

        if distance_max is not None and gender_preferred is not None:
            cursor.execute(
                """
                INSERT INTO RENTER_SETTINGS (USER_ID, DISTANCE_MAX, GENDER_PREFERRED)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    DISTANCE_MAX = VALUES(DISTANCE_MAX),
                    GENDER_PREFERRED = VALUES(GENDER_PREFERRED)
                """,
                (g.user_id, int(distance_max), gender_preferred),
            )

    db.commit()

    return jsonify({"message": "Settings updated"}), 200








if __name__ == "__main__":
    app.run(
        host='localhost',
        port=5000,
        ssl_context=(os.getenv('SSL_CERT_PATH'), os.getenv('SSL_KEY_PATH')),
        debug=True
    )
