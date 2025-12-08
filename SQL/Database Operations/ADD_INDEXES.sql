-- We expect the application to frequently look up a user by their username (e.g., login, profile lookup). 
-- Without this index, queries such as profile searches would require scanning the entire USERS table.
CREATE INDEX IDX_USERNAME ON USERS(USERNAME);

-- Similar to usernames, emails are often used for login and password recovery and must be unique.
-- Using this as an index avoids doing a full table scan and making existence checks and lookups much faster.
CREATE INDEX IDX_EMAIL ON USERS(EMAIL);

-- Display names are used for searching.
-- For example you can search for users whos display name starts with "Jeff".
-- An index on DISPLAY_NAME allows MySQL to efficiently seek into the range of matching names instead of scanning every row.
CREATE INDEX IDX_DISPLAY_NAME ON USERS(DISPLAY_NAME);

-- Some queries may filter users by age or birthdate range if it is a roomate preference. 
-- Indexing 'BIRTH_DATE' lets MySQL use a range scan on the date column, which is much more efficient than scanning all users when we need to select only a subset by birthdate.
CREATE INDEX IDX_BIRTHDATE ON USERS(BIRTH_DATE);


-- Our application supports queries that filter properties by a maximum or minimum rent amount.
-- Without an index, MySQL would need to scan every property to check its rent.
-- The 'IDX_RENT_ADDR' index allows MySQL to perform a scan based on a range on RENT_COST, 
-- reading only the relevant portion of the index instead of the entire table.
-- Including 'ADDR_ID' and 'PROPERTY_ID' allows queries to access these often used values without having to read the full table row, which increases performance.
CREATE INDEX IDX_RENT_ADDR ON PROPERTY(RENT_COST, ADDR_ID, PROPERTY_ID);

-- Indexing TIME_STAMP helps MySQL efficiently find the most recent notifications for a 
-- user without scanning all older rows, which is important as the amount of notifications grow.
CREATE INDEX IDX_NOTIFICATION_TIMESTAMP ON NOTIFICATION(TIME_STAMP);


-- Such as the previous index, indexing TIME_STAMP allows MySQL to efficiently sort and limit the result set to the
-- newest messages, improving performance.
CREATE INDEX IDX_MESSAGE_TIMESTAMP ON MESSAGE(TIME_STAMP);

-- Many MainePad-Finder queries filter properties by city, especially our optimized "Top-rated properties in a city" query we show as an example. 
-- By indexing ADDRESS(CITY), MySQL can quickly locate all addresses in a given city using the index instead of scanning the full ADDRESS table.
-- This index is critical for efficiently supporting searches that are city based.
CREATE INDEX IDX_CITY ON ADDRESS(CITY);
