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
   * Endpoints used: `POST /api/properties` and `POST /api/property/deals`
   * Environment details configured: `DB_HOST, DB_USER, DB_PASSWORD, DB_NAME`
   * MySQL database contains: `PROPERTY` and `ADDRESS` tables, `BEST_DEAL_PROPERTIES` view
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










  
