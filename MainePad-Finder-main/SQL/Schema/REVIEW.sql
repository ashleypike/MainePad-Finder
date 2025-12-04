-- TITLE: REVIEW.sql
-- AUTHOR: Sophia Priola
-- Table creation of review

CREATE TABLE IF NOT EXISTS REVIEW (
    USER_ID INT UNSIGNED PRIMARY KEY,     -- Unique user ID 
    PROPERTY_ID INT UNSIGNED PRIMARY KEY,    -- Unique property ID 
    COMMENTS VARCHAR(1000),    -- Optional comments made by user 
    STARS FLOAT(2, 1) UNSIGNED NOT NULL,    -- Star rating 0-5
    CHECK (STARS BETWEEN 1 AND 5),    
    -- Foreign key USER_ID from USER
    -- Foreign key PROPERTY_ID from PROPERTY 
    FOREIGN KEY (USER_ID)
        REFERENCES USERS (USER_ID),
    FOREIGN KEY (PROPERTY_ID)
        REFERENCES PROPERTY (PROPERTY_ID)
);
