CREATE TABLE IF NOT EXISTS `categories` (
    `category_id` INT PRIMARY KEY AUTO_INCREMENT,
    `category_name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(500),
    `color` VARCHAR(20)
);
