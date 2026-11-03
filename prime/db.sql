-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for localdb
CREATE DATABASE IF NOT EXISTS `localdb` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `localdb`;

-- Dumping structure for table localdb.attendance_logs
CREATE TABLE IF NOT EXISTS `attendance_logs` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `log_date` date NOT NULL,
  `clock_in` timestamp NULL DEFAULT NULL,
  `clock_out` timestamp NULL DEFAULT NULL,
  `total_hours` decimal(5,2) DEFAULT NULL,
  `late_minutes` int unsigned NOT NULL DEFAULT '0',
  `overtime_hours` decimal(5,2) NOT NULL DEFAULT '0.00',
  `status` enum('on_time','late','overtime','incomplete','absent') NOT NULL DEFAULT 'on_time',
  `method` enum('rfid','manual','pin') NOT NULL DEFAULT 'rfid',
  `rfid_card_uid_used` varchar(50) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `att_logs_employee_idx` (`employee_id`),
  CONSTRAINT `FK_c4ca4ff3d403535898ba7ae6ba3` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.attendance_logs: ~0 rows (approximately)

-- Dumping structure for table localdb.audit_logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` char(36) NOT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `audit_logs_entity_idx` (`entity_type`,`entity_id`),
  KEY `audit_logs_user_idx` (`user_id`),
  CONSTRAINT `FK_bd2726fd31b35443f2245b93ba0` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.audit_logs: ~0 rows (approximately)

-- Dumping structure for table localdb.branches
CREATE TABLE IF NOT EXISTS `branches` (
  `id` char(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `code` varchar(30) NOT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'branch',
  `address` text,
  `contact_number` varchar(50) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `is_main` tinyint NOT NULL DEFAULT '0',
  `is_active` tinyint NOT NULL DEFAULT '1',
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.branches: ~0 rows (approximately)

-- Dumping structure for table localdb.categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint NOT NULL DEFAULT '1',
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.categories: ~0 rows (approximately)
INSERT INTO `categories` (`id`, `name`, `sort_order`, `is_active`, `created_at`) VALUES
	('3bda0a0e-78cd-45aa-b263-16ed74ee30ee', 'Rice', 3, 1, '2026-10-28 02:22:09.353159'),
	('691e770f-2675-4bed-98e6-e9e03e08b8d8', 'Ulam', 2, 1, '2026-10-28 02:22:01.961778'),
	('b68ba794-7f44-41d1-901d-079df789c3e8', 'PRIME', 4, 1, '2026-10-28 02:22:31.928594'),
	('b722adc3-6f33-4785-996d-de42bc83f984', 'Iced Tea', 1, 1, '2026-10-27 05:54:33.872537');

-- Dumping structure for table localdb.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `id` char(36) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `loyalty_points_balance` int unsigned NOT NULL DEFAULT '0',
  `is_guest` tinyint NOT NULL DEFAULT '1',
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp NULL DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `pwd_id_number` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.customers: ~0 rows (approximately)
INSERT INTO `customers` (`id`, `email`, `password`, `name`, `contact_number`, `loyalty_points_balance`, `is_guest`, `created_at`, `updated_at`, `date_of_birth`, `pwd_id_number`) VALUES
	('ae5cee9c-7e4b-4b5a-bbed-5a96ea5c0549', 'restygonzales749@gmail.com', 'scrypt$zG9hpPGUTG8agB6x7cvMrA$59ZS-4YccPSBwcSWXq2BVNGfQL33J4UAiBJKYVR25kBz_b-dw9mafvhdXjDfB1F-EvhtzxMH7adFe7jzkJuGRA', 'Resty Gonzales', '+639551834091', 0, 0, '2026-10-27 05:50:16.351950', NULL, NULL, NULL);

-- Dumping structure for table localdb.customer_delivery_addresses
CREATE TABLE IF NOT EXISTS `customer_delivery_addresses` (
  `customer_id` char(36) NOT NULL,
  `label` enum('home','work') NOT NULL,
  `recipient_name` varchar(100) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `instructions` text,
  `is_default` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`customer_id`,`label`),
  KEY `customer_delivery_addresses_default_idx` (`customer_id`,`is_default`),
  CONSTRAINT `customer_delivery_addresses_customer_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.customer_delivery_addresses: ~0 rows (approximately)

-- Dumping structure for table localdb.customer_sessions
CREATE TABLE IF NOT EXISTS `customer_sessions` (
  `token_hash` char(64) NOT NULL,
  `customer_id` char(36) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`token_hash`),
  KEY `customer_sessions_customer_idx` (`customer_id`),
  KEY `customer_sessions_expires_idx` (`expires_at`),
  CONSTRAINT `customer_sessions_customer_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.customer_sessions: ~0 rows (approximately)
INSERT INTO `customer_sessions` (`token_hash`, `customer_id`, `expires_at`, `created_at`) VALUES
	('838a91f2521fce5c3bfd91ddb52ecb6f66af28b443a23e06844a1972e88e198a', 'ae5cee9c-7e4b-4b5a-bbed-5a96ea5c0549', '2026-11-26 13:53:10', '2026-10-27 05:53:10.301669');

-- Dumping structure for table localdb.deduction_types
CREATE TABLE IF NOT EXISTS `deduction_types` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `is_mandatory` tinyint NOT NULL DEFAULT '0',
  `is_active` tinyint NOT NULL DEFAULT '1',
  `code` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deduction_types_code_uq` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.deduction_types: ~4 rows (approximately)
