-- NAME: ADD_PROP_PRICE_HISTORY.sql
-- AUTHOR: Jeffrey Fosgate
-- COMMIT DATE: December 6, 2025
-- DESCRIPTION: A simple SQL trigger that adds a new listing to the PROP_PRICE_HISTORY table whenever a property is updated.                

DELIMITER //

CREATE TRIGGER ADD_PROP_PRICE_HISTORY
BEFORE UPDATE
ON PROPERTY
FOR EACH ROW
BEGIN
    INSERT INTO PROP_PRICE_HISTORY (PROPERTY_ID, RENT_COST)
    VALUES (NEW.PROPERTY_ID, NEW.RENT_COST); -- Duplicate listings are not allowed on MySQL by default, so this will have no effect if the property's price isn't updated.
END //

DELIMITER ;


-- TITLE: Fosgate_GET_AVG_RATING
-- AUTHOR: Jeffrey Fosgate
-- DATE OF GITHUB COMMIT: 11/5/2025
-- A simple stored function for calculating the average rating of a property. Returns NULL when no entries exist.alter
-- Several queries used for testing the accuracy of this function have been commented out and can be un-commented to demonstrate the command's efficacy.
DELIMITER $$
CREATE FUNCTION GET_AVG_RATING (PROP_ID INT)
RETURNS FLOAT(2,1)
DETERMINISTIC
BEGIN
	DECLARE AVG_STARS FLOAT(2,1);
    -- Uncomment the line below if REVIEW_RATINGTEST is uncommented for testing purposes.
    -- SELECT AVG(STARS) INTO AVG_STARS FROM REVIEW_RATINGTEST WHERE PROPERTY_ID = PROP_ID;
	SELECT AVG(STARS) INTO AVG_STARS FROM REVIEW WHERE PROPERTY_ID = PROP_ID;
    RETURN AVG_STARS;
END$$
DELIMITER ;


-- TITLE: UPDATE_PROPERTY_RATING
-- AUTHOR: Sophia Priola 
-- Whenever a new review is inserted, this trigger recalculates the avg star rating
-- and updates the property rating 

CREATE TRIGGER UPDATE_PROPERTY_RATING
AFTER INSERT ON REVIEW
FOR EACH ROW        -- Execute once for each inserted review row
UPDATE PROPERTY
SET PROPERTY_RATING = (        -- Recompute the properties avg rating 
    SELECT AVG(STARS)
    FROM REVIEW
    WHERE PROPERTY_ID = NEW.PROPERTY_ID
)
WHERE PROPERTY_ID = NEW.PROPERTY_ID;    -- update the matching PROPERTY row



-- TITLE: ADD_PROPERTY
-- AUTHOR: Ashley Pike
-- Takes the input values and checks if the address is new and if so inserts into address table
-- Checks if property is new and if so inserts into properties table
DELIMITER $$

CREATE PROCEDURE ADD_PROPERTY (
    IN P_STREET VARCHAR(200),
    IN P_CITY VARCHAR(100),
    IN P_STATE_CODE CHAR(2),
    IN P_ZIP CHAR(5),
    IN P_UNIT_LABEL VARCHAR(50),
    IN P_RENT_COST INT,
    IN P_SQFT INT UNSIGNED,
    IN P_BEDROOMS FLOAT(2,1),
    IN P_BATHROOMS FLOAT(2,1),
    IN P_CAN_RENT TINYINT(1)
)
BEGIN
    DECLARE V_ADDR_ID INT;
    DECLARE P_PROPERTY_ID INT;

    -- Check if the address exists
    SELECT ADDR_ID INTO V_ADDR_ID
    FROM ADDRESS
    WHERE STREET = P_STREET
      AND CITY = P_CITY
      AND STATE_CODE = P_STATE_CODE
      AND ZIPCODE = P_ZIP
    LIMIT 1;

    -- If not, insert a new address
    IF V_ADDR_ID IS NULL THEN
        INSERT INTO ADDRESS (STREET, CITY, STATE_CODE, ZIPCODE)
        VALUES (P_STREET, P_CITY, P_STATE_CODE, P_ZIP);
        SET V_ADDR_ID = LAST_INSERT_ID();
    END IF;

    -- Check if the property exists
    SELECT PROPERTY_ID INTO P_PROPERTY_ID
    FROM PROPERTY
    WHERE ADDR_ID = V_ADDR_ID
      AND UNIT_LABEL = P_UNIT_LABEL
    LIMIT 1;

    IF P_PROPERTY_ID IS NULL THEN
        -- Insert property
        INSERT INTO PROPERTY (
            UNIT_LABEL, RENT_COST, PROPERTY_RATING, LANDLORD_ID, 
            SQFT, BATHROOMS, BEDROOMS, CAN_RENT, ADDR_ID
        ) VALUES (
            P_UNIT_LABEL, P_RENT_COST, NULL, NULL,
            P_SQFT, P_BATHROOMS, P_BEDROOMS, P_CAN_RENT, V_ADDR_ID
        );
        SET P_PROPERTY_ID = LAST_INSERT_ID();
    END IF;
