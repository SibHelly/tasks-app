CREATE TABLE `comments` (
    `comment_id` INT PRIMARY KEY AUTO_INCREMENT,
    `chat_id` INT NOT NULL,
    `sender_id` INT NOT NULL,
    `comment_text` TEXT NOT NULL,
    FOREIGN KEY (`chat_id`) REFERENCES `chats`(`chat_id`) ON UPDATE CASCADE,
    FOREIGN KEY (`sender_id`) REFERENCES `users`(`user_id`) ON UPDATE CASCADE
);