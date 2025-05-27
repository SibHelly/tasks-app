CREATE TABLE IF NOT EXISTS `users` (
    `user_id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `info` TEXT,
    `phone` VARCHAR(15),
    `password` VARCHAR(100) NOT NULL,
    UNIQUE KEY (`phone`)
);