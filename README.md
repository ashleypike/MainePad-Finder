# Overview

An application for the locating of apartments near college and potential roommate matching


# Installation & Setup

This project consists of a React (Vite) frontend, a Flask backend, and a MySQL database.  
Follow these steps to install and run the project locally.

### Requirements:

Python (3.10+)  
Node.js (v25+)  
Git Bash/Powershell  
MySQL Server  
mkcert  
Chocolatey (If mkcert and MySQL server not installed)  

## Clone the Repository

```bash
git clone https://github.com/ashleypike/MainePad-Finder
cd MainePad-Finder
```

## Installation 

**The database user *admin/admin* is assumed to already exist as per assignment instructions.**  
Run the installation script from the root of the directory:
```bash
./install.sh
```
When run, this will:
1. Load variables from .env
2. Create a virtual environment within the backend
3. Install backend dependencies in the virtual environment
4. Install frontend dependencies
5. Create self signed cert on localhost
    * Chocolatey will install mkcert if not found
6. Starts MySQL server service
    * Chocolatey will install MySQL server if not found
7. Runs database creation scripts
8. Inserts sample data into database


## Running

Start both the backend and the frontend using:
```bash
./run.sh
```
When run, this will:
1. Activate backend virtual environment
2. Start flask backend
3. Start Vite React frontend (HTTPS)

The frontend by default will run at:
```arduino
https://localhost:5173/
```
# Properties Usage Guide:
The Properties page is the main search interface for MainePad-Finder. It lets users filter rental properties by city, price, and number of beds/baths, and also find the best deals based on city-average rent. When a property is clicked on from the properties page it will bring the user to details about the specific properties on the Listing page. 

## Prerequisites and Setup
The properties page assumes the following services are running:
* **Backend Flask API**
   * Base URL: `http://localhost:5000`
   * Endpoints used:
       * `POST /api/properties`
       * `POST /api/property/deals`
   * Environment details configured:
       * `DB_HOST`
       * `DB_USER`
       * `DB_PASSWORD`
       * `DB_NAME`
   * MySQL database contains:
       * `PROPERTY` and `ADDRESS` tables
       * `BEST_DEAL_PROPERTIES` view
* **Frontend React and Vite**
  * Base URL: `http://localhost:5173`
  * Start with 
```
npm install
npm run dev
```
* **CORS/COOKIES**
   * The backend enables CORS for `http://localhost:5173` and allows credentials so that cookies and sessions can be used if needed
## How To Use Properties Page
**1. Open the page**
* Navigate to the Properties page in the React app

**2. Set filters (this is optional)**
* City (e.g., Portland)
* Min/ Max Rent (e.g., 800 to 1000)
* Min Beds/ Min Baths
  
**3. Run search**
* Click the "Apply filters", "No filters" or "Find me deals!" button depending on what you're looking for
* This sends a request with null filters so the backend can return a broader set of properties.

**4. Pagination**
* Only 10 properties per page
* Use Next/Previous page controls to navigate through the result set

**5. View the best deals**
* Optionally click "Find me deals!" to call `POST /api/properties/deals`
* This shows all properties below the average rent in a given city
* Matching properties are displayed as clickable cards
   * Click a property and it will give you specifications about that listing

## Properties to Listing
Click on a property you are interested in to get to the listing page. The listing page will give specifications on a property you would like to know more about.

**What you will find:**
* Address of the property
* Unit number (if applicable)
* Rent price
* How many beds/ baths
* Square footage
* If it is currently available
* The landlord information (if uploaded from Maine Pad Finder)
* The ability to leave a review on a property/ view reviews given to the property
   * Rate out of 5 stars
   * Leave feedback
* Next and Previous buttons to navigate through the other properties 

## API Documentation

### `POST /api/properties`

**Description:**
Return a list of properties matching the optional filter criteria

**Request body**
```
{
  "city": "Portland",     // optional, substring match on A.CITY
  "minRent": 800,         // optional, minimum rent
  "maxRent": 1800,        // optional, maximum rent
  "minBeds": 1,           // optional, minimum number of bedrooms
  "minBaths": 1           // optional, minimum number of bathrooms
}
```
All fields are optional. Missing or null fields are simply ignored

**Response body**
```
[
  {
    "id": 123,
    "title": "2 bed • 1 bath",   // or UNIT_LABEL from DB if present
    "rent": 1500,
    "beds": 2,
    "baths": 1,
    "canRent": true,
    "sqft": 900,
    "city": "Portland",
    "state": "ME",
    "addressLine1": "123 Main St",
    "addressLine2": null,
    "zipCode": "04101"
  }
]
```
An array of property objects shaped for the frontend

