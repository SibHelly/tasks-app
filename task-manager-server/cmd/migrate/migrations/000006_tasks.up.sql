CREATE TABLE IF NOT EXISTS `tasks` (
    `task_id` INT PRIMARY KEY AUTO_INCREMENT,
    `task_name` VARCHAR(100) NOT NULL,
    `task_description` TEXT,
    `priority_id` INT,
    `status_id` INT,
    `start_time` DATETIME,
    `end_time` DATETIME,
    `attachments` TEXT,
    `category_id` INT,
    `parent_task_id` INT,
    `group_id` INT,
    FOREIGN KEY (`priority_id`) REFERENCES `priority_map`(`priority_id`) ON UPDATE CASCADE,
    FOREIGN KEY (`status_id`) REFERENCES `status_map`(`status_id`) ON UPDATE CASCADE,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON UPDATE CASCADE,
    FOREIGN KEY (`parent_task_id`) REFERENCES `tasks`(`task_id`) ON UPDATE CASCADE,
    FOREIGN KEY (`group_id`) REFERENCES `groups`(`group_id`) ON UPDATE CASCADE
);