-- TITLE: GET_LISTINGS_WITH_LANDLORD
-- AUTHOR: Sophia Priola
-- Returns one row with property info, address info and 
-- landlord contact info (if LANDLORD_ID is set)
-- Scraped data will not have a landlord
-- This is so users can contact landlords with any apartment queries

USE MAINEPAD;

DROP PROCEDURE IF EXISTS GET_LISTING_WITH_LANDLORD;

DELIMITER $$

CREATE PROCEDURE GET_LISTING_WITH_LANDLORD (
    IN p_property_id INT -- specific to every property 
)
BEGIN

    SELECT
        P.PROPERTY_ID,
        P.UNIT_LABEL,
        P.RENT_COST,
        P.BEDROOMS,
        P.BATHROOMS,
        P.SQFT,
        P.CAN_RENT,
        A.CITY,
        A.STATE_CODE,
        A.ZIP_CODE,

        -- We also want to display the average rating of the property 
        GET_AVG_RATING(P.PROPERTY_ID) AS AVG_RATING,
        -- landlord contact information, may be NULL for scraped properties
        U.DISPLAY_NAME AS LANDLORD_NAME,
        U.EMAIL        AS LANDLORD_EMAIL,
        U.PHONE_NUMBER AS LANDLORD_PHONE

    FROM PROPERTY AS P
    JOIN ADDRESS AS A
      ON P.ADDR_ID = A.ADDR_ID

    -- Use LEFT JOIN so scraped properties with no landlord still appear,
    -- but landlord fields are NULL
    LEFT JOIN LANDLORD AS L
      ON P.LANDLORD_ID = L.LANDLORD_ID
    LEFT JOIN USERS AS U
      ON L.USER_ID = U.USER_ID

    WHERE P.PROPERTY_ID = p_property_id;
END$$

DELIMITER ;
