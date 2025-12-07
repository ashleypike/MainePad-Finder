-- TITLE: INSERT_SESSION
-- AUTHOR: Ashley Pike
-- Creates session for authentication when user logs in

DELIMITER $$

CREATE PROCEDURE INSERT_SESSION (
    p_TOKEN VARCHAR(128),
    p_USER_ID INT,
    p_CREATED_AT DATETIME,
    p_EXPIRES_AT DATETIME
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