**Potential Erros:**

* 500 - internal server error

### `POST /api/property/deals`

**Description:** Return “best deal” properties based on how low their rent is relative to the city average

**Request body**
```
{
  "city": "Portland"    // optional, filter deals to a given city
}
```
If city is omitted or null, the endpoint will return deals across all cities

**Response body**
```
[
  {
    "id": 456,
    "title": "Studio • 1 bath",
    "rent": 900,
    "beds": 0,
    "baths": 1,
    "canRent": true,
    "sqft": 450,
    "city": "Portland",
    "state": "ME",
    "cityAvgRent": 1300,
    "rentPctOfCityAvg": 0.69
  }
]
```
Properties.jsx can use `cityAvgRent` and `rentPctOfCityAvg` to highlight how good the deal is

**Potential Errors:**

* 500 - internal server error

# Messages Usage Guide
The Messages page allows logged-in users to send and receive messages with other users by username. It relies on a valid session cookie (token) and the messaging endpoints in the Flask backend.

## Prerequisites and Setup 
The messages feature assumes the following are running:
* **Backend Flask API**
   * `http://localhost:5000`
   * Endpoints used:
       * `GET /api/me`,
       * `GET /api/messages/thread`
       * `POST /api/messages/send`
   * Session handling:
       * `POST /api/login` issues a token cookie for authenticated users
       * `@loginrequired` decorator validates token using `SESSIONS` table and exposes `g.user_id`
   * Relevent tables:
       * `USERS`
       * `MESSAGES`
       * `SESSIONS`
* **Frontend React and Vite**
   * Running at `http://localhost:5173`
   * The Messages page is implemented in Messages.jsx and available via your React Router
* **CORS**
   * configured and backend allows `http://localhost:5173`
   * Credentials (withCredentials: true) so the token cookie can be sent
## How To Use the Messages Page
**1. Login**
* Log into your account to access the messages page
* The backend sets a token cookie if login succeeds

**2. Load Conversation**
* Go back to the messages page and click load conversation if you would like to access a previous message thread
* The frontend calls `GET /api/messages/thread?otherUsername=<username>` with the token cookie attached 
* The backend validates the the session with `@login_required` and looks up the `USER_ID` by username
* It then returns all messages between the current user and that user, sorted by timestamp.

**3. Send a Message**
* Type your message text into the message input box
* Click “Send”
* The frontend calls `POST /api/messages/send`
* The backend validates the session with `@login_required`, resolves otherUsername to `RECIPIENT_ID` and inserts a new row into the MESSAGE table 
* A success message is shown when sent

## API Documentation

### `GET /api/me`

**Description:** Validate the current session and return basic profile info for the currently logged-in user

**Authentication:** Requires token cookie

**Successful Response**
```
{
  "user_id": 1,
  "username": "spriola",
  "email": "sophia.priola@maine.edu"
}
```
### `GET /api/messages/thread`

**Description:** Return the full conversation between logged in user and another user identified by username 

**Authentication:** Requires token `@login_required`

**Query Parameters:** otherUsername- the username of the other user in the conversation 

**Example Request:**
```
GET /api/messages/thread?otherUsername=spriola
Cookie: token=<session_token>
```
**Response:**
```
[
  {
    "msgId": 10,
    "text": "Hi, is this apartment still available?",
    "senderId": 1,
    "recipientId": 2,
    "senderUsername": "spriola",
    "sentAt": "2025-12-07T14:35:21.000000",
    "isMine": true
  },
  {
    "msgId": 11,
    "text": "Yes, it is! Do you want to schedule a tour?",
    "senderId": 2,
    "recipientId": 1,
    "senderUsername": "jdoe",
    "sentAt": "2025-12-07T14:36:05.000000",
    "isMine": false
  }
]
```
**Possible Errors:**

* 400 - missing otherUsername
* 404 - user not found
* 401 - not logged in/ invalid session

### `POST /api/messages/send`

**Description:** Send a message from the logged-in user to another user

**Authentication:** Requires token cookie `@login_required`

**Request Body:**
```
{
  "otherUsername": "spriola",
  "text": "Hi, I’m interested in your listing."
}
```
* otherUsername required
* text required

**Success Response:**
```
{
  "message": "Message sent"
}
```
**Possible Errors:**

* 400 - missing username or text
* 404 - recipient not found
* 401 - not logged in/ invalid session













  
