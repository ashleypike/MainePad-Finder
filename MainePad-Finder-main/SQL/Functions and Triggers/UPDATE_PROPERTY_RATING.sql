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
