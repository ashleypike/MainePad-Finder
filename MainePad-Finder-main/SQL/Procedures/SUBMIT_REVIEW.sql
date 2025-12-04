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

    
    
    
