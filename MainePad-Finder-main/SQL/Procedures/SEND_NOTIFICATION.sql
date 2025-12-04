-- TITLE: SEND_NOTIFICATION.sql
-- AUTHOR: Sophia Priola
-- SEND_NOTIFICATION Is a procedure to send system wide notifications to users 
-- Insert a new unread notification with the current timestamp and given text

DELIMITER $$

CREATE PROCEDURE SEND_NOTIFICATION (
  -- Variables in use 
  IN  p_TEXT  VARCHAR(1000) -- Text of the notification 
)
  
BEGIN
  INSERT INTO NOTIFICATION (TIME_STAMP, IS_READ, NOTIFICATION_TEXT)
  -- Timestamp set to now, notification set to unread, use text passed into procedure 
  VALUES (CURRENT_TIMESTAMP, 0, p_TEXT);
  
END$$

DELIMITER ;
