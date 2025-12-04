-- TITLE NOTIFICATION.sql
-- AUTHOR: Sophia Priola 
-- Table creation for notification

CREATE TABLE IF NOT EXISTS NOTIFICATION (
    NOTIFICATION_ID INT UNSIGNED PRIMARY KEY AUTO_INCREMENT ,    -- Unique notification ID 
    TIME_STAMP TIMESTAMP NOT NULL,        -- Timestamp for when notification was sent 
    IS_READ TINYINT(1) NOT NULL DEFAULT 0,    -- If read 1, if unread 0
    NOTIFICATION_TEXT NVARCHAR(1000) NOT NULL    -- Text within the notificaiton
);
