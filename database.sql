-- SQL script for creating the check_in_out table
-- Database: Assumes you have a database selected.
-- Engine: InnoDB for transaction support.

SET NAMES utf8mb4;
SET time_zone = '+07:00';

-- Drop the table if it already exists to avoid errors on re-creation
DROP TABLE IF EXISTS `check_records`;

-- Create the main table for storing check-in and check-out records
CREATE TABLE `check_records` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(255) DEFAULT NULL COMMENT 'Identifier for the user, e.g., employee ID. Can be linked to a users table.',
  `check_type` ENUM('IN', 'OUT') NOT NULL COMMENT 'Type of the check event: IN or OUT.',
  `latitude` DECIMAL(10, 8) NOT NULL COMMENT 'GPS latitude coordinate.',
  `longitude` DECIMAL(11, 8) NOT NULL COMMENT 'GPS longitude coordinate.',
  `photo_path` VARCHAR(255) NOT NULL COMMENT 'Server file path or URL to the saved photo.',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp of when the record was created.',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores check-in and check-out events with location and photo.';

-- Example of how you might have a users table (optional)
--
-- CREATE TABLE `users` (
--   `id` VARCHAR(255) NOT NULL,
--   `full_name` VARCHAR(255) NOT NULL,
--   `email` VARCHAR(255) UNIQUE,
--   PRIMARY KEY (`id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- INSERT INTO `users` (`id`, `full_name`) VALUES ('USER_123', 'John Doe');

