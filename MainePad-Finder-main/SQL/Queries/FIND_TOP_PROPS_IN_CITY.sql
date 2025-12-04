-- TITLE: FIND_TOP_RATED_PROPS_IN_CITY
-- AUTHOR: Sophia Priola
--   Compare an unoptimized and optimized version of a query that finds
--   the top-rated properties in a given city, ordered from highest to lowest
--   average star rating.
SELECT 
    P.PROPERTY_ID,    -- ID of the property
    A.CITY,           -- City that the property is located 
    (
    -- For each property row, compute the average STARS from REVIEW
        SELECT AVG(R.STARS)  
        FROM REVIEW AS R
        WHERE R.PROPERTY_ID = P.PROPERTY_ID
    ) AS AVG_RATING
FROM PROPERTY AS P
JOIN ADDRESS AS A
    ON P.ADDR_ID = A.ADDR_ID
WHERE A.CITY = 'Portland'    -- Only look at properties in 'Portland'
ORDER BY AVG_RATING DESC;    -- Display highest rated properties first 
-- Duration: 0.00139550 seconds

-- After optimization
-- Find the top rated properties in a city and order them rated highest to lowest 
-- Rewrites the query using JOIN + GROUP BY instead of a correlated subquery.

SELECT 
    P.PROPERTY_ID,    -- ID of property
    A.CITY,           -- City that property is located 
    AVG(R.STARS) AS AVG_RATING    -- average rating per property
FROM PROPERTY AS P
JOIN ADDRESS AS A
    ON P.ADDR_ID = A.ADDR_ID    -- link property to its address
JOIN REVIEW AS R
    ON R.PROPERTY_ID = P.PROPERTY_ID    -- link each review to its property
WHERE A.CITY = 'Portland'    -- Onlny look at properties in 'Portland'
GROUP BY             -- group by property to compute AVG(STARS)
    P.PROPERTY_ID,
    A.CITY
ORDER BY AVG_RATING DESC;    -- Display highest rated properties first 
-- Duration: 0.00057875 seconds
