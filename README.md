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
   * Base URL: http://localhost:5000
   * Endpoints used: POST /api/properties and POST /api/property/deals
   * Environment details configured: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
   * MySQL database contains: PROPERTY and ADDRESS tables, BEST_DEAL_PROPERTIES view
* **Frontend React and Vite**
  * Base URL: http://localhost:5173
  * Start with 
```
npm install
npm run dev
```
   * The app should render the Properties page at its configured route (e.g. /properties or your home page, depending on your router)
* **CORS/COOKIES**
   * The backend enables CORS for http://localhost:5173 and allows credentials so that cookies and sessions can be used if needed
## How To Use Properties Page
**1. Open the page**
* Navigate to the Properties page in the React app (e.g. click “Search Properties” in the navigation bar).

**2. Set filters (this is optional)**
* City (e.g., Portland)
* Min/ Max Rent (e.g., 800 to 1000)
* Min Beds/ Min Baths
  
**3. Run search**
* Click the "Apply filters", "No filters" or "Find me deals!" button depending on what you're looking for
* This sends a request with null filters so the backend can return a broader set of properties.

**4. View the best deals**
* Optionally click "Find me deals!" to call POST /api/properties/deals
* This shows all properties below the average rent in a given city

**5. Click a property to bring you to the listing page**
* Click on a property you are interested in to give more specifications such as landlord, reviews and more on the listing page




  
