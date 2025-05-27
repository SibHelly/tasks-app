CREATE TABLE `chats` (
    `chat_id` INT PRIMARY KEY AUTO_INCREMENT,
    `task_id` INT NOT NULL,
    `chat_name` VARCHAR(100) NOT NULL,
    FOREIGN KEY (`task_id`) REFERENCES `tasks`(`task_id`)  ON DELETE CASCADE ON UPDATE CASCADE
);