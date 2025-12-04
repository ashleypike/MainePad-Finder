# Query Optimization & Indexing 
This section analyzes why we chose the indecies we have for MainePad-Finder and how we improved the performance of two of our key queries.

## Indexing Choices
We created a small set of indexes to support the most common access patterns
in the MainePad-Finder application. Each index was chosen because the corresponding column is
either:
- Frequently used in `WHERE` filters,
- Used to look up a single user or subset of users, or
- Used to sort data by recency (e.g., newest notifications/ messages)

**Chosen Indecies:**
- ``IDX_USERNAME ON USERS(USERNAME);``

We expect the application to frequently look up a user by their username (e.g., login, profile lookup). Without this index, queries such as profile searches would require scanning the entire USERS table.
- ``INDEX IDX_EMAIL ON USERS(EMAIL)``

Similar to usernames, emails are often used for login and password recovery and must be unique. Using this as an index avoids doing a full table scan and making existence checks and lookups much faster.
- ``INDEX IDX_DISPLAY_NAME ON USERS(DISPLAY_NAME);``

Display names are used for searching. For example you can search for users whos display name starts with "Jeff". An index on DISPLAY_NAME allows MySQL to efficiently seek into the range of matching names instead of scanning every row.
- ``INDEX IDX_BIRTHDATE ON USERS(BIRTH_DATE);``

Some queries may filter users by age or birthdate range if it is a roomate preference. Indexing 'BIRTH_DATE' lets MySQL use a range scan on the date column, which is much more efficient than scanning all users when we need to select only a subset by birthdate.
- ``INDEX IDX_RENT_ADDR ON PROPERTY(RENT_COST, ADDR_ID, PROPERTY_ID);``

Our application supports queries that filter properties by a maximum or minimum rent amount. Without an index, MySQL would need to scan every property to check its rent. The 'IDX_RENT_ADDR' index allows MySQL to perform a scan based on a range on RENT_COST, reading only the relevant portion of the index instead of the entire table. Including 'ADDR_ID' and 'PROPERTY_ID' allows queries to access these often used values without having to read the full table row, which increases performance.
- ``INDEX IDX_NOTIFICATION_TIMESTAMP ON NOTIFICATION(TIME_STAMP);``

Indexing TIME_STAMP helps MySQL efficiently find the most recent notifications for a user without scanning all older rows, which is important as the amount of notifications grow.
- ``INDEX IDX_MESSAGE_TIMESTAMP ON MESSAGE(TIME_STAMP);``

Such as the previous index, indexing TIME_STAMP allows MySQL to efficiently sort and limit the result set to the
newest messages, improving performance.
- ``INDEX IDX_CITY ON ADDRESS(CITY);``

Many MainePad-Finder queries filter properties by city, especially our optimized "Top-rated properties in a city" query we show as an example. By indexing ADDRESS(CITY), MySQL can quickly locate all addresses in a given city using the index instead of scanning the full ADDRESS table. This index is critical for efficiently supporting searches that are city based. 

## Optimized Queries 
### Query 1: Top Rated Properties In A City 
**Goal of Query:** For a given city (e.g., Portland), find all properties in that city and sort them by their average review stars, highest first.

**Tables involved:**
```sql
- ADDRESS.sql
- PROPERTY.sql
- REVIEW.sql
```
#### Before Optimization 
```sql
SELECT 
    P.PROPERTY_ID,
    A.CITY,
    (
        SELECT AVG(R.STARS)
        FROM REVIEW AS R
        WHERE R.PROPERTY_ID = P.PROPERTY_ID
    ) AS AVG_RATING
FROM PROPERTY AS P
JOIN ADDRESS AS A
    ON P.ADDR_ID = A.ADDR_ID
WHERE A.CITY = 'Portland'
ORDER BY AVG_RATING DESC;
```
Duration: 0.00139550 seconds

**What it does** 
- For each property row in Portland, it runs a separate SELECT on REVIEW to compute AVG(STARS)
- On a small dataset, this is fine. On a larger dataset, it can be slower because MySQL keeps re-running the inner query

