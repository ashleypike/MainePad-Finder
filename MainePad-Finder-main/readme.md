# API Documentation

Below is a simplified summary of the backend API implemented in `mainepadfinder-app/backend/app.py`.

Authentication is session-based using a `token` cookie.

## POST /api/signup
Create a new user account.

**Request Body:**
```
{
  "username": "",
  "password": "",
  "email": "",
  "phoneNumber": "",
  "gender": "",
  "birthDate": "",
  "displayName": "",
  "userType": "Renter or Landlord"
}
```

**Success Response:**
```
{"message": "User created successfully"}
```

## POST /api/login
Authenticate user and create a session token.

**Request Body:**
```
{"username": "", "password": ""}
```
**Success Response:**
```
{"message": "Login successful"}
```
## POST /api/logout
Log out and remove session.

**Success Response:**
```
{"message": "Logged out"}
```

## GET /api/me
Return basic info about the logged-in user.

**Success Response:**
```
{"user_id": 1, "username": "", "email": ""}
```
## GET /api/profile
Return full profile for the logged-in user.

**Success Response:**
```
{
  "EMAIL": "",
  "PHONE_NUMBER": "",
  "GENDER": "",
  "USER_DESC": "",
  "PICTURE_URL": "",
  "DISPLAY_NAME": "",
  "IS_LANDLORD": true
}
```
## GET /api/profile/properties
Return all properties owned by the logged-in landlord.

**Success Response:**
```
  {
    "PROP_ID": 10,
    "UNIT_LABEL": "Apt 2B",
    "RENT_COST": 1200,
    "SQFT": 850,
    "BEDROOMS": 2,
    "BATHROOMS": 1
  }
```
