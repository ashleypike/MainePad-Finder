import csv
import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv("../.env")

db = mysql.connector.connect(
    host = os.getenv("DB_HOST"),
    user = os.getenv("DB_USER"),
    password = os.getenv("DB_PASSWORD"),
    database = os.getenv("DB_NAME")
)
cursor = db.cursor()

csv_file = "./Web Scraping/Sample Data/apartments-properties.csv"

with open(csv_file, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Define a helper function to safely convert strings to the desired type or None
        def safe_convert(key, target_type):
            value = row.get(key)
            # Check if the value is an empty string or None (from a missing key)
            if not value:
                return None
            try:
                # Attempt to convert to the target type (int or float)
                return target_type(value)
            except ValueError:
                # Handle cases where the string isn't a valid number (e.g., "N/A")
                return None
        cursor.callproc("ADD_PROPERTY", [
            row['Street'],                      # P_STREET
            row['City'],                        # P_CITY
            row['State'],                       # P_STATE_CODE
            row['Zipcode'],                     # P_ZIP
            row['Unit'],                        # P_UNIT_LABEL
            safe_convert('Rent', int),          # P_RENT_COST
            safe_convert('SqFt', int),          # P_SQFT
            safe_convert('Bedrooms', float),    # P_BEDROOMS
            safe_convert('Bathrooms', float),   # P_BATHROOMS
            safe_convert('Available', int)      # P_CAN_RENT
        ])

db.commit()
cursor.close()
db.close()