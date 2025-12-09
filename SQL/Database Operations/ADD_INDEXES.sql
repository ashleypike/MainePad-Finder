-- Similar to usernames, emails are often used for login and password recovery and must be unique.
-- Using this as an index avoids doing a full table scan and making existence checks and lookups much faster.
CREATE INDEX IDX_EMAIL ON USERS(EMAIL);

-- Our application supports queries that filter properties by a maximum or minimum rent amount.
-- Without an index, MySQL would need to scan every property to check its rent.
-- The 'IDX_RENT_ADDR' index allows MySQL to perform a scan based on a range on RENT_COST, 
-- reading only the relevant portion of the index instead of the entire table.
-- Including 'ADDR_ID' and 'PROPERTY_ID' allows queries to access these often used values without having to read the full table row, which increases performance.
CREATE INDEX IDX_RENT_ADDR ON PROPERTY(RENT_COST, ADDR_ID, PROPERTY_ID);

-- Such as the previous index, indexing TIME_STAMP allows MySQL to efficiently sort and limit the result set to the
-- newest messages, improving performance.
CREATE INDEX IDX_MESSAGE_TIMESTAMP ON MESSAGE(TIME_STAMP);

-- Many MainePad-Finder queries filter properties by city, especially our optimized "Top-rated properties in a city" query we show as an example. 
-- By indexing ADDRESS(CITY), MySQL can quickly locate all addresses in a given city using the index instead of scanning the full ADDRESS table.
-- This index is critical for efficiently supporting searches that are city based.
CREATE INDEX IDX_CITY ON ADDRESS(CITY);

-- When users filter on min beds and min baths, this index lets MySQL quickly find the subset instead of checking every row
CREATE INDEX IDX_PROPERTY_BEDS_BATHS ON PROPERTY (BEDROOMS, BATHROOMS);

-- Helps join PROPERTY to ADDRESS, filter by CAN_RENT and RENT_COST
CREATE INDEX IDX_PROPERTY_ADDR_CANRENT_RENT ON PROPERTY (ADDR_ID, CAN_RENT, RENT_COST);

-- Improves performance when logging out or checking if user has previous session
CREATE INDEX IDX_SESSIONS_USER ON SESSIONS(USER_ID);

-- Improves performance when removing expired sessions
CREATE INDEX IDX_SESSIONS_EXPIRES ON SESSIONS(EXPIRES_AT);

