
CREATE TABLE `users` (
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  `home_town` varchar(255) NOT NULL,
  `role` varchar(255) DEFAULT 'user',
  PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `calendar` (
    `cal_id` INT(11) NOT NULL AUTO_INCREMENT,
    `start_time` DATETIME NOT NULL,
    `end_time` DATETIME NOT NULL,
    `username` VARCHAR(255) DEFAULT NULL,
    `category` TINYTEXT NOT NULL,
    `title` TEXT NOT NULL,
    PRIMARY KEY (`cal_id`),
    UNIQUE KEY `calendar_inserts` (`start_time` , `end_time` , `username`),
    KEY `username` (`username`),
    CONSTRAINT `calendar_ibfk_1` FOREIGN KEY (`username`)
        REFERENCES `users` (`username`)
)  ENGINE=INNODB AUTO_INCREMENT=15021 DEFAULT CHARSET=UTF8MB4 COLLATE = UTF8MB4_0900_AI_CI;



CREATE TABLE `employer` (
  `contract_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) DEFAULT NULL,
  `employer` varchar(255) DEFAULT NULL,
  `paydate_month_offset` int(11) DEFAULT NULL,
  `base` float DEFAULT NULL,
  PRIMARY KEY (`contract_id`),
  UNIQUE KEY `username` (`username`,`employer`),
  CONSTRAINT `employer_ibfk_1` FOREIGN KEY (`username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `contract_rule` (
  `rule_id` int(11) NOT NULL AUTO_INCREMENT,
  `rule_name` varchar(255) DEFAULT NULL,
  `rate` float DEFAULT NULL,
  `start_time` int(11) DEFAULT NULL,
  `end_time` int(11) DEFAULT NULL,
  `target_days` varchar(255) DEFAULT NULL,
  `contract_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`rule_id`),
  KEY `contract_id` (`contract_id`),
  CONSTRAINT `contract_rule_ibfk_1` FOREIGN KEY (`contract_id`) REFERENCES `employer` (`contract_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `crud` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category` tinytext,
  `post` text,
  `stamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `when_was` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `username` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`,`stamp`),
  KEY `username` (`username`),
  CONSTRAINT `crud_ibfk_1` FOREIGN KEY (`username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=655 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `thread_reply` (
  `reply_id` int(11) NOT NULL AUTO_INCREMENT,
  `thread_id` int(11) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `reply` varchar(255) DEFAULT NULL,
  `stamp` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `when_was` varchar(7) DEFAULT 'created',
  PRIMARY KEY (`reply_id`),
  KEY `thread_id` (`thread_id`),
  CONSTRAINT `thread_reply_ibfk_1` FOREIGN KEY (`thread_id`) REFERENCES `crud` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `reply_comment` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `reply_id` int(11) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `comments` varchar(255) DEFAULT NULL,
  `stamp` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `when_was` varchar(7) DEFAULT 'created',
  PRIMARY KEY (`comment_id`),
  KEY `reply_id` (`reply_id`),
  CONSTRAINT `reply_comment_ibfk_1` FOREIGN KEY (`reply_id`) REFERENCES `thread_reply` (`reply_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
