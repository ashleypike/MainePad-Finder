# Title: apartment_finder.py
# Authors: Ashley Pike and Sophia Priola
# This script uses Selenium and with a headless Firefox browser to scrape rental 
# listings from apartments.com and append unique listings into a CSV file 
# Output: A CSV file containing rows with:
# ["Street", "City", "State", "Zipcode", "Unit", "Rent", "Bedrooms", "Bathrooms", "Available"]

import time
import os
import csv
import re
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

# Run on Firefox in headless mode 
os.environ['MOZ_HEADLESS'] = '1'

# Create a Firefox webdriver instance for the main listings page
driver = webdriver.Firefox()

#oldDate will store rows that already exist in the destination CSV file 
oldData = []
#newData will store rows scraped in this run 
newData = []

# Get the output CSV path from the user 
while True:
    pathText = input("Enter the path of the destination file: ")

    # Ensure the file path ends with .csv
    if pathText.endswith(".csv"):
        break
    else:
        print("File destination does not end with .csv \n Retrying...")

# Use pathlib for easier path manipulation
fileName = Path(pathText)
# Create parent directories if they don't already exist 
fileName.parent.mkdir(parents=True, exist_ok=True)

# Load existing data from CSV so we don't duplicate rows 
with fileName.open("r", newline="", encoding="utf-8") as csvFile:
    reader = csv.reader(csvFile)
    for row in reader:
        # Skip the header row 
        if row[1] == "Street":
            continue
        else:
            oldData.append(row)
        

# URL to search results page 
search = input("Enter url to search listings from: ")
driver.get(search)

# urls will hold each unique listing detail page URL we find 
urls = []
next = None

# If the file had no existing data, create the header row for newData 
if not oldData:
    newData.append(["Street", "City", "State", "Zipcode", "Unit", "Rent", "SqFt", "Bedrooms", "Bathrooms", "Available"])


# Scrape all listing URLS by paging through search results 
while True:
    # Give page time to load results 
    time.sleep(3)

    # Find all links to the individual property pages 
    elems = driver.find_elements(By.CSS_SELECTOR, "a.property-link[href]")

    for listing in elems:
        url = listing.get_attribute("href")
        # Only add valid or unique URLS 
        if url and url not in urls:
            urls.append(url)

    try:
        # Try to find the next button to go to the next page of results 
        next = driver.find_element(By.CLASS_NAME, "next")
    except Exception:
        # If we can't find it we've reached the last page
        break

    # Click the next page 
    next.click()


print("Found", len(urls), "listings")
# Close the intial driver used for listing search pages 
driver.quit()

# Use a new webdriver for visiting each individual listing page 
listingDriver = webdriver.Firefox()

