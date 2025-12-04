-- TITLE: Fosgate_GET_AVG_RATING
-- AUTHOR: Jeffrey Fosgate
-- DATE OF GITHUB COMMIT: 11/5/2025
-- A simple stored function for calculating the average rating of a property. Returns NULL when no entries exist.alter
-- Several queries used for testing the accuracy of this function have been commented out and can be un-commented to demonstrate the command's efficacy.

-- DROP FUNCTION GET_AVG_RATING;

-- DROP TABLE REVIEW_RATINGTEST;

-- A simplified version of the REVIEW table without all of the foreign keys.

/* CREATE TABLE IF NOT EXISTS REVIEW_RATINGTEST (
	REVIEW_ID INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
	PROPERTY_ID INT UNSIGNED NOT NULL,
	STARS FLOAT(8) NOT NULL
); */

-- Some test values for testing GET_AVG_RATING below as it pertains to STARS.

/* INSERT INTO REVIEW_RATINGTEST
VALUES (1,100,5.0), (2,100,2.5), (3,100,1.0), (4,100,4.0); */

-- GET_AVG_RATING FUNCTION --
-- This function does not show any errors according to MySQL. This should work with the actual REVIEW table.

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
