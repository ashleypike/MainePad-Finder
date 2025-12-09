CREATE USER IF NOT EXISTS 'admin'@'localhost' IDENTIFIED BY 'admin';
GRANT ALL PRIVILEGES ON mainepad.* TO 'admin'@'localhost';
GRANT SUPER ON *.* TO 'admin'@'localhost';
FLUSH PRIVILEGES;