# Visiting each property URL and scrape the data 
for link in urls:
    listingDriver.get(link)

    # Click the button to show unavailable floor plans if exists 
    try:
        showUnavailable = listingDriver.find_element(By.CSS_SELECTOR, "button.js-showUnavailableFloorPlansButton")
        showUnavailable.click()
    except Exception:
        # If button is not present just continue without error 
        pass

    # Address block that contains street, city, state, zip
    address = listingDriver.find_element(By.CLASS_NAME, "propertyAddressContainer").text

    # Split on line breaks, remove "Property Website" if present 
    parts = address.split("\n")
    addressParts = [p.strip() for p in parts if p.strip() != "Property Website"]
    address = ' '.join(addressParts)

    # Remove everything after the zipcode 
    address = re.sub(r"(\d{5}).*$", r"\1", address)

    # Split by comma into [street, city, state + zip]
    addressParts = address.strip().split(",")

    # If the address format doesn't look right, skip this listing 
    if len(addressParts) > 3:
        continue

    # Separate out unit information if it is embedded in the street 
    streetParts = addressParts[0].strip().split("Unit")
    street = streetParts[0].strip()

    city = addressParts[1].strip()

    # Split the last part into state and zipcode separated by a space
    stateZip = addressParts[2].strip().split(" ")

    state = stateZip[0].strip()
    zipcode = stateZip[1].strip()

    # Check if several units or single property
    isSeveralListings = None
    unitBar = None

    try: 
        # This container only appears when there are multiple units or floor plans 
        unitBar = listingDriver.find_element(By.CSS_SELECTOR, "div#pricingView")
    except Exception:
        pass

    if unitBar:
        isSeveralListings = 1 # Multi unit property
    else:
        isSeveralListings = 0 # Single unit property 


    # Case 1: Multi units 
    if isSeveralListings == 1:
        
        # Active tab section that contains pricing info 
        section = listingDriver.find_element(By.CSS_SELECTOR, "div.tab-section.active")
        # Each container corresponds to a type of unit/floor plan 
        categoryContainers = section.find_elements(By.CSS_SELECTOR, "div.pricingGridItem.multiFamily.hasUnitGrid.v3.UnitLevel_var2")
        

        for container in categoryContainers:
            unitContainer = container.find_elements(By.CSS_SELECTOR, "li.unitContainer.js-unitContainerV3")

            # Carries texts such as how many beds and baths 
            details = container.find_element(By.CSS_SELECTOR, "span.detailsTextWrapper").text
            detailParts = details.split("\n")

            for unit in unitContainer:

                # Unit Number
                unitNum = unit.find_element(By.CSS_SELECTOR, "div.unitColumn.column span:not(.screenReaderOnly)").text.strip()

                # Rent Cost
                rent = unit.find_element(By.CSS_SELECTOR, "div.pricingColumn.column span:not(.screenReaderOnly)").text.strip()
                rent = rent.replace("$", "")
                rent = rent.replace(",", "")
                try:
                    rent = int(rent)
                except ValueError:
                    # If rent is not a clear integer, store none 
                    rent = None
                
                # SqFt
                sqft = unit.find_element(By.CSS_SELECTOR, "div.sqftColumn.column span:not(.screenReaderOnly)").text.strip()
                sqft = sqft.replace(",", "")
                try:
                    sqft = int(sqft)
                except ValueError:
                    sqft = None

                # Bedrooms
                bedrooms = detailParts[0].strip()
                if bedrooms == "Studio":
                    # Represents "Studio" as 0 bedrooms 
                    bedrooms = 0
                else:
                    bedroomSplit = bedrooms.split(" ")
                    try:
                        bedrooms = float(bedroomSplit[0])
                    except ValueError:
                        bedrooms = None

                # Bathroom
                bathrooms = detailParts[1].strip()
                bathroomSplit = bathrooms.split(" ")
                try:
                    bathrooms = float(bathroomSplit[0])
                except ValueError:
                    bathrooms = None
                
                
                # Available to Rent
                available = unit.find_element(By.CSS_SELECTOR, "div.availableColumn.column span:not(.screenReaderOnly)").text.strip()
                # Convert availability text to numeric flag 
                if available.lower == "now" or available.lower == "available now":
                    available = 1
                else:
                    available = 0

                # Build a row for this unit 
                singleListing = [street, city, state, zipcode, unitNum, rent, sqft, bedrooms, bathrooms, available]
                # Skip rows that have no unit, rent, sqft info 
                if not singleListing[4] and not singleListing[5] and not singleListing[6]:
                    continue
                    # Only append if the row is not in newData or oldData 
                if singleListing not in newData and singleListing not in oldData:
                    newData.append(singleListing)



    # Case 2: Single property listing 
    elif isSeveralListings == 0:

        # Check if contains unit number
        try:
            unitNum = streetParts[1].strip()
        except Exception:
            # If nothing appears unitNum will remain ignored 
            pass

        # Rent Cost for single property listings 
        rentContainer  = listingDriver.find_element(By.CSS_SELECTOR, "div#propertyNameRow.propertyNameRow")
        rentText = rentContainer.text

        # Remove caption or text that is not part of rent number 
        unwantedText = rentContainer.find_element(By.CSS_SELECTOR, "span.display-name-caption").text
        rentText = rentText.replace(unwantedText, "").strip()

        rentText = rentText.replace("$", "")
        rentText = rentText.replace(",", "")
        try:
            rent = int(rentText)
        except ValueError:
            rent = None

        # This container holds info for square feet, bedrooms, bathrooms and availability 
        details = listingDriver.find_element(By.CSS_SELECTOR, "div.priceBedRangeInfoContainer")

        # Each li.column holds a label + detail pair
        detailParts = details.find_elements(By.CSS_SELECTOR, "li.column")

        # Initialize variables that will be filled from the sections below
        for section in detailParts:
            if section.find_element(By.CSS_SELECTOR, "p.rentInfoLabel").text == "Square Feet":
                sqftText = section.find_element(By.CSS_SELECTOR, "p.rentInfoDetail").text.strip()
            if section.find_element(By.CSS_SELECTOR, "p.rentInfoLabel").text == "Bedrooms":
                bedrooms = section.find_element(By.CSS_SELECTOR, "p.rentInfoDetail").text.strip()
            if section.find_element(By.CSS_SELECTOR, "p.rentInfoLabel").text == "Bathrooms":
                bathrooms = section.find_element(By.CSS_SELECTOR, "p.rentInfoDetail").text.strip()
            if section.find_element(By.CSS_SELECTOR, "p.rentInfoLabel").text == "Available":
                available = section.find_element(By.CSS_SELECTOR, "p.rentInfoDetail").text.strip()


        # SqFt: Clear comma and take in the first numeric part 
        sqftText = sqftText.replace(",", "")
        sqftParts = sqftText.split(" ")
        try:
            sqft = int(sqftParts[0])
        except ValueError:
            sqft = None

        # Bedrooms: convert to float if possible 
        try:
            bedrooms = float(bedrooms)
        except ValueError:
            bedrooms = None

        # Bathrooms: convert to float if possible 
        try:
            bathrooms = float(bathrooms)
        except ValueError:
            bathrooms = None

        # Available to Rent: map to 0 or 1 
        if available.lower == "now" or available.lower == "available now":
            available = 1
        else:
            available = 0

        #Build the row for this single listing 
        singleListing = [street, city, state, zipcode, unitNum, rent, sqft, bedrooms, bathrooms, available]
        # Skip rows with missing values 
        if not singleListing[4] and not singleListing[5] and not singleListing[6]:
            continue
            # Avoid duplicate rows 
        if singleListing not in newData and singleListing not in oldData:
            newData.append(singleListing)

# Close the listing detail driver 
listingDriver.quit()

print("Finished with scraping")

# Append all new scraped data rows to the CSV file 
with fileName.open("a", newline="", encoding="utf-8") as csvFile:
    writer = csv.writer(csvFile)
    writer.writerows(newData)

print("Finished writing to CSV file")
