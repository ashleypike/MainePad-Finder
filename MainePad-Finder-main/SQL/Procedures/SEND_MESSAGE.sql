-- TITLE: SEND_MESSAGE
-- AUTHOR: Sophia Priola
-- SEND_MESSAGE is a procedure that has a one-to-one relationship between two users 
-- The message is timestamped with the current time and marked as unread (IS_READ = 0)

DELIMITER $$

CREATE PROCEDURE SEND_MESSAGE(
    IN p_SENDER_ID    INT, -- ID of message sender 
    IN p_RECIPIENT_ID INT, -- ID of message recipient 
    IN p_MESSAGE_TEXT VARCHAR(1000) -- Text of the message being sent 
)
BEGIN
    -- Insert a new "text message" as unread (IS_READ = 0)
    INSERT INTO MESSAGE (SENDER_ID, RECIPIENT_ID, SENT_TIMESTAMP, MESSAGE_TEXT, IS_READ)
    VALUES (p_SENDER_ID, p_RECIPIENT_ID, CURRENT_TIMESTAMP, p_MESSAGE_TEXT, 0
    );
END $$
DELIMITER ;