**Why it is less optimial**
- The inner query is tied to the outer query through P.PROPERTY_ID = R.PROPERTY_ID
- MySQL may need to probe the REVIEW table once per property

#### After Optimization: Using JOIN and GROUP BY
```sql
SELECT 
    P.PROPERTY_ID,
    A.CITY,
    AVG(R.STARS) AS AVG_RATING
FROM PROPERTY AS P
JOIN ADDRESS AS A
    ON P.ADDR_ID = A.ADDR_ID
JOIN REVIEW AS R
    ON R.PROPERTY_ID = P.PROPERTY_ID
WHERE A.CITY = 'Portland'
GROUP BY 
    P.PROPERTY_ID,
    A.CITY
ORDER BY AVG_RATING DESC;
```
Duration: 0.00057875 seconds

**What changed**
- We join REVIEW once and let MySQL compute AVG(R.STARS) using GROUP BY.
- MySQL can plan this as a single grouped query instead of outer loop + many inner subqueries.

#### Indexing 
```sql
CREATE INDEX IDX_CITY ON ADDRESS(CITY);
```
We use the IDX_CITY index on ADDRESS(CITY) because this query always filters by city. With this index, MySQL can quickly locate all addresses in a given city using an index range scan instead of scanning the entire ADDRESS table.

## Query 2: Find Properties Within A Rent Cost
**Goal of Query:** Finds each location, how many properties are between 2500 and 2600, and what are the min/max rents.

**Tables involved:**
```sql
- ADDRESS.sql
- PROPERTY.sql
```
#### Before Optimization 
```sql
EXPLAIN ANALYZE
SELECT
    a.City,
    a.State_Code,

       (
       SELECT COUNT(*)
       FROM PROPERTY p
       WHERE p.ADDR_ID = a.ADDR_ID
       AND p.RENT_COST BETWEEN 2500 AND 2600
       ) AS NumProperties,
(
       SELECT MIN(p.RENT_COST)
       FROM PROPERTY p 
       WHERE p.ADDR_ID = a.ADDR_ID
       AND p.RENT_COST BETWEEN 2500 AND 2600
       ) AS MinRent,
(
       SELECT MAX(p.RENT_COST)
       FROM PROPERTY p
       WHERE p.ADDR_ID = a.ADDR_ID
       AND p.RENT_COST BETWEEN 2500 AND 2600
       ) AS MaxRent 
FROM ADDRESS a
ORDER BY NumProperties DESC;
```
Duration: 0.00138375 seconds

**What it does** 
- runs three subqueries to get how many properties at that address are in the rent range, the minimum and maximum. 

**Why it is less optimial**
- Three separate scans of PROPERTY per address.
- Each subquery is correlated with the outer query via p.ADDR_ID = a.ADDR_ID. Correlated queries make it harder to choose an efficient single plan.

#### After Optimization
```sql
EXPLAIN ANALYZE
SELECT a.City, a.State_Code, 
       COUNT(*) AS NumProperties,
       MIN(p.RENT_COST) AS MinRent,
       MAX(p.RENT_COST) AS MaxRent
FROM PROPERTY p
JOIN ADDRESS a ON p.ADDR_ID = a.ADDR_ID
WHERE p.RENT_COST BETWEEN 2500 AND 2600
GROUP BY a.City, a.State_Code
ORDER BY NumProperties DESC
```
Duration: 0.00038050 seconds

**What changed**
- You start from PROPERTY, filter once by RENT_COST, JOIN to ADDRESS and let GROUP BY handle the three previous sub queries.
- The optimized version makes sure it scans the filtered PROPERTY rows once and computes COUNT/MIN/MAX in a single GROUP BY step.

#### Indexing 
```sql
CREATE INDEX IDX_RENT_ADDR ON PROPERTY(RENT_COST, ADDR_ID, PROPERTY_ID);
```
We used the IDX_RENT_ADDR index to allow for fast searching by RENT_COST, with the most likely associated values included to reduce the time needed for reading full table rows.




