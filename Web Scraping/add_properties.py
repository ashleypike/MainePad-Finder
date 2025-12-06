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

csv_file = "./Sample Data/apartments-properties.csv"

with open(csv_file, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        cursor.callproc("ADD_PROPERTY", [
            row['street'],           # P_STREET
            row['city'],             # P_CITY
            row['state'],            # P_STATE_CODE
            row['zip'],              # P_ZIP
            row['unit_label'],       # P_UNIT_LABEL
            int(row['rent_cost']),   # P_RENT_COST
            int(row['sqft']),        # P_SQFT
            float(row['bedrooms']),  # P_BEDROOMS
            float(row['bathrooms']), # P_BATHROOMS
            int(row['can_rent'])     # P_CAN_RENT
        ])

db.commit
cursor.close
db.close