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