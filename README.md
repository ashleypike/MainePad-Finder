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