INSERT INTO `deduction_types` (`id`, `name`, `is_mandatory`, `is_active`, `code`) VALUES
	('a1a1a1a1-1111-4111-8111-111111111111', 'SSS contribution', 1, 1, 'SSS'),
	('a2a2a2a2-2222-4222-8222-222222222222', 'PhilHealth contribution', 1, 1, 'PHILHEALTH'),
	('a3a3a3a3-3333-4333-8333-333333333333', 'Pag-IBIG contribution', 1, 1, 'PAGIBIG'),
	('a4a4a4a4-4444-4444-8444-444444444444', 'Meals deduction', 0, 1, 'MEALS');

-- Dumping structure for table localdb.deliveries
CREATE TABLE IF NOT EXISTS `deliveries` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `recipient_name` varchar(100) NOT NULL,
  `recipient_phone` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `delivery_fee` decimal(10,2) NOT NULL,
  `instructions` text,
  `status` enum('pending','assigned','picked_up','delivered','failed','cancelled') NOT NULL DEFAULT 'pending',
  `assigned_rider_id` char(36) DEFAULT NULL,
  `picked_up_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deliveries_order_uq` (`order_id`),
  KEY `deliveries_status_idx` (`status`),
  KEY `deliveries_rider_idx` (`assigned_rider_id`),
  CONSTRAINT `deliveries_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.deliveries: ~0 rows (approximately)

-- Dumping structure for table localdb.discount_types
CREATE TABLE IF NOT EXISTS `discount_types` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `requires_id_verification` tinyint NOT NULL DEFAULT '1',
  `is_active` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.discount_types: ~0 rows (approximately)

-- Dumping structure for table localdb.employees
CREATE TABLE IF NOT EXISTS `employees` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `employee_number` varchar(20) NOT NULL,
  `position` varchar(100) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `rfid_card_uid` varchar(50) DEFAULT NULL,
  `date_hired` date NOT NULL,
  `date_terminated` date DEFAULT NULL,
  `employment_status` enum('active','on_leave','terminated') NOT NULL DEFAULT 'active',
  `basic_salary` decimal(10,2) NOT NULL,
  `salary_type` enum('daily','monthly') NOT NULL,
  `sss_employee_share` decimal(10,2) NOT NULL DEFAULT '0.00',
  `sss_employer_share` decimal(10,2) NOT NULL DEFAULT '0.00',
  `philhealth_employee_share` decimal(10,2) NOT NULL DEFAULT '0.00',
  `philhealth_employer_share` decimal(10,2) NOT NULL DEFAULT '0.00',
  `pagibig_employee_share` decimal(10,2) NOT NULL DEFAULT '0.00',
  `pagibig_employer_share` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_number` (`employee_number`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `REL_2d83c53c3e553a48dadb9722e3` (`user_id`),
  UNIQUE KEY `rfid_card_uid` (`rfid_card_uid`),
  CONSTRAINT `FK_2d83c53c3e553a48dadb9722e38` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.employees: ~0 rows (approximately)
INSERT INTO `employees` (`id`, `user_id`, `employee_number`, `position`, `department`, `rfid_card_uid`, `date_hired`, `date_terminated`, `employment_status`, `basic_salary`, `salary_type`, `sss_employee_share`, `sss_employer_share`, `philhealth_employee_share`, `philhealth_employer_share`, `pagibig_employee_share`, `pagibig_employer_share`) VALUES
	('f9c382f7-3faf-40fd-a033-35ed9636c44d', 'd0405f8b-6095-4040-8cd9-1fe1f4f44c1e', 'EMP-0000', 'Administrator', 'Administration', NULL, '2026-10-28', NULL, 'active', 0.00, 'monthly', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00);

-- Dumping structure for table localdb.employee_schedules
CREATE TABLE IF NOT EXISTS `employee_schedules` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `shift_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `created_by_staff_id` char(36) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_bea53ad2cf486a2205af170a918` (`user_id`),
  KEY `FK_faee45fb6619508aaaf6249a2ae` (`created_by_staff_id`),
  CONSTRAINT `FK_bea53ad2cf486a2205af170a918` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_faee45fb6619508aaaf6249a2ae` FOREIGN KEY (`created_by_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.employee_schedules: ~0 rows (approximately)

-- Dumping structure for table localdb.expenses
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` char(36) NOT NULL,
  `category_id` char(36) NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `expense_date` date NOT NULL,
  `receipt_reference` varchar(100) DEFAULT NULL,
  `notes` text,
  `recorded_by_staff_id` char(36) NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expenses_cat_date_idx` (`category_id`,`expense_date`),
  KEY `FK_1f956d556567a88da97a11fe364` (`recorded_by_staff_id`),
  CONSTRAINT `FK_1f956d556567a88da97a11fe364` FOREIGN KEY (`recorded_by_staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_5d1f4be708e0dfe2afa1a3c376c` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.expenses: ~0 rows (approximately)

-- Dumping structure for table localdb.expense_categories
CREATE TABLE IF NOT EXISTS `expense_categories` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.expense_categories: ~0 rows (approximately)

-- Dumping structure for table localdb.inventory_categories
CREATE TABLE IF NOT EXISTS `inventory_categories` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.inventory_categories: ~0 rows (approximately)

-- Dumping structure for table localdb.inventory_items
CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id` char(36) NOT NULL,
  `category_id` char(36) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `unit` varchar(30) NOT NULL,
  `stock_quantity` decimal(10,3) NOT NULL DEFAULT '0.000',
  `reorder_threshold` decimal(10,3) DEFAULT NULL,
  `unit_cost` decimal(10,2) DEFAULT NULL,
  `supplier` varchar(150) DEFAULT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inventory_cat_active_idx` (`category_id`,`is_active`),
  CONSTRAINT `FK_934d5a332b6870c7bb95643ab41` FOREIGN KEY (`category_id`) REFERENCES `inventory_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.inventory_items: ~0 rows (approximately)

-- Dumping structure for table localdb.inventory_stock_logs
CREATE TABLE IF NOT EXISTS `inventory_stock_logs` (
  `id` char(36) NOT NULL,
  `item_type` enum('ingredient','menu_item') NOT NULL,
  `inventory_item_id` char(36) DEFAULT NULL,
  `menu_item_id` char(36) DEFAULT NULL,
  `type` enum('stock_in','adjustment','waste','consumed') NOT NULL,
  `quantity_change` decimal(10,3) NOT NULL,
  `quantity_after` decimal(10,3) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `performed_by_staff_id` char(36) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `inv_stock_logs_menu_idx` (`menu_item_id`,`created_at`),
  KEY `inv_stock_logs_item_idx` (`inventory_item_id`,`created_at`),
  KEY `FK_d5dfa7e10457372b510aef8c465` (`performed_by_staff_id`),
  CONSTRAINT `FK_b6e5bb0d6de870b3e8b6d52d1d5` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_d5dfa7e10457372b510aef8c465` FOREIGN KEY (`performed_by_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_dedb164faa347e45777f378a446` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.inventory_stock_logs: ~0 rows (approximately)

-- Dumping structure for table localdb.loyalty_rewards
CREATE TABLE IF NOT EXISTS `loyalty_rewards` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `points_cost` int unsigned NOT NULL,
  `description` text,
  `is_active` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.loyalty_rewards: ~0 rows (approximately)

-- Dumping structure for table localdb.loyalty_settings
CREATE TABLE IF NOT EXISTS `loyalty_settings` (
  `id` char(36) NOT NULL,
  `points_per_peso` decimal(5,2) NOT NULL DEFAULT '5.00',
  `peso_value_per_point` decimal(5,2) NOT NULL DEFAULT '0.25',
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.loyalty_settings: ~0 rows (approximately)

-- Dumping structure for table localdb.loyalty_transactions
CREATE TABLE IF NOT EXISTS `loyalty_transactions` (
  `id` char(36) NOT NULL,
  `customer_id` char(36) NOT NULL,
  `order_id` char(36) DEFAULT NULL,
  `type` enum('earn','redeem') NOT NULL,
  `points` int NOT NULL,
  `balance_after` int unsigned NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `reward_id` char(36) DEFAULT NULL,
  `reward_name` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `loyalty_tx_customer_idx` (`customer_id`),
  KEY `FK_8be4d5110bff05094d246d62aed` (`order_id`),
  CONSTRAINT `FK_39f39219f9587d34638ccde8b67` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_8be4d5110bff05094d246d62aed` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.loyalty_transactions: ~0 rows (approximately)

-- Dumping structure for table localdb.menu_items
CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` char(36) NOT NULL,
  `category_id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_available` tinyint NOT NULL DEFAULT '1',
  `stock_quantity` int unsigned DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `menu_items_is_available_idx` (`is_available`),
  KEY `menu_items_category_idx` (`category_id`),
  CONSTRAINT `FK_20cff56c44dd4fe52d5aa2b96f8` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.menu_items: ~0 rows (approximately)
INSERT INTO `menu_items` (`id`, `category_id`, `name`, `description`, `price`, `image_url`, `is_available`, `stock_quantity`, `created_at`, `updated_at`) VALUES
	('1211f08d-2ee3-4789-a04c-4549f7bdf0e8', 'b722adc3-6f33-4785-996d-de42bc83f984', 'Iced Tea', 'NSAHJKHKK', 100.00, NULL, 1, NULL, '2026-10-27 05:54:51.226148', '2026-10-27 05:54:51'),
	('62160d87-a6f9-4006-b577-a834207c3e44', 'b68ba794-7f44-41d1-901d-079df789c3e8', 'PRIME Litson Manok', NULL, 390.00, NULL, 1, NULL, '2026-10-28 02:22:42.406804', '2026-10-28 02:22:42'),
	('a144ecc3-aa87-42ec-8822-16715a9039a9', '3bda0a0e-78cd-45aa-b263-16ed74ee30ee', 'White Rice', NULL, 30.00, NULL, 1, NULL, '2026-10-28 02:23:31.018840', '2026-10-28 02:23:31');

-- Dumping structure for table localdb.menu_item_ingredients
CREATE TABLE IF NOT EXISTS `menu_item_ingredients` (
  `menu_item_id` char(36) NOT NULL,
  `inventory_item_id` char(36) NOT NULL,
  `quantity_used` decimal(10,3) NOT NULL,
  PRIMARY KEY (`menu_item_id`,`inventory_item_id`),
  KEY `menu_ingredients_inv_idx` (`inventory_item_id`),
  CONSTRAINT `FK_9dd0abb4cf0240a53dd408f8e6c` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_b65fd78d3af3e59542603c05d35` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.menu_item_ingredients: ~0 rows (approximately)

-- Dumping structure for table localdb.migrations
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `migration` int NOT NULL,
  `applied_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration_unique` (`migration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.migrations: ~0 rows (approximately)

-- Dumping structure for table localdb.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` char(36) NOT NULL,
  `order_number` varchar(30) NOT NULL,
  `table_id` char(36) DEFAULT NULL,
  `customer_id` char(36) DEFAULT NULL,
  `order_type` enum('qr','counter','delivery') NOT NULL,
  `status` enum('pending','preparing','ready','served','completed','cancelled') NOT NULL DEFAULT 'pending',
  `subtotal` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `created_by_staff_id` char(36) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp NULL DEFAULT NULL,
  `payment_status` varchar(32) NOT NULL DEFAULT 'not_required',
  `payment_method` varchar(20) DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `guest_ip_hash` char(64) DEFAULT NULL,
  `admin_hidden_at` datetime DEFAULT NULL,
  `customer_payment_reference` varchar(100) DEFAULT NULL,
  `payment_reference_token` char(36) DEFAULT NULL,
  `delivery_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `customer_hidden_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  UNIQUE KEY `orders_payment_reference_token_uq` (`payment_reference_token`),
  KEY `orders_table_id_idx` (`table_id`),
  KEY `orders_created_at_idx` (`created_at`),
  KEY `orders_status_idx` (`status`),
  KEY `FK_772d0ce0473ac2ccfa26060dbe9` (`customer_id`),
  KEY `FK_8ea92bade6674e8a416dfbb0b94` (`created_by_staff_id`),
  CONSTRAINT `FK_3d36410e89a795172fa6e0dd968` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_772d0ce0473ac2ccfa26060dbe9` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_8ea92bade6674e8a416dfbb0b94` FOREIGN KEY (`created_by_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.orders: ~0 rows (approximately)

-- Dumping structure for table localdb.order_discounts
CREATE TABLE IF NOT EXISTS `order_discounts` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `discount_type_id` char(36) NOT NULL,
  `id_number` varchar(50) DEFAULT NULL,
  `holder_name` varchar(100) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `applied_by_staff_id` char(36) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `order_discounts_order_idx` (`order_id`),
  KEY `FK_07432bcbe95f0081fb341d1d8c3` (`discount_type_id`),
  KEY `FK_39231d286101d479136905da95f` (`applied_by_staff_id`),
  CONSTRAINT `FK_07432bcbe95f0081fb341d1d8c3` FOREIGN KEY (`discount_type_id`) REFERENCES `discount_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_39231d286101d479136905da95f` FOREIGN KEY (`applied_by_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_e7b488cebe333f449398769b2cc` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.order_discounts: ~0 rows (approximately)

-- Dumping structure for table localdb.order_items
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `menu_item_id` char(36) NOT NULL,
  `quantity` int unsigned NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_idx` (`order_id`),
  KEY `FK_e462517174f561ece2916701c0a` (`menu_item_id`),
  CONSTRAINT `FK_145532db85752b29c57d2b7b1f1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_e462517174f561ece2916701c0a` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.order_items: ~0 rows (approximately)

-- Dumping structure for table localdb.order_promotions
CREATE TABLE IF NOT EXISTS `order_promotions` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `promotion_id` char(36) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `applied_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_1fe389485d755eefbfc08f9fae2` (`order_id`),
  KEY `FK_15a564530fed2d1d6a7757d7ea9` (`promotion_id`),
  CONSTRAINT `FK_15a564530fed2d1d6a7757d7ea9` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_1fe389485d755eefbfc08f9fae2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.order_promotions: ~0 rows (approximately)

-- Dumping structure for table localdb.order_status_history
CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `status` varchar(30) NOT NULL,
  `changed_by_staff_id` char(36) DEFAULT NULL,
  `changed_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `order_status_history_order_idx` (`order_id`),
  KEY `FK_d1317670fbd1cf7afd3dbe9a8a0` (`changed_by_staff_id`),
  CONSTRAINT `FK_1ca7d5228cf9dc589b60243933c` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_d1317670fbd1cf7afd3dbe9a8a0` FOREIGN KEY (`changed_by_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.order_status_history: ~0 rows (approximately)

-- Dumping structure for table localdb.order_voids
CREATE TABLE IF NOT EXISTS `order_voids` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `requested_by_staff_id` char(36) DEFAULT NULL,
  `approved_by_staff_id` char(36) DEFAULT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `requested_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolution_notes` text,
  PRIMARY KEY (`id`),
  KEY `order_voids_order_idx` (`order_id`),
  KEY `FK_e6306d0e67f5e9bb22cd8cb4aaf` (`requested_by_staff_id`),
  KEY `FK_0b897ad80200f707b8bb4474607` (`approved_by_staff_id`),
  CONSTRAINT `FK_0b897ad80200f707b8bb4474607` FOREIGN KEY (`approved_by_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_e6306d0e67f5e9bb22cd8cb4aaf` FOREIGN KEY (`requested_by_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_ff791044fae100adf843af6822b` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.order_voids: ~0 rows (approximately)

-- Dumping structure for table localdb.password_reset_tokens
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_type` varchar(16) NOT NULL,
  `account_id` char(36) NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash_unique` (`token_hash`),
  KEY `password_reset_account_idx` (`account_type`,`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.password_reset_tokens: ~0 rows (approximately)

-- Dumping structure for table localdb.payments
CREATE TABLE IF NOT EXISTS `payments` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `receipt_number` varchar(30) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','gcash','maya','qrph','card','other') NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `processed_by_staff_id` char(36) DEFAULT NULL,
  `paid_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `payments_order_idx` (`order_id`),
  KEY `FK_84b3c11d3952c7ef3ddc170c5b9` (`processed_by_staff_id`),
  CONSTRAINT `FK_84b3c11d3952c7ef3ddc170c5b9` FOREIGN KEY (`processed_by_staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_b2f7b823a21562eeca20e72b006` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.payments: ~0 rows (approximately)

-- Dumping structure for table localdb.payroll_deductions
CREATE TABLE IF NOT EXISTS `payroll_deductions` (
  `id` char(36) NOT NULL,
  `payroll_record_id` char(36) NOT NULL,
  `deduction_type_id` char(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `employer_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `deduction_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_49f0da9dc53dba3d2d0f144afbe` (`payroll_record_id`),
  KEY `FK_da8e4f5ed24fdc5ac7718d54c1c` (`deduction_type_id`),
  CONSTRAINT `FK_49f0da9dc53dba3d2d0f144afbe` FOREIGN KEY (`payroll_record_id`) REFERENCES `payroll_records` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_da8e4f5ed24fdc5ac7718d54c1c` FOREIGN KEY (`deduction_type_id`) REFERENCES `deduction_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.payroll_deductions: ~4 rows (approximately)

-- Dumping structure for table localdb.payroll_periods
CREATE TABLE IF NOT EXISTS `payroll_periods` (
  `id` char(36) NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `status` enum('open','processing','closed') NOT NULL DEFAULT 'open',
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.payroll_periods: ~0 rows (approximately)
INSERT INTO `payroll_periods` (`id`, `period_start`, `period_end`, `status`, `created_at`) VALUES
	('d5166992-723f-4cd1-b695-27b661dbcdcc', '2026-10-16', '2026-10-31', 'open', '2026-10-27 05:40:43.416101');

-- Dumping structure for table localdb.payroll_records
CREATE TABLE IF NOT EXISTS `payroll_records` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `payroll_period_id` char(36) NOT NULL,
  `gross_pay` decimal(10,2) NOT NULL,
  `total_deductions` decimal(10,2) NOT NULL DEFAULT '0.00',
  `net_pay` decimal(10,2) NOT NULL,
  `processed_by_staff_id` char(36) DEFAULT NULL,
  `processed_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `paid_hours` decimal(7,2) NOT NULL DEFAULT '0.00',
  `overtime_hours` decimal(7,2) NOT NULL DEFAULT '0.00',
  `attendance_days` decimal(6,2) NOT NULL DEFAULT '0.00',
  `daily_rate` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `payroll_rec_emp_period_idx` (`employee_id`,`payroll_period_id`),
  KEY `FK_c1b746fda54e11b01ca2e52aaab` (`payroll_period_id`),
  KEY `FK_9b2256b84c5c3a055579bfc8671` (`processed_by_staff_id`),
  CONSTRAINT `FK_9b2256b84c5c3a055579bfc8671` FOREIGN KEY (`processed_by_staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_c1b746fda54e11b01ca2e52aaab` FOREIGN KEY (`payroll_period_id`) REFERENCES `payroll_periods` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_ecf7648dbd87669698c31222cae` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.payroll_records: ~1 rows (approximately)

-- Dumping structure for table localdb.permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` char(36) NOT NULL,
  `code` varchar(100) NOT NULL,
  `module` varchar(50) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.permissions: ~19 rows (approximately)
INSERT INTO `permissions` (`id`, `code`, `module`, `description`) VALUES
	('0e1518dc-110d-4209-9901-f8f2f727b419', 'reservations:manage', 'Tables & reservations', 'Manage reservations.'),
	('1df7e243-1180-4a65-b1c2-91d48d31d4c8', 'payroll:manage', 'People', 'Manage payroll records.'),
	('31392e83-7383-4648-a7ec-d4ed58d86e52', 'discounts:manage', 'Menu & discounts', 'Manage discounts and promotions.'),
	('34658da7-c610-4aef-adab-fe1fe7600aaa', 'employees:manage', 'People', 'Manage staff accounts and employee records.'),
	('49a0d0fb-8e4a-4d24-b768-b0282747e5ce', 'orders:view', 'Live orders', 'View live and historical orders.'),
	('4b877a20-f358-4107-8f01-45b291aa9211', 'printers:manage', 'Administration', 'Manage receipt and kitchen printers.'),
	('5b27c4c4-8a75-4bdf-b308-f114fc9d4d18', 'dashboard:view', 'Dashboard', 'View the admin dashboard.'),
	('6078af1b-1f0d-4a8b-971d-fda8280e03e2', 'loyalty:manage', 'Administration', 'Manage loyalty and point redemptions.'),
	('7db89e7f-6f31-4559-86bc-edaa99733764', 'orders:cancel', 'Live orders', 'Cancel or void orders.'),
	('8d2c685e-a48a-4621-9cfc-6f51adafe012', 'menu:manage', 'Menu & discounts', 'Manage menu items and categories.'),
	('9367489c-b860-44fa-9e3d-5634c3816979', 'voids:approve', 'Administration', 'Review and approve order voids.'),
	('94d76e7e-ad11-40ae-a824-4c808cbfbc30', 'roles:manage', 'People', 'Manage roles and permission assignments.'),
	('94f5ca69-4f7e-4332-9898-4f14c6e4e6f2', 'settings:manage', 'Administration', 'Change system settings.'),
	('a5acdd65-c493-4956-9cd9-59a2fededd8a', 'orders:update', 'Live orders', 'Update order status and details.'),
	('a7d54c48-cf8c-4877-99af-7653cbe17344', 'inventory:manage', 'Inventory', 'Manage ingredients and stock.'),
	('b05c6636-9894-4806-9923-4ebf0bc1b245', 'attendance:manage', 'People', 'Manage staff attendance.'),
	('d584ca09-406e-44cd-a475-92230e8d7191', 'reports:view', 'Administration', 'View sales reports and analytics.'),
	('e8bc38fc-7071-4347-9bf8-ee65f8f526d5', 'tables:manage', 'Tables & reservations', 'Manage tables and QR codes.'),
	('e935991f-f84a-491b-b8fc-fadc8adb45a4', 'orders:create', 'Live orders', 'Create POS orders.');

-- Dumping structure for table localdb.printers
CREATE TABLE IF NOT EXISTS `printers` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `location` enum('kitchen','counter') NOT NULL,
  `connection_type` enum('network','usb','bluetooth') NOT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.printers: ~0 rows (approximately)

-- Dumping structure for table localdb.promotions
CREATE TABLE IF NOT EXISTS `promotions` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text,
  `promo_type` enum('percentage','fixed_amount','buy_x_get_y') NOT NULL,
  `discount_value` decimal(10,2) DEFAULT NULL,
  `min_spend` decimal(10,2) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `usage_limit` int unsigned DEFAULT NULL,
  `usage_count` int unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint NOT NULL DEFAULT '1',
  `created_by_staff_id` char(36) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_05f2120ad6d310e38e215e184be` (`created_by_staff_id`),
  CONSTRAINT `FK_05f2120ad6d310e38e215e184be` FOREIGN KEY (`created_by_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.promotions: ~0 rows (approximately)

-- Dumping structure for table localdb.promotion_items
CREATE TABLE IF NOT EXISTS `promotion_items` (
  `promotion_id` char(36) NOT NULL,
  `menu_item_id` char(36) NOT NULL,
  PRIMARY KEY (`promotion_id`,`menu_item_id`),
  KEY `IDX_ac1036add91b29c71b4c2aefe5` (`promotion_id`),
  KEY `IDX_e17681abca5aa8e4745a5554b2` (`menu_item_id`),
  CONSTRAINT `FK_ac1036add91b29c71b4c2aefe5e` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_e17681abca5aa8e4745a5554b23` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.promotion_items: ~0 rows (approximately)

-- Dumping structure for table localdb.refresh_tokens
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` char(36) NOT NULL,
  `token` text NOT NULL,
  `expires_at` datetime NOT NULL,
  `jti` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id_idx` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.refresh_tokens: ~0 rows (approximately)

-- Dumping structure for table localdb.reservations
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` char(36) NOT NULL,
  `customer_id` char(36) DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `table_id` char(36) DEFAULT NULL,
  `reservation_date` date NOT NULL,
  `reservation_time` time NOT NULL,
  `number_of_guests` int unsigned NOT NULL,
  `status` enum('pending','confirmed','cancelled','completed','no_show') NOT NULL DEFAULT 'pending',
  `notes` text,
  `created_by_staff_id` char(36) DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `reservations_date_time_idx` (`reservation_date`,`reservation_time`),
  KEY `FK_f63cb79a34cdf2d47ab23f31a8b` (`customer_id`),
  KEY `FK_5027ce24b4bc5e090302b2f7754` (`table_id`),
  KEY `FK_3547d544997b92197f1a42d7400` (`created_by_staff_id`),
  CONSTRAINT `FK_3547d544997b92197f1a42d7400` FOREIGN KEY (`created_by_staff_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_5027ce24b4bc5e090302b2f7754` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_f63cb79a34cdf2d47ab23f31a8b` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.reservations: ~0 rows (approximately)

-- Dumping structure for table localdb.restaurant_tables
CREATE TABLE IF NOT EXISTS `restaurant_tables` (
  `id` char(36) NOT NULL,
  `table_number` varchar(20) NOT NULL,
  `capacity` int unsigned NOT NULL,
  `qr_code_url` varchar(500) DEFAULT NULL,
  `status` enum('available','occupied','reserved') NOT NULL DEFAULT 'available',
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `occupied_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `table_number` (`table_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.restaurant_tables: ~0 rows (approximately)
INSERT INTO `restaurant_tables` (`id`, `table_number`, `capacity`, `qr_code_url`, `status`, `created_at`, `occupied_at`) VALUES
	('205fc79d-694f-4c81-a93d-c9e70831e997', 'TABLE 1', 2, '/api/tables/205fc79d-694f-4c81-a93d-c9e70831e997/qr', 'available', '2026-10-27 09:17:35.378517', NULL);

-- Dumping structure for table localdb.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` char(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text,
  `is_system` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.roles: ~0 rows (approximately)
INSERT INTO `roles` (`id`, `name`, `description`, `is_system`, `created_at`, `updated_at`) VALUES
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', 'Administrator', 'Built-in PRIME administrator role', 1, '2026-10-27 04:55:07.675750', '2026-10-28 02:17:38');

-- Dumping structure for table localdb.role_permissions
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` char(36) NOT NULL,
  `permission_id` char(36) NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `IDX_178199805b901ccd220ab7740e` (`role_id`),
  KEY `IDX_17022daf3f885f7d35423e9971` (`permission_id`),
  CONSTRAINT `FK_17022daf3f885f7d35423e9971e` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_178199805b901ccd220ab7740ec` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.role_permissions: ~19 rows (approximately)
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', '0e1518dc-110d-4209-9901-f8f2f727b419'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', '1df7e243-1180-4a65-b1c2-91d48d31d4c8'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', '31392e83-7383-4648-a7ec-d4ed58d86e52'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', '34658da7-c610-4aef-adab-fe1fe7600aaa'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', '49a0d0fb-8e4a-4d24-b768-b0282747e5ce'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', '4b877a20-f358-4107-8f01-45b291aa9211'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', '5b27c4c4-8a75-4bdf-b308-f114fc9d4d18'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', '6078af1b-1f0d-4a8b-971d-fda8280e03e2'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', '7db89e7f-6f31-4559-86bc-edaa99733764'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', '8d2c685e-a48a-4621-9cfc-6f51adafe012'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', '9367489c-b860-44fa-9e3d-5634c3816979'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', '94d76e7e-ad11-40ae-a824-4c808cbfbc30'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', '94f5ca69-4f7e-4332-9898-4f14c6e4e6f2'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', 'a5acdd65-c493-4956-9cd9-59a2fededd8a'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', 'a7d54c48-cf8c-4877-99af-7653cbe17344'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', 'b05c6636-9894-4806-9923-4ebf0bc1b245'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', 'd584ca09-406e-44cd-a475-92230e8d7191'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', 'e8bc38fc-7071-4347-9bf8-ee65f8f526d5'),
	('a176a99b-f745-4a34-b41e-cfda4fa9c9dd', 'e935991f-f84a-491b-b8fc-fadc8adb45a4');

-- Dumping structure for table localdb.staff_sessions
CREATE TABLE IF NOT EXISTS `staff_sessions` (
  `token_hash` char(64) NOT NULL,
  `user_id` char(36) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`token_hash`),
  KEY `staff_sessions_user_idx` (`user_id`),
  KEY `staff_sessions_expires_idx` (`expires_at`),
  CONSTRAINT `staff_sessions_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.staff_sessions: ~0 rows (approximately)
INSERT INTO `staff_sessions` (`token_hash`, `user_id`, `expires_at`, `created_at`) VALUES
	('c0ae19f5b41ad0d1d3f8107db9e3bdca35691b0f597cc870584f63928815b98d', 'd0405f8b-6095-4040-8cd9-1fe1f4f44c1e', '2026-10-28 22:17:39', '2026-10-28 02:17:38.525538');

-- Dumping structure for table localdb.system_settings
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` char(36) NOT NULL,
  `restaurant_name` varchar(150) NOT NULL DEFAULT 'PRIME Roast & Grill',
  `branch_name` varchar(100) NOT NULL DEFAULT 'Main Branch - Manila',
  `contact_number` varchar(50) NOT NULL DEFAULT '+63 917 123 4567',
  `email` varchar(100) NOT NULL DEFAULT 'contact@primerestaurant.ph',
  `address` text NOT NULL,
  `tin_number` varchar(50) DEFAULT NULL,
  `bir_min` varchar(50) DEFAULT NULL,
  `currency_symbol` varchar(10) NOT NULL DEFAULT '₱',
  `currency_code` varchar(10) NOT NULL DEFAULT 'PHP',
  `timezone` varchar(50) NOT NULL DEFAULT 'Asia/Manila',
  `vat_enabled` tinyint NOT NULL DEFAULT '1',
  `vat_rate` decimal(5,2) NOT NULL DEFAULT '12.00',
  `vat_inclusive` tinyint NOT NULL DEFAULT '1',
  `service_charge_enabled` tinyint NOT NULL DEFAULT '0',
  `service_charge_rate` decimal(5,2) NOT NULL DEFAULT '5.00',
  `senior_pwd_discount_enabled` tinyint NOT NULL DEFAULT '1',
  `order_number_prefix` varchar(20) NOT NULL DEFAULT 'ORD-',
  `auto_accept_qr_orders` tinyint NOT NULL DEFAULT '0',
  `require_table_selection` tinyint NOT NULL DEFAULT '1',
  `manager_approval_for_voids` tinyint NOT NULL DEFAULT '1',
  `low_stock_threshold_alert` int unsigned NOT NULL DEFAULT '10',
  `receipt_header` text,
  `receipt_footer` text,
  `print_receipt_auto` tinyint NOT NULL DEFAULT '1',
  `print_kot_auto` tinyint NOT NULL DEFAULT '1',
  `show_wifi_on_receipt` tinyint NOT NULL DEFAULT '1',
  `wifi_ssid` varchar(100) DEFAULT NULL,
  `wifi_password` varchar(100) DEFAULT NULL,
  `opening_time` varchar(10) NOT NULL DEFAULT '08:00',
  `closing_time` varchar(10) NOT NULL DEFAULT '22:00',
  `cash_drawer_opening_balance_required` tinyint NOT NULL DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT NULL,
  `gcash_qr_image` longtext,
  `maya_qr_image` longtext,
  `payroll_duty_hours` decimal(5,2) NOT NULL DEFAULT '8.00',
  `payroll_unpaid_break_hours` decimal(5,2) NOT NULL DEFAULT '1.00',
  `payroll_workdays_per_month` decimal(5,2) NOT NULL DEFAULT '26.00',
  `payroll_overtime_multiplier` decimal(5,2) NOT NULL DEFAULT '1.25',
  `payroll_sss_employee_share` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payroll_sss_employer_share` decimal(10,2) NOT NULL DEFAULT '255.00',
  `payroll_philhealth_employee_share` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payroll_philhealth_employer_share` decimal(10,2) NOT NULL DEFAULT '125.00',
  `payroll_pagibig_employee_share` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payroll_pagibig_employer_share` decimal(10,2) NOT NULL DEFAULT '4.50',
  `payroll_meals_deduction` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_cash_enabled` tinyint NOT NULL DEFAULT '1',
  `payment_gcash_enabled` tinyint NOT NULL DEFAULT '1',
  `payment_maya_enabled` tinyint NOT NULL DEFAULT '1',
  `payment_qrph_enabled` tinyint NOT NULL DEFAULT '1',
  `qrph_qr_image` longtext,
  `delivery_enabled` tinyint NOT NULL DEFAULT '1',
  `delivery_fee` decimal(10,2) NOT NULL DEFAULT '49.00',
  `delivery_minimum_order` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.system_settings: ~0 rows (approximately)

-- Dumping structure for table localdb.typeorm_migrations
CREATE TABLE IF NOT EXISTS `typeorm_migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timestamp` bigint NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.typeorm_migrations: ~0 rows (approximately)
INSERT INTO `typeorm_migrations` (`id`, `timestamp`, `name`) VALUES
	(1, 1791767613437, 'InitialSchema1791767613437'),
	(2, 1791840000000, 'AddQrphPaymentMethod1791840000000'),
	(3, 1791920000000, 'AddAttendancePayroll1791920000000'),
	(4, 1792000000000, 'AddPayrollCalculationSettings1792000000000'),
	(5, 1792080000000, 'AddEmployeeContributionAmounts1792080000000'),
	(6, 1792160000000, 'AddGlobalPayrollContributionSettings1792160000000'),
	(7, 1792240000000, 'AddPayrollMealsAndPayslipRate1792240000000'),
	(8, 1792320000000, 'AddPaymentMethodSettings1792320000000'),
	(9, 1792400000000, 'AddQrphQrImage1792400000000'),
	(10, 1792480000000, 'AllowUnassignedPaymentStaff1792480000000'),
	(11, 1792560000000, 'AddCustomerPaymentReference1792560000000'),
	(12, 1792600000000, 'AddCustomerDelivery1792600000000'),
	(13, 1792640000000, 'CreateCustomerSessions1792640000000'),
	(14, 1792720000000, 'AddCustomerOrderHistoryVisibility1792720000000'),
	(15, 1792800000000, 'SetPayrollBreakToOneHour1792800000000'),
	(16, 1792880000000, 'CreateStaffSessions1792880000000'),
	(17, 1792960000000, 'SetLoyaltyPointRates1792960000000'),
	(18, 1793040000000, 'CreateCustomerDeliveryAddresses1793040000000');

-- Dumping structure for table localdb.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) NOT NULL,
  `role_id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `users_role_idx` (`role_id`),
  CONSTRAINT `FK_a2cecd1a3531c0b041e29ba46e1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table localdb.users: ~0 rows (approximately)
INSERT INTO `users` (`id`, `role_id`, `email`, `password`, `name`, `contact_number`, `is_active`, `last_login_at`, `created_at`, `updated_at`) VALUES
	('d0405f8b-6095-4040-8cd9-1fe1f4f44c1e', 'a176a99b-f745-4a34-b41e-cfda4fa9c9dd', 'prime@gmail.com', 'scrypt$olzQHXR69zv-egJ_JwP9jg$DHDUi_VQsyKldHq9H1CXbm1JMcycaHtfMIiJPZFN4A60aQ4arel_rE0XuuF4BlpHZ0NLfwZFE61hG984N6CqGQ', 'Resty Gonzales', NULL, 1, '2026-10-28 02:17:38', '2026-10-28 02:17:38.492090', NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
