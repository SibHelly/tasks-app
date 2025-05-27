CREATE TABLE IF NOT EXISTS `inclusions` (
    `inclusion_id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `group_id` INT NOT NULL,
    `role` VARCHAR(100),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`group_id`) REFERENCES `groups`(`group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `unique_user_group` (`user_id`, `group_id`)
);