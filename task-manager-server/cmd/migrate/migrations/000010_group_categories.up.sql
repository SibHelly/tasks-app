CREATE TABLE `groups_categories` (
    `groups_categories_id` INT PRIMARY KEY AUTO_INCREMENT,
    `group_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    FOREIGN KEY (`group_id`) REFERENCES `groups`(`group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `unique_group_category` (`group_id`, `category_id`)
) ;