import time
import os
import csv
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

os.environ['MOZ_HEADLESS'] = '1'

driver = webdriver.Firefox()
search = input("Enter url to search listings from: ")
driver.get(search)

urls = []
next = None

listingData = []
listingData.append(["Street", "City", "State", "Zipcode", "Unit", "Rent", "SqFt", "Bedrooms", "Bathrooms", "Available"])



while True:
    time.sleep(3)
    elems = driver.find_elements(By.CSS_SELECTOR, "a.property-link[href]")

    for listing in elems:
        url = listing.get_attribute("href")
        if url and url not in urls:
            urls.append(url)
            print("Found", url)
            # Testing
            break
    try:
        next = driver.find_element(By.CLASS_NAME, "next")
    except Exception:
        break

    next.click()


print("Found", len(urls), "listings")
driver.quit()


for link in urls:
    listingDriver = webdriver.Firefox()
    listingDriver.get(link)

    # Address
    address = listingDriver.find_element(By.CLASS_NAME, "propertyAddressContainer").text

    parts = address.split("\n")
    addressParts = [p.strip() for p in parts if p.strip() != "Property Website"]
    address = ' '.join(addressParts)

    addressPieces = address.split(",")
    street = addressPieces[0].strip()
    city = addressPieces[1].strip()

    stateZip = addressPieces[2].strip().split(" ")

    state = stateZip[0].strip()
    zipcode = stateZip[1].strip()



    # Check if several units or single property
    isSeveralListings = 0
    unitBar = None

    try: 
        unitBar = listingDriver.find_element(By.ID, "pricingView")
        isSeveralListings = 1
    except Exception:
        isSeveralListings = 0


    # Units 
    if isSeveralListings == 1:
        
        section = listingDriver.find_element(By.CSS_SELECTOR, "div.tab-section.active")
        categoryContainers = section.find_elements(By.CSS_SELECTOR, "div.pricingGridItem.multiFamily.hasUnitGrid.v3.UnitLevel_var2")
        

        for container in categoryContainers:
            unitContainer = container.find_elements(By.CSS_SELECTOR, "li.unitContainer.js-unitContainerV3")

            details = container.find_element(By.CSS_SELECTOR, "span.detailsTextWrapper").text
            detailParts = details.split("\n")

            for unit in unitContainer:

                # Unit Number
                unitNum = unit.find_element(By.CSS_SELECTOR, "div.unitColumn.column span:not(.screenReaderOnly)").text.strip()

                # Rent Cost
                rent = unit.find_element(By.CSS_SELECTOR, "div.pricingColumn.column span:not(.screenReaderOnly)").text.strip()
                rent = rent.replace("$", "")
                rent = rent.replace(",", "")
                rent = int(rent)
                
                # SqFt
                sqft = unit.find_element(By.CSS_SELECTOR, "div.sqftColumn.column span:not(.screenReaderOnly)").text.strip()
                sqft = sqft.replace(",", "")
                sqft = int(sqft)

                # Bedrooms
                bedrooms = detailParts[0].strip()
                if bedrooms == "Studio":
                    bedrooms = 0
                else:
                    bedroomSplit = bedrooms.split(" ")
                    bedrooms = int(bedroomSplit[0])

                # Bathroom
                bathrooms = detailParts[1].strip()
                bathroomSplit = bathrooms.split(" ")
                bathrooms = int(bathroomSplit[0])
                
                
                # Available to Rent
                available = unit.find_element(By.CSS_SELECTOR, "div.availableColumn.column span:not(.screenReaderOnly)").text.strip()
                if available.lower == "now":
                    available = 1
                else:
                    available = 0

                # Append to data array
                singleListing = [street, city, state, zipcode, unitNum, rent, sqft, bedrooms, bathrooms, available]
                if singleListing not in listingData:
                    listingData.append(singleListing)

                listingDriver.quit()
                

         # Individual Houses
        if isSeveralListings == 0:

        # No specific unit number since whole property 
            unitNum = ""

        # Rent Cost
        rentText = listingDriver.find_element(By.XPATH, "(//*[contains(text(), '$')])[1]").text.strip()
        rentText = rentText.replace("$", "").replace(",", "")
        rentText = rentText.split("-")[0].strip()
        rent = int(rentText)

        # SqFt
        sqftText = listingDriver.find_element(
            By.XPATH,
            "(//*[contains(text(), 'sqft') or contains(text(), 'Sq Ft')])[1]"
        ).text
        sqftText = sqftText.replace(",", "")
        sqftParts = sqftText.split(" ")
        sqft = int(sqftParts[0])

        # Bedrooms
        bedsText = listingDriver.find_element(
            By.XPATH,
            "(//*[contains(text(), 'Bed') or contains(text(), 'Studio')])[1]"
        ).text.strip()
        if "Studio" in bedsText:
            bedrooms = 0
        else:
            bedParts = bedsText.split(" ")
            bedrooms = int(bedParts[0])

        # Bathrooms
        bathsText = listingDriver.find_element(
            By.XPATH,
            "(//*[contains(text(), 'Bath')])[1]"
        ).text.strip()
        bathParts = bathsText.split(" ")
        bathrooms = int(bathParts[0])

        # Available to Rent
        availableText = listingDriver.find_element(
            By.XPATH,
            "(//*[contains(text(), 'Available') or contains(text(), 'Now')])[1]"
        ).text.strip()
        if availableText.lower() == "now" or "available now" in availableText.lower():
            available = 1
        else:
            available = 0

        #Append to data array 
        singleListing = [street, city, state, zipcode, unitNum, rent, sqft, bedrooms, bathrooms, available]
        if singleListing not in listingData:
            listingData.append(singleListing)

        listingDriver.quit()



print("Finished with scraping")

pathText = input("Enter the path of the destination file: ")

fileName = Path(pathText)
fileName.parent.mkdir(parents=True, exist_ok=True)

with fileName.open("w", newline="", encoding="utf-8") as csvFile:
    writer = csv.writer(csvFile)
    writer.writerows(listingData)

print("Finished writing to CSV file")