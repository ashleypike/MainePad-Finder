# MainePad-Finder

MainePad-Finder is a housing search application designed for Maine University students.  
This repo contains the MySQL schema, stored procedures, functions, example queries used to power the backend database and web scraping.

## Table of Contents
### [Phase 2](https://github.com/TheHylianLegend/MainePad-Finder/tree/31b1e6cc412722f1852190fb40a6aed6102b8990/Phase2)
- [Database Operations](https://github.com/TheHylianLegend/MainePad-Finder/tree/19730709c2f13f61e2ca7c048f4cf8d0a0ef73b6/SQL/Database%20Operations)
- [Functions and Triggers](https://github.com/TheHylianLegend/MainePad-Finder/tree/eee682a69575a481f1f8e054e3cba5e1c1ad4b6f/SQL/Functions%20and%20Triggers)
- [Procedures](https://github.com/TheHylianLegend/MainePad-Finder/tree/a4490b922041a059fa0d3d9b2e3b999a13bf756c/SQL/Procedures)
- [Queries](https://github.com/TheHylianLegend/MainePad-Finder/tree/a4490b922041a059fa0d3d9b2e3b999a13bf756c/SQL/Queries)
- [Schema](https://github.com/TheHylianLegend/MainePad-Finder/tree/d904d043b3eefd0edae78c96804e5b9c87fde6d6/SQL/Schema)
- [Web Scrapping](https://github.com/TheHylianLegend/MainePad-Finder/tree/8bafe7d42b547937af652c0d24926ee43190c9c0/Web%20Scraping)
### [Running MySQL Files](#running-mysql-files)
### [Web Scraping Scripts](https://github.com/TheHylianLegend/MainePad-Finder/blob/main/SQL/README.md#web-scraping-scripts-1)
### [Query Optimization & Indexing](https://github.com/TheHylianLegend/MainePad-Finder/blob/f0630a96c62677d41b0316703b422859964cafe5/SQL/Queries/Query%20Optimization%20%26%20Indexing.md)
## Running MySQL Files

### Overview
Create database using designated MySQL files from "Database Operations", "Procedures" and "Functions and Triggers" folders. Verify your database is functioning accordingly by using an example query from the "Queries" folder. 

### Installation and Requirements 
- [MySQL Community Server](https://dev.mysql.com/downloads/mysql/8.0.html) installed 
- [MySQL Workbench](https://dev.mysql.com/downloads/workbench/)
- A MySQL account that allows you to create databases and tables 

### How To Run MySQL Workbench
1. Open **MySQL Workbench** and connect to your local server
2. Create database by pasting:
```sql
CREATE DATABASE IF NOT EXISTS MAINEPAD
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE MAINEPAD;
```
3. For every file in the designated "Files Order" below, go to **File -> Open SQL Script**
4. Select each file one at a time and upload
5. Click the lightning bolt to execute 
6. To verify the database is running correctly, upload and run queries from the "queries" file

### Files Order
1. **Database Operations**
```sql
- Create_Database.sql
- ALL_TABLE.sql
- ADD_INDEXES.sql
```
2. **Procedure, Function and Trigger Files**
```sql
- ADD_PROPERTY.sql
- INSERT_MATCH.sql
- INSERT_USER.sql
- SEND_MESSAGE.sql
- SEND_NOTIFICATION.sql
- SUBMIT_REVIEW.sql
- GET_AVG_RATING.sql
- UPDATE_PROPERTY_RATING.sql
```
3. **Query Files**
```sql
- TEST_RENT_ADDR_PROPERTY.sql
- FIND_TOP_RATED_PROPS_IN_CITY.sql
```

## Web Scraping Scripts

### Overview

Several Python-based web scraping scripts have been designed in order to populate the _MainePad Finder_ application with pertinent real-world address and property data. `apartment_finder.py` (designed by Sophia Priola and Ashley Pike) retrieves property information from Apartments.com, while `Fosgate_ZillowScraper.py` (designed by Jeffrey Fosgate and Yunlong Li) retrieves property information from Zillow. Property and address information shall be returned in a comma-separated variable (CSV) format. See _Web Scraper Documentation_ files (mentioned below) for additional details on each individual web scraper design.

### Files

All files pertaining to _MainePad Finder_ web scraping functionalities can be found within the directory `MainePad-Finder/Phase2/Web Scraping`. The files contained within this directory are further differentiated below.

#### Web Scraping Scripts

There are two Python scripts included which provide the primary web scraping functionality needed for retrieving real-world sample address and property data. These scripts include:

```
- apartment_finder.py
- Fosgate_ZillowScraper.py
```

#### Sample Data

Several CSV files have already been provided, showcasing some sample data retrieved during tests of the web scraper conducted by the _MainePad Finder_ development team. This sample data is provided by:

```
- apartments-properties.csv
- zillow-properties.csv
```

`apartments-properties.csv` provides the output received from `apartment_finder.py` (Apartments.com), while `zillow-properties.csv` provides the output received from `Fosgate_ZillowScraper.py` (Zillow).

#### Web Scraper Documentation

Documentation has been provided to further elaborate upon the design of each web scraper and the steps taken to sanitize the data retrieved. This documentation is provided by:

```
- Data_Scraping_Documentation__Zillow.pdf
- Web_Scraping_Documentation_Apartments.com.pdf
- Data_Cleaning_Documentation_Apartments.com.pdf
```

### Running Web Scraping Scripts

#### Installations and Requirements

**[An installation of Python](https://www.python.org/downloads/)** is required for running both web scraping scripts. **A release of Python at or above release version 3.5 is highly recommended** for supporting all libraries used within the scripts.

Once Python has been installed on your system, the following Python utility and library downloads will be required. Commands for installation provided here are assumed to be executed within your Python version's current directory.

- **`pip`**: `python get-pip.py`
- **`BeautifulSoup4`**: `python -m pip install bs4`
- **`Selenium`**: `python -m pip install selenium`

#### Script Execution

Both web scraping files can be executed identically to any other basic Python file. Assuming that your Python version and your web scraper of choice are located within the same directory, this can be done with the commands

```python
python Fosgate_ZillowScraper.py
python apartment_finder.py
```

See the respective documentation provided for both web scrapers for additional information on the precise directory and format in which the resulting property output will be provided.

## Team 
### Ashley Pike
### Jeffrey Fosgate
### Sophia Priola
### Yunlong Li 

