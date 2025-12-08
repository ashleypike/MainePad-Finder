-- TITLE: REVIEW.sql
-- AUTHOR: Sophia Priola
-- Table creation of review
-- Revised: 12/08/25

CREATE TABLE IF NOT EXISTS REVIEW (
    USER_ID INT UNSIGNED,                      -- user who wrote the review
    PROPERTY_ID INT UNSIGNED,                  -- property being reviewed
    COMMENTS VARCHAR(1000),                    -- Optional comments
    STARS DECIMAL(2,1) UNSIGNED NOT NULL,      -- Star rating 1.0 - 5.0

    CHECK (STARS BETWEEN 1 AND 5),

    -- Composite primary key: each user can review a property at most once
    PRIMARY KEY (USER_ID, PROPERTY_ID),
    -- Foreign key USER_ID from USERS
    FOREIGN KEY (USER_ID)
        REFERENCES USERS (USER_ID),
    -- Foreign key PROPERTY_ID from PROPERTY 
    FOREIGN KEY (PROPERTY_ID)
        REFERENCES PROPERTY (PROPERTY_ID)
);
