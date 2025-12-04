INSERT INTO USERS (
    USERNAME, PASS_WORD, EMAIL, PHONE_NUMBER, GENDER,
    USER_DESC, PICTURE_URL, BIRTH_DATE, DISPLAY_NAME
)
SELECT
    CONCAT('user', n),
    CONCAT('pass', n, '!'),
    CONCAT('user', n, '@example.com'),
    CONCAT('+1', LPAD(n, 10, '0')),
    CASE FLOOR(RAND() * 3)
        WHEN 0 THEN 'M'
        WHEN 1 THEN 'F'
        ELSE 'X'
    END,
    CONCAT('Sample user description #', n),
    CONCAT('https://example.com/pictures/user', n, '.jpg'),
    DATE_ADD('1980-01-01', INTERVAL (RAND() * 15000) DAY),
    CONCAT('User ', n)
FROM (
    SELECT @row := @row + 1 AS n
    FROM information_schema.columns c1,
         information_schema.columns c2,
         (SELECT @row := 0) r
) AS numbers
LIMIT 100000;