END$$

DELIMITER ;



-- TITLE: Fosgate_ADD_MATCH
-- AUTHOR: Jeffrey Fosgate
-- DATE OF GITHUB COMMIT: 11/5/2025
-- A simple stored procedure for creating a new entry matching two roommates together.

DELIMITER $$
CREATE PROCEDURE ADD_MATCH (
    IN M_RENTER_ID INT UNSIGNED,
    IN M_CONNECTION_ID INT UNSIGNED
)
BEGIN
	INSERT INTO INTERUSER(RENTER_ID, CONNECTION_ID)
    VALUES (M_RENTER_ID, M_CONNECTION_ID);
END $$



-- TITLE: INSERT_USER
-- AUTHOR: Ashley Pike
-- A simple stored procedure for inserting given values into a new user instance

DELIMITER $$

-- TITLE: INSERT_USER
-- AUTHOR: Ashley Pike
-- A simple stored procedure for inserting given values into a new user instance

DELIMITER $$

CREATE PROCEDURE INSERT_USER (
    -- Variables to be included
    IN p_USERNAME VARCHAR(50),
   	IN p_PASS_WORD VARCHAR(50),
	IN p_EMAIL VARCHAR(100),
    IN p_PHONE_NUMBER VARCHAR(20),
    IN p_GENDER CHAR(1),
    IN p_BIRTH_DATE DATE,
    IN p_DISPLAY_NAME VARCHAR(200),
    IN p_USER_TYPE VARCHAR(10)
)
BEGIN
    DECLARE p_USER_ID INT;

    -- Inserting values
    INSERT INTO USERS (USERNAME, PASS_WORD, EMAIL, PHONE_NUMBER, GENDER, BIRTH_DATE, DISPLAY_NAME)
    VALUES (p_USERNAME, p_PASS_WORD, p_EMAIL, p_PHONE_NUMBER, p_GENDER, p_BIRTH_DATE, p_DISPLAY_NAME);

    SET p_USER_ID = LAST_INSERT_ID();

    IF p_USER_TYPE = 'Renter' THEN
        INSERT INTO RENTER (USER_ID)
        VALUES (p_USER_ID);

        INSERT INTO RENTER_SETTINGS (USER_ID)
        VALUES (p_USER_ID);
    ELSEIF p_USER_TYPE = 'Landlord' THEN
        INSERT INTO LANDLORD (USER_ID)
        VALUES (p_USER_ID);
    END IF;

END$$

DELIMITER ;



-- TITLE: INSERT_SESSION
-- AUTHOR: Ashley Pike
-- Creates session for authentication when user logs in

DELIMITER $$

CREATE PROCEDURE INSERT_SESSION (
    IN p_TOKEN VARCHAR(128),
    IN p_USER_ID INT,
    IN p_CREATED_AT DATETIME,
    IN p_EXPIRES_AT DATETIME
)
BEGIN

    -- Remove any previous sessions for this user
    DELETE FROM SESSIONS WHERE USER_ID = p_USER_ID;

    -- Remove duplicate tokens just in case
    DELETE FROM SESSIONS WHERE TOKEN = p_TOKEN;

    INSERT INTO SESSIONS (TOKEN, USER_ID, CREATED_AT, EXPIRES_AT)
    VALUES (p_TOKEN, p_USER_ID, p_CREATED_AT, p_EXPIRES_AT);

END $$

DELIMITER ;


-- TITLE: SEARCH_PROCEDURES
-- AUTHOR: Sophia Priola
-- This procedure allows users to enter filters to their apartment search

DELIMITER $$

