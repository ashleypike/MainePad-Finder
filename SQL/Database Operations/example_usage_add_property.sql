SET @NEW_PROPERTY_ID = NULL;

CALL ADD_PROPERTY(
    123,                 -- P_LANDLORD_ID
    '123 Main St',       -- P_STREET
    'Portland',          -- P_CITY
    4101,                -- P_ZIP
    1850,                -- P_RENT_COST
    4.5,                 -- P_PROPERTY_RATING
    2,                   -- P_BEDS
    1,                   -- P_BATHROOMS
    3,                   -- P_APT_NUM
    TRUE,                -- P_CAN_RENT
    @NEW_PROPERTY_ID     -- OUT：GET NEW PROPERTY_ID
);

SELECT @NEW_PROPERTY_ID AS NEW_PROPERTY_ID;
SELECT * FROM ADDRESS ORDER BY 1 DESC LIMIT 1;
SELECT * FROM PROPERTY WHERE PROPERTY_ID = @NEW_PROPERTY_ID;
