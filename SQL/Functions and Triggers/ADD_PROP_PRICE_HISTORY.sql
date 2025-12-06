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
    INSERT INTO PROP_PRICE_HISTORY (PROP_ID, RENT_COST)
    VALUES (NEW.PROP_ID, NEW.RENT_COST); -- Duplicate listings are not allowed on MySQL by default, so this will have no effect if the property's price isn't updated.
END //

DELIMITER ;