CREATE PROCEDURE SEARCH_PROPERTIES (
    IN P_CITY          VARCHAR(100),
    IN P_STATE_CODE    CHAR(2),
    IN P_MIN_RENT      INT,
    IN P_MAX_RENT      INT,
    IN P_MIN_SQFT      INT UNSIGNED,
    IN P_MIN_BEDROOMS  TINYINT UNSIGNED,
    IN P_MIN_BATHROOMS FLOAT(2,1),
    IN P_CAN_RENT      TINYINT(1)
)
BEGIN
    SELECT
        P.PROPERTY_ID,
        P.UNIT_LABEL,
        A.STREET,
        A.CITY,
        A.STATE_CODE,
        A.ZIPCODE,
        P.RENT_COST,
        P.SQFT,
        P.BEDROOMS,
        P.BATHROOMS,
        P.CAN_RENT
    FROM PROPERTY AS P
    JOIN ADDRESS AS A
        ON P.ADDR_ID = A.ADDR_ID
    WHERE
        (P_CITY IS NULL OR A.CITY = P_CITY)
        AND (P_STATE_CODE IS NULL OR A.STATE_CODE = P_STATE_CODE)
        AND (P_MIN_RENT IS NULL OR P.RENT_COST >= P_MIN_RENT)
        AND (P_MAX_RENT IS NULL OR P.RENT_COST <= P_MAX_RENT)
        AND (P_MIN_SQFT IS NULL OR P.SQFT >= P_MIN_SQFT)
        AND (P_MIN_BEDROOMS IS NULL OR P.BEDROOMS >= P_MIN_BEDROOMS)
        AND (P_MIN_BATHROOMS IS NULL OR P.BATHROOMS >= P_MIN_BATHROOMS)
        AND (P_CAN_RENT IS NULL OR P.CAN_RENT = P_CAN_RENT)
    ORDER BY
        P.RENT_COST ASC;
END$$

DELIMITER ;


-- TITLE: SEND_MESSAGE
-- AUTHOR: Sophia Priola
-- SEND_MESSAGE is a procedure that has a one-to-one relationship between two users 
-- The message is timestamped with the current time and marked as unread (IS_READ = 0)

DELIMITER $$

CREATE PROCEDURE SEND_MESSAGE(
    IN p_SENDER_ID    INT, -- ID of message sender 
    IN p_RECIPIENT_ID INT, -- ID of message recipient 
    IN p_MESSAGE_TEXT VARCHAR(1000) -- Text of the message being sent 
)
BEGIN
    -- Insert a new "text message" as unread (IS_READ = 0)
    INSERT INTO MESSAGE (SENDER_ID, RECIPIENT_ID, SENT_TIMESTAMP, MESSAGE_TEXT, IS_READ)
    VALUES (p_SENDER_ID, p_RECIPIENT_ID, CURRENT_TIMESTAMP, p_MESSAGE_TEXT, 0
    );
END $$
DELIMITER ;


-- TITLE: SEND_NOTIFICATION.sql
-- AUTHOR: Sophia Priola
-- SEND_NOTIFICATION Is a procedure to send system wide notifications to users 
-- Insert a new unread notification with the current timestamp and given text

DELIMITER $$

CREATE PROCEDURE SEND_NOTIFICATION (
  -- Variables in use 
  IN  p_TEXT  VARCHAR(1000) -- Text of the notification 
)
  
BEGIN
  INSERT INTO NOTIFICATION (TIME_STAMP, IS_READ, NOTIFICATION_TEXT)
  -- Timestamp set to now, notification set to unread, use text passed into procedure 
  VALUES (CURRENT_TIMESTAMP, 0, p_TEXT);
  
END$$

DELIMITER ;


-- TITLE: SUBMIT_REVIEW.sql
-- AUTHOR: Sophia Priola
-- SUBMIT_REVIEW Allows a user to submit a review for a property they have rented
-- Users can rate a property out of 5 stars and optionally add a comment

DELIMITER $$

CREATE PROCEDURE SUBMIT_REVIEW(
	-- Variables included 
	IN p_USER_ID INT UNSIGNED , -- ID of the user submitting the review
	IN p_PROPERTY_ID INT UNSIGNED , -- ID of the property being reviewed 
    IN p_COMMENT VARCHAR(1000) , -- Optional comment
    IN p_STARS FLOAT(2,1) UNSIGNED -- Rating score (0.0 to 5.0 stars)
    )
BEGIN 
	-- Insert the new review into the REVIEW table
    INSERT INTO REVIEW(USER_ID, PROPERTY_ID, COMMENT, STARS)
    VALUES (p_USER_ID, p_PROPERTY_ID, p_COMMENT, p_STARS);
END$$
    
DELIMITER ;

    
    
    
