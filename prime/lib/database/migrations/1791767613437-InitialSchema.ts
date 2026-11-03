import type { MigrationInterface, QueryRunner } from "typeorm"

export class InitialSchema1791767613437 implements MigrationInterface {
  name = "InitialSchema1791767613437"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`migrations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`migration\` int NOT NULL, \`applied_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE INDEX \`migration_unique\` (\`migration\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`permissions\` (\`id\` char(36) NOT NULL, \`code\` varchar(100) NOT NULL, \`module\` varchar(50) NOT NULL, \`description\` text NULL, UNIQUE INDEX \`code\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`roles\` (\`id\` char(36) NOT NULL, \`name\` varchar(50) NOT NULL, \`description\` text NULL, \`is_system\` tinyint NOT NULL DEFAULT '0', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp NULL, UNIQUE INDEX \`name\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` char(36) NOT NULL, \`role_id\` char(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`name\` varchar(100) NOT NULL, \`contact_number\` varchar(20) NULL, \`is_active\` tinyint NOT NULL DEFAULT '1', \`last_login_at\` timestamp NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp NULL, INDEX \`users_role_idx\` (\`role_id\`), UNIQUE INDEX \`email\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`payroll_periods\` (\`id\` char(36) NOT NULL, \`period_start\` date NOT NULL, \`period_end\` date NOT NULL, \`status\` enum ('open', 'processing', 'closed') NOT NULL DEFAULT 'open', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`deduction_types\` (\`id\` char(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`is_mandatory\` tinyint NOT NULL DEFAULT '0', \`is_active\` tinyint NOT NULL DEFAULT '1', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`payroll_deductions\` (\`id\` char(36) NOT NULL, \`payroll_record_id\` char(36) NOT NULL, \`deduction_type_id\` char(36) NOT NULL, \`amount\` decimal(10,2) NOT NULL, \`notes\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`payroll_records\` (\`id\` char(36) NOT NULL, \`employee_id\` char(36) NOT NULL, \`payroll_period_id\` char(36) NOT NULL, \`gross_pay\` decimal(10,2) NOT NULL, \`total_deductions\` decimal(10,2) NOT NULL DEFAULT '0.00', \`net_pay\` decimal(10,2) NOT NULL, \`processed_by_staff_id\` char(36) NOT NULL, \`processed_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`payroll_rec_emp_period_idx\` (\`employee_id\`, \`payroll_period_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`employees\` (\`id\` char(36) NOT NULL, \`user_id\` char(36) NOT NULL, \`employee_number\` varchar(20) NOT NULL, \`position\` varchar(100) NOT NULL, \`department\` varchar(100) NULL, \`rfid_card_uid\` varchar(50) NULL, \`date_hired\` date NOT NULL, \`date_terminated\` date NULL, \`employment_status\` enum ('active', 'on_leave', 'terminated') NOT NULL DEFAULT 'active', \`basic_salary\` decimal(10,2) NOT NULL, \`salary_type\` enum ('daily', 'monthly') NOT NULL, UNIQUE INDEX \`rfid_card_uid\` (\`rfid_card_uid\`), UNIQUE INDEX \`employee_number\` (\`employee_number\`), UNIQUE INDEX \`user_id\` (\`user_id\`), UNIQUE INDEX \`REL_2d83c53c3e553a48dadb9722e3\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`attendance_logs\` (\`id\` char(36) NOT NULL, \`employee_id\` char(36) NOT NULL, \`log_date\` date NOT NULL, \`clock_in\` timestamp NULL, \`clock_out\` timestamp NULL, \`total_hours\` decimal(5,2) NULL, \`late_minutes\` int UNSIGNED NOT NULL DEFAULT '0', \`overtime_hours\` decimal(5,2) NOT NULL DEFAULT '0.00', \`status\` enum ('on_time', 'late', 'overtime', 'incomplete', 'absent') NOT NULL DEFAULT 'on_time', \`method\` enum ('rfid', 'manual', 'pin') NOT NULL DEFAULT 'rfid', \`rfid_card_uid_used\` varchar(50) NULL, \`notes\` text NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`att_logs_employee_idx\` (\`employee_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`audit_logs\` (\`id\` char(36) NOT NULL, \`user_id\` char(36) NULL, \`action\` varchar(100) NOT NULL, \`entity_type\` varchar(50) NOT NULL, \`entity_id\` char(36) NOT NULL, \`details\` json NULL, \`ip_address\` varchar(45) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`audit_logs_entity_idx\` (\`entity_type\`, \`entity_id\`), INDEX \`audit_logs_user_idx\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`branches\` (\`id\` char(36) NOT NULL, \`name\` varchar(120) NOT NULL, \`code\` varchar(30) NOT NULL, \`type\` varchar(20) NOT NULL DEFAULT 'branch', \`address\` text NULL, \`contact_number\` varchar(50) NULL, \`email\` varchar(120) NULL, \`is_main\` tinyint NOT NULL DEFAULT '0', \`is_active\` tinyint NOT NULL DEFAULT '1', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp NULL, UNIQUE INDEX \`code\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`inventory_categories\` (\`id\` char(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`inventory_stock_logs\` (\`id\` char(36) NOT NULL, \`item_type\` enum ('ingredient', 'menu_item') NOT NULL, \`inventory_item_id\` char(36) NULL, \`menu_item_id\` char(36) NULL, \`type\` enum ('stock_in', 'adjustment', 'waste', 'consumed') NOT NULL, \`quantity_change\` decimal(10,3) NOT NULL, \`quantity_after\` decimal(10,3) NULL, \`note\` varchar(255) NULL, \`performed_by_staff_id\` char(36) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`inv_stock_logs_menu_idx\` (\`menu_item_id\`, \`created_at\`), INDEX \`inv_stock_logs_item_idx\` (\`inventory_item_id\`, \`created_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`inventory_items\` (\`id\` char(36) NOT NULL, \`category_id\` char(36) NULL, \`name\` varchar(150) NOT NULL, \`unit\` varchar(30) NOT NULL, \`stock_quantity\` decimal(10,3) NOT NULL DEFAULT '0.000', \`reorder_threshold\` decimal(10,3) NULL, \`unit_cost\` decimal(10,2) NULL, \`supplier\` varchar(150) NULL, \`is_active\` tinyint NOT NULL DEFAULT '1', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp NULL, INDEX \`inventory_cat_active_idx\` (\`category_id\`, \`is_active\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`menu_item_ingredients\` (\`menu_item_id\` char(36) NOT NULL, \`inventory_item_id\` char(36) NOT NULL, \`quantity_used\` decimal(10,3) NOT NULL, INDEX \`menu_ingredients_inv_idx\` (\`inventory_item_id\`), PRIMARY KEY (\`menu_item_id\`, \`inventory_item_id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`loyalty_rewards\` (\`id\` char(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`points_cost\` int UNSIGNED NOT NULL, \`description\` text NULL, \`is_active\` tinyint NOT NULL DEFAULT '1', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`loyalty_transactions\` (\`id\` char(36) NOT NULL, \`customer_id\` char(36) NOT NULL, \`order_id\` char(36) NULL, \`type\` enum ('earn', 'redeem') NOT NULL, \`points\` int NOT NULL, \`balance_after\` int UNSIGNED NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`reward_id\` char(36) NULL, \`reward_name\` varchar(150) NULL, INDEX \`loyalty_tx_customer_idx\` (\`customer_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`customers\` (\`id\` char(36) NOT NULL, \`email\` varchar(255) NULL, \`password\` varchar(255) NULL, \`name\` varchar(100) NOT NULL, \`contact_number\` varchar(20) NULL, \`loyalty_points_balance\` int UNSIGNED NOT NULL DEFAULT '0', \`is_guest\` tinyint NOT NULL DEFAULT '1', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp NULL, \`date_of_birth\` date NULL, \`pwd_id_number\` varchar(50) NULL, UNIQUE INDEX \`email\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`reservations\` (\`id\` char(36) NOT NULL, \`customer_id\` char(36) NULL, \`customer_name\` varchar(100) NOT NULL, \`contact_number\` varchar(20) NOT NULL, \`email\` varchar(255) NULL, \`table_id\` char(36) NULL, \`reservation_date\` date NOT NULL, \`reservation_time\` time NOT NULL, \`number_of_guests\` int UNSIGNED NOT NULL, \`status\` enum ('pending', 'confirmed', 'cancelled', 'completed', 'no_show') NOT NULL DEFAULT 'pending', \`notes\` text NULL, \`created_by_staff_id\` char(36) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`reservations_date_time_idx\` (\`reservation_date\`, \`reservation_time\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`restaurant_tables\` (\`id\` char(36) NOT NULL, \`table_number\` varchar(20) NOT NULL, \`capacity\` int UNSIGNED NOT NULL, \`qr_code_url\` varchar(500) NULL, \`status\` enum ('available', 'occupied', 'reserved') NOT NULL DEFAULT 'available', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`occupied_at\` datetime NULL, UNIQUE INDEX \`table_number\` (\`table_number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`payments\` (\`id\` char(36) NOT NULL, \`order_id\` char(36) NOT NULL, \`receipt_number\` varchar(30) NOT NULL, \`amount_paid\` decimal(10,2) NOT NULL, \`payment_method\` enum ('cash', 'gcash', 'maya', 'card', 'other') NOT NULL, \`reference_number\` varchar(100) NULL, \`processed_by_staff_id\` char(36) NOT NULL, \`paid_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`payments_order_idx\` (\`order_id\`), UNIQUE INDEX \`receipt_number\` (\`receipt_number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`discount_types\` (\`id\` char(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`percentage\` decimal(5,2) NOT NULL, \`requires_id_verification\` tinyint NOT NULL DEFAULT '1', \`is_active\` tinyint NOT NULL DEFAULT '1', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`order_discounts\` (\`id\` char(36) NOT NULL, \`order_id\` char(36) NOT NULL, \`discount_type_id\` char(36) NOT NULL, \`id_number\` varchar(50) NULL, \`holder_name\` varchar(100) NOT NULL, \`discount_amount\` decimal(10,2) NOT NULL, \`applied_by_staff_id\` char(36) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`order_discounts_order_idx\` (\`order_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`promotions\` (\`id\` char(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`description\` text NULL, \`promo_type\` enum ('percentage', 'fixed_amount', 'buy_x_get_y') NOT NULL, \`discount_value\` decimal(10,2) NULL, \`min_spend\` decimal(10,2) NULL, \`start_date\` date NOT NULL, \`end_date\` date NOT NULL, \`usage_limit\` int UNSIGNED NULL, \`usage_count\` int UNSIGNED NOT NULL DEFAULT '0', \`is_active\` tinyint NOT NULL DEFAULT '1', \`created_by_staff_id\` char(36) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`order_promotions\` (\`id\` char(36) NOT NULL, \`order_id\` char(36) NOT NULL, \`promotion_id\` char(36) NOT NULL, \`discount_amount\` decimal(10,2) NOT NULL, \`applied_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`order_status_history\` (\`id\` char(36) NOT NULL, \`order_id\` char(36) NOT NULL, \`status\` varchar(30) NOT NULL, \`changed_by_staff_id\` char(36) NULL, \`changed_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`order_status_history_order_idx\` (\`order_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`order_voids\` (\`id\` char(36) NOT NULL, \`order_id\` char(36) NOT NULL, \`requested_by_staff_id\` char(36) NULL, \`approved_by_staff_id\` char(36) NULL, \`reason\` text NOT NULL, \`status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending', \`requested_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`resolved_at\` timestamp NULL, \`resolution_notes\` text NULL, INDEX \`order_voids_order_idx\` (\`order_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`orders\` (\`id\` char(36) NOT NULL, \`order_number\` varchar(30) NOT NULL, \`table_id\` char(36) NULL, \`customer_id\` char(36) NULL, \`order_type\` enum ('qr', 'counter') NOT NULL, \`status\` enum ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled') NOT NULL DEFAULT 'pending', \`subtotal\` decimal(10,2) NOT NULL, \`discount\` decimal(10,2) NOT NULL DEFAULT '0.00', \`tax\` decimal(10,2) NOT NULL DEFAULT '0.00', \`total\` decimal(10,2) NOT NULL, \`created_by_staff_id\` char(36) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp NULL, \`payment_status\` varchar(32) NOT NULL DEFAULT 'not_required', \`payment_method\` varchar(20) NULL, \`payment_reference\` varchar(100) NULL, \`guest_ip_hash\` char(64) NULL, \`admin_hidden_at\` datetime NULL, INDEX \`orders_table_id_idx\` (\`table_id\`), INDEX \`orders_created_at_idx\` (\`created_at\`), INDEX \`orders_status_idx\` (\`status\`), UNIQUE INDEX \`order_number\` (\`order_number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`order_items\` (\`id\` char(36) NOT NULL, \`order_id\` char(36) NOT NULL, \`menu_item_id\` char(36) NOT NULL, \`quantity\` int UNSIGNED NOT NULL, \`unit_price\` decimal(10,2) NOT NULL, \`subtotal\` decimal(10,2) NOT NULL, \`notes\` varchar(255) NULL, INDEX \`order_items_order_id_idx\` (\`order_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`menu_items\` (\`id\` char(36) NOT NULL, \`category_id\` char(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`description\` text NULL, \`price\` decimal(10,2) NOT NULL, \`image_url\` varchar(500) NULL, \`is_available\` tinyint NOT NULL DEFAULT '1', \`stock_quantity\` int UNSIGNED NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp NULL, INDEX \`menu_items_is_available_idx\` (\`is_available\`), INDEX \`menu_items_category_idx\` (\`category_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`categories\` (\`id\` char(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`sort_order\` int NOT NULL DEFAULT '0', \`is_active\` tinyint NOT NULL DEFAULT '1', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`employee_schedules\` (\`id\` char(36) NOT NULL, \`user_id\` char(36) NOT NULL, \`shift_date\` date NOT NULL, \`start_time\` time NOT NULL, \`end_time\` time NOT NULL, \`created_by_staff_id\` char(36) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`expense_categories\` (\`id\` char(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT '1', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`name\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`expenses\` (\`id\` char(36) NOT NULL, \`category_id\` char(36) NOT NULL, \`description\` varchar(255) NOT NULL, \`amount\` decimal(10,2) NOT NULL, \`expense_date\` date NOT NULL, \`receipt_reference\` varchar(100) NULL, \`notes\` text NULL, \`recorded_by_staff_id\` char(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp NULL, INDEX \`expenses_cat_date_idx\` (\`category_id\`, \`expense_date\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`loyalty_settings\` (\`id\` char(36) NOT NULL, \`points_per_peso\` decimal(5,2) NOT NULL DEFAULT '1.00', \`peso_value_per_point\` decimal(5,2) NOT NULL DEFAULT '0.50', \`updated_at\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`password_reset_tokens\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`account_type\` varchar(16) NOT NULL, \`account_id\` char(36) NOT NULL, \`token_hash\` char(64) NOT NULL, \`expires_at\` datetime NOT NULL, \`used_at\` datetime NULL, \`created_at\` datetime NOT NULL, INDEX \`password_reset_account_idx\` (\`account_type\`, \`account_id\`), UNIQUE INDEX \`token_hash_unique\` (\`token_hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`printers\` (\`id\` char(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`location\` enum ('kitchen', 'counter') NOT NULL, \`connection_type\` enum ('network', 'usb', 'bluetooth') NOT NULL, \`ip_address\` varchar(50) NULL, \`is_active\` tinyint NOT NULL DEFAULT '1', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`refresh_tokens\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`user_id\` char(36) NOT NULL, \`token\` text NOT NULL, \`expires_at\` datetime NOT NULL, \`jti\` text NOT NULL, INDEX \`user_id_idx\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`system_settings\` (\`id\` char(36) NOT NULL, \`restaurant_name\` varchar(150) NOT NULL DEFAULT 'PRIME Roast & Grill', \`branch_name\` varchar(100) NOT NULL DEFAULT 'Main Branch - Manila', \`contact_number\` varchar(50) NOT NULL DEFAULT '+63 917 123 4567', \`email\` varchar(100) NOT NULL DEFAULT 'contact@primerestaurant.ph', \`address\` text NOT NULL, \`tin_number\` varchar(50) NULL, \`bir_min\` varchar(50) NULL, \`currency_symbol\` varchar(10) NOT NULL DEFAULT '₱', \`currency_code\` varchar(10) NOT NULL DEFAULT 'PHP', \`timezone\` varchar(50) NOT NULL DEFAULT 'Asia/Manila', \`vat_enabled\` tinyint NOT NULL DEFAULT '1', \`vat_rate\` decimal(5,2) NOT NULL DEFAULT '12.00', \`vat_inclusive\` tinyint NOT NULL DEFAULT '1', \`service_charge_enabled\` tinyint NOT NULL DEFAULT '0', \`service_charge_rate\` decimal(5,2) NOT NULL DEFAULT '5.00', \`senior_pwd_discount_enabled\` tinyint NOT NULL DEFAULT '1', \`order_number_prefix\` varchar(20) NOT NULL DEFAULT 'ORD-', \`auto_accept_qr_orders\` tinyint NOT NULL DEFAULT '0', \`require_table_selection\` tinyint NOT NULL DEFAULT '1', \`manager_approval_for_voids\` tinyint NOT NULL DEFAULT '1', \`low_stock_threshold_alert\` int UNSIGNED NOT NULL DEFAULT '10', \`receipt_header\` text NULL, \`receipt_footer\` text NULL, \`print_receipt_auto\` tinyint NOT NULL DEFAULT '1', \`print_kot_auto\` tinyint NOT NULL DEFAULT '1', \`show_wifi_on_receipt\` tinyint NOT NULL DEFAULT '1', \`wifi_ssid\` varchar(100) NULL, \`wifi_password\` varchar(100) NULL, \`opening_time\` varchar(10) NOT NULL DEFAULT '08:00', \`closing_time\` varchar(10) NOT NULL DEFAULT '22:00', \`cash_drawer_opening_balance_required\` tinyint NOT NULL DEFAULT '1', \`updated_at\` timestamp NULL, \`gcash_qr_image\` longtext NULL, \`maya_qr_image\` longtext NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`role_permissions\` (\`role_id\` char(36) NOT NULL, \`permission_id\` char(36) NOT NULL, INDEX \`IDX_178199805b901ccd220ab7740e\` (\`role_id\`), INDEX \`IDX_17022daf3f885f7d35423e9971\` (\`permission_id\`), PRIMARY KEY (\`role_id\`, \`permission_id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `CREATE TABLE \`promotion_items\` (\`promotion_id\` char(36) NOT NULL, \`menu_item_id\` char(36) NOT NULL, INDEX \`IDX_ac1036add91b29c71b4c2aefe5\` (\`promotion_id\`), INDEX \`IDX_e17681abca5aa8e4745a5554b2\` (\`menu_item_id\`), PRIMARY KEY (\`promotion_id\`, \`menu_item_id\`)) ENGINE=InnoDB`
    )
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD CONSTRAINT \`FK_a2cecd1a3531c0b041e29ba46e1\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`payroll_deductions\` ADD CONSTRAINT \`FK_49f0da9dc53dba3d2d0f144afbe\` FOREIGN KEY (\`payroll_record_id\`) REFERENCES \`payroll_records\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`payroll_deductions\` ADD CONSTRAINT \`FK_da8e4f5ed24fdc5ac7718d54c1c\` FOREIGN KEY (\`deduction_type_id\`) REFERENCES \`deduction_types\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`payroll_records\` ADD CONSTRAINT \`FK_ecf7648dbd87669698c31222cae\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`payroll_records\` ADD CONSTRAINT \`FK_c1b746fda54e11b01ca2e52aaab\` FOREIGN KEY (\`payroll_period_id\`) REFERENCES \`payroll_periods\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`payroll_records\` ADD CONSTRAINT \`FK_9b2256b84c5c3a055579bfc8671\` FOREIGN KEY (\`processed_by_staff_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`employees\` ADD CONSTRAINT \`FK_2d83c53c3e553a48dadb9722e38\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`attendance_logs\` ADD CONSTRAINT \`FK_c4ca4ff3d403535898ba7ae6ba3\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`audit_logs\` ADD CONSTRAINT \`FK_bd2726fd31b35443f2245b93ba0\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`inventory_stock_logs\` ADD CONSTRAINT \`FK_b6e5bb0d6de870b3e8b6d52d1d5\` FOREIGN KEY (\`inventory_item_id\`) REFERENCES \`inventory_items\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`inventory_stock_logs\` ADD CONSTRAINT \`FK_dedb164faa347e45777f378a446\` FOREIGN KEY (\`menu_item_id\`) REFERENCES \`menu_items\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`inventory_stock_logs\` ADD CONSTRAINT \`FK_d5dfa7e10457372b510aef8c465\` FOREIGN KEY (\`performed_by_staff_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`inventory_items\` ADD CONSTRAINT \`FK_934d5a332b6870c7bb95643ab41\` FOREIGN KEY (\`category_id\`) REFERENCES \`inventory_categories\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`menu_item_ingredients\` ADD CONSTRAINT \`FK_b65fd78d3af3e59542603c05d35\` FOREIGN KEY (\`menu_item_id\`) REFERENCES \`menu_items\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`menu_item_ingredients\` ADD CONSTRAINT \`FK_9dd0abb4cf0240a53dd408f8e6c\` FOREIGN KEY (\`inventory_item_id\`) REFERENCES \`inventory_items\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`loyalty_transactions\` ADD CONSTRAINT \`FK_39f39219f9587d34638ccde8b67\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`loyalty_transactions\` ADD CONSTRAINT \`FK_8be4d5110bff05094d246d62aed\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`reservations\` ADD CONSTRAINT \`FK_f63cb79a34cdf2d47ab23f31a8b\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`reservations\` ADD CONSTRAINT \`FK_5027ce24b4bc5e090302b2f7754\` FOREIGN KEY (\`table_id\`) REFERENCES \`restaurant_tables\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`reservations\` ADD CONSTRAINT \`FK_3547d544997b92197f1a42d7400\` FOREIGN KEY (\`created_by_staff_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`payments\` ADD CONSTRAINT \`FK_b2f7b823a21562eeca20e72b006\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`payments\` ADD CONSTRAINT \`FK_84b3c11d3952c7ef3ddc170c5b9\` FOREIGN KEY (\`processed_by_staff_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`order_discounts\` ADD CONSTRAINT \`FK_e7b488cebe333f449398769b2cc\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`order_discounts\` ADD CONSTRAINT \`FK_07432bcbe95f0081fb341d1d8c3\` FOREIGN KEY (\`discount_type_id\`) REFERENCES \`discount_types\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`order_discounts\` ADD CONSTRAINT \`FK_39231d286101d479136905da95f\` FOREIGN KEY (\`applied_by_staff_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`promotions\` ADD CONSTRAINT \`FK_05f2120ad6d310e38e215e184be\` FOREIGN KEY (\`created_by_staff_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`order_promotions\` ADD CONSTRAINT \`FK_1fe389485d755eefbfc08f9fae2\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`order_promotions\` ADD CONSTRAINT \`FK_15a564530fed2d1d6a7757d7ea9\` FOREIGN KEY (\`promotion_id\`) REFERENCES \`promotions\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`order_status_history\` ADD CONSTRAINT \`FK_1ca7d5228cf9dc589b60243933c\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`order_status_history\` ADD CONSTRAINT \`FK_d1317670fbd1cf7afd3dbe9a8a0\` FOREIGN KEY (\`changed_by_staff_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`order_voids\` ADD CONSTRAINT \`FK_ff791044fae100adf843af6822b\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`order_voids\` ADD CONSTRAINT \`FK_e6306d0e67f5e9bb22cd8cb4aaf\` FOREIGN KEY (\`requested_by_staff_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`order_voids\` ADD CONSTRAINT \`FK_0b897ad80200f707b8bb4474607\` FOREIGN KEY (\`approved_by_staff_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_3d36410e89a795172fa6e0dd968\` FOREIGN KEY (\`table_id\`) REFERENCES \`restaurant_tables\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_772d0ce0473ac2ccfa26060dbe9\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_8ea92bade6674e8a416dfbb0b94\` FOREIGN KEY (\`created_by_staff_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`order_items\` ADD CONSTRAINT \`FK_145532db85752b29c57d2b7b1f1\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`order_items\` ADD CONSTRAINT \`FK_e462517174f561ece2916701c0a\` FOREIGN KEY (\`menu_item_id\`) REFERENCES \`menu_items\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`menu_items\` ADD CONSTRAINT \`FK_20cff56c44dd4fe52d5aa2b96f8\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`employee_schedules\` ADD CONSTRAINT \`FK_bea53ad2cf486a2205af170a918\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`employee_schedules\` ADD CONSTRAINT \`FK_faee45fb6619508aaaf6249a2ae\` FOREIGN KEY (\`created_by_staff_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`expenses\` ADD CONSTRAINT \`FK_5d1f4be708e0dfe2afa1a3c376c\` FOREIGN KEY (\`category_id\`) REFERENCES \`expense_categories\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`expenses\` ADD CONSTRAINT \`FK_1f956d556567a88da97a11fe364\` FOREIGN KEY (\`recorded_by_staff_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`role_permissions\` ADD CONSTRAINT \`FK_178199805b901ccd220ab7740ec\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`role_permissions\` ADD CONSTRAINT \`FK_17022daf3f885f7d35423e9971e\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`promotion_items\` ADD CONSTRAINT \`FK_ac1036add91b29c71b4c2aefe5e\` FOREIGN KEY (\`promotion_id\`) REFERENCES \`promotions\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE \`promotion_items\` ADD CONSTRAINT \`FK_e17681abca5aa8e4745a5554b23\` FOREIGN KEY (\`menu_item_id\`) REFERENCES \`menu_items\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`promotion_items\` DROP FOREIGN KEY \`FK_e17681abca5aa8e4745a5554b23\``
    )
    await queryRunner.query(
      `ALTER TABLE \`promotion_items\` DROP FOREIGN KEY \`FK_ac1036add91b29c71b4c2aefe5e\``
    )
    await queryRunner.query(
      `ALTER TABLE \`role_permissions\` DROP FOREIGN KEY \`FK_17022daf3f885f7d35423e9971e\``
    )
    await queryRunner.query(
      `ALTER TABLE \`role_permissions\` DROP FOREIGN KEY \`FK_178199805b901ccd220ab7740ec\``
    )
    await queryRunner.query(
      `ALTER TABLE \`expenses\` DROP FOREIGN KEY \`FK_1f956d556567a88da97a11fe364\``
    )
    await queryRunner.query(
      `ALTER TABLE \`expenses\` DROP FOREIGN KEY \`FK_5d1f4be708e0dfe2afa1a3c376c\``
    )
    await queryRunner.query(
      `ALTER TABLE \`employee_schedules\` DROP FOREIGN KEY \`FK_faee45fb6619508aaaf6249a2ae\``
    )
    await queryRunner.query(
      `ALTER TABLE \`employee_schedules\` DROP FOREIGN KEY \`FK_bea53ad2cf486a2205af170a918\``
    )
    await queryRunner.query(
      `ALTER TABLE \`menu_items\` DROP FOREIGN KEY \`FK_20cff56c44dd4fe52d5aa2b96f8\``
    )
    await queryRunner.query(
      `ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_e462517174f561ece2916701c0a\``
    )
    await queryRunner.query(
      `ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_145532db85752b29c57d2b7b1f1\``
    )
    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_8ea92bade6674e8a416dfbb0b94\``
    )
    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_772d0ce0473ac2ccfa26060dbe9\``
    )
    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_3d36410e89a795172fa6e0dd968\``
    )
    await queryRunner.query(
      `ALTER TABLE \`order_voids\` DROP FOREIGN KEY \`FK_0b897ad80200f707b8bb4474607\``
    )
    await queryRunner.query(
      `ALTER TABLE \`order_voids\` DROP FOREIGN KEY \`FK_e6306d0e67f5e9bb22cd8cb4aaf\``
    )
    await queryRunner.query(
      `ALTER TABLE \`order_voids\` DROP FOREIGN KEY \`FK_ff791044fae100adf843af6822b\``
    )
    await queryRunner.query(
      `ALTER TABLE \`order_status_history\` DROP FOREIGN KEY \`FK_d1317670fbd1cf7afd3dbe9a8a0\``
    )
    await queryRunner.query(
      `ALTER TABLE \`order_status_history\` DROP FOREIGN KEY \`FK_1ca7d5228cf9dc589b60243933c\``
    )
    await queryRunner.query(
      `ALTER TABLE \`order_promotions\` DROP FOREIGN KEY \`FK_15a564530fed2d1d6a7757d7ea9\``
    )
    await queryRunner.query(
      `ALTER TABLE \`order_promotions\` DROP FOREIGN KEY \`FK_1fe389485d755eefbfc08f9fae2\``
    )
    await queryRunner.query(
      `ALTER TABLE \`promotions\` DROP FOREIGN KEY \`FK_05f2120ad6d310e38e215e184be\``
    )
    await queryRunner.query(
      `ALTER TABLE \`order_discounts\` DROP FOREIGN KEY \`FK_39231d286101d479136905da95f\``
    )
    await queryRunner.query(
      `ALTER TABLE \`order_discounts\` DROP FOREIGN KEY \`FK_07432bcbe95f0081fb341d1d8c3\``
    )
    await queryRunner.query(
      `ALTER TABLE \`order_discounts\` DROP FOREIGN KEY \`FK_e7b488cebe333f449398769b2cc\``
    )
    await queryRunner.query(
      `ALTER TABLE \`payments\` DROP FOREIGN KEY \`FK_84b3c11d3952c7ef3ddc170c5b9\``
    )
    await queryRunner.query(
      `ALTER TABLE \`payments\` DROP FOREIGN KEY \`FK_b2f7b823a21562eeca20e72b006\``
    )
    await queryRunner.query(
      `ALTER TABLE \`reservations\` DROP FOREIGN KEY \`FK_3547d544997b92197f1a42d7400\``
    )
    await queryRunner.query(
      `ALTER TABLE \`reservations\` DROP FOREIGN KEY \`FK_5027ce24b4bc5e090302b2f7754\``
    )
    await queryRunner.query(
      `ALTER TABLE \`reservations\` DROP FOREIGN KEY \`FK_f63cb79a34cdf2d47ab23f31a8b\``
    )
    await queryRunner.query(
      `ALTER TABLE \`loyalty_transactions\` DROP FOREIGN KEY \`FK_8be4d5110bff05094d246d62aed\``
    )
    await queryRunner.query(
      `ALTER TABLE \`loyalty_transactions\` DROP FOREIGN KEY \`FK_39f39219f9587d34638ccde8b67\``
    )
    await queryRunner.query(
      `ALTER TABLE \`menu_item_ingredients\` DROP FOREIGN KEY \`FK_9dd0abb4cf0240a53dd408f8e6c\``
    )
    await queryRunner.query(
      `ALTER TABLE \`menu_item_ingredients\` DROP FOREIGN KEY \`FK_b65fd78d3af3e59542603c05d35\``
    )
    await queryRunner.query(
      `ALTER TABLE \`inventory_items\` DROP FOREIGN KEY \`FK_934d5a332b6870c7bb95643ab41\``
    )
    await queryRunner.query(
      `ALTER TABLE \`inventory_stock_logs\` DROP FOREIGN KEY \`FK_d5dfa7e10457372b510aef8c465\``
    )
    await queryRunner.query(
      `ALTER TABLE \`inventory_stock_logs\` DROP FOREIGN KEY \`FK_dedb164faa347e45777f378a446\``
    )
    await queryRunner.query(
      `ALTER TABLE \`inventory_stock_logs\` DROP FOREIGN KEY \`FK_b6e5bb0d6de870b3e8b6d52d1d5\``
    )
    await queryRunner.query(
      `ALTER TABLE \`audit_logs\` DROP FOREIGN KEY \`FK_bd2726fd31b35443f2245b93ba0\``
    )
    await queryRunner.query(
      `ALTER TABLE \`attendance_logs\` DROP FOREIGN KEY \`FK_c4ca4ff3d403535898ba7ae6ba3\``
    )
    await queryRunner.query(
      `ALTER TABLE \`employees\` DROP FOREIGN KEY \`FK_2d83c53c3e553a48dadb9722e38\``
    )
    await queryRunner.query(
      `ALTER TABLE \`payroll_records\` DROP FOREIGN KEY \`FK_9b2256b84c5c3a055579bfc8671\``
    )
    await queryRunner.query(
      `ALTER TABLE \`payroll_records\` DROP FOREIGN KEY \`FK_c1b746fda54e11b01ca2e52aaab\``
    )
    await queryRunner.query(
      `ALTER TABLE \`payroll_records\` DROP FOREIGN KEY \`FK_ecf7648dbd87669698c31222cae\``
    )
    await queryRunner.query(
      `ALTER TABLE \`payroll_deductions\` DROP FOREIGN KEY \`FK_da8e4f5ed24fdc5ac7718d54c1c\``
    )
    await queryRunner.query(
      `ALTER TABLE \`payroll_deductions\` DROP FOREIGN KEY \`FK_49f0da9dc53dba3d2d0f144afbe\``
    )
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_a2cecd1a3531c0b041e29ba46e1\``
    )
    await queryRunner.query(
      `DROP INDEX \`IDX_e17681abca5aa8e4745a5554b2\` ON \`promotion_items\``
    )
    await queryRunner.query(
      `DROP INDEX \`IDX_ac1036add91b29c71b4c2aefe5\` ON \`promotion_items\``
    )
    await queryRunner.query(`DROP TABLE \`promotion_items\``)
    await queryRunner.query(
      `DROP INDEX \`IDX_17022daf3f885f7d35423e9971\` ON \`role_permissions\``
    )
    await queryRunner.query(
      `DROP INDEX \`IDX_178199805b901ccd220ab7740e\` ON \`role_permissions\``
    )
    await queryRunner.query(`DROP TABLE \`role_permissions\``)
    await queryRunner.query(`DROP TABLE \`system_settings\``)
    await queryRunner.query(`DROP INDEX \`user_id_idx\` ON \`refresh_tokens\``)
    await queryRunner.query(`DROP TABLE \`refresh_tokens\``)
    await queryRunner.query(`DROP TABLE \`printers\``)
    await queryRunner.query(
      `DROP INDEX \`token_hash_unique\` ON \`password_reset_tokens\``
    )
    await queryRunner.query(
      `DROP INDEX \`password_reset_account_idx\` ON \`password_reset_tokens\``
    )
    await queryRunner.query(`DROP TABLE \`password_reset_tokens\``)
    await queryRunner.query(`DROP TABLE \`loyalty_settings\``)
    await queryRunner.query(
      `DROP INDEX \`expenses_cat_date_idx\` ON \`expenses\``
    )
    await queryRunner.query(`DROP TABLE \`expenses\``)
    await queryRunner.query(`DROP INDEX \`name\` ON \`expense_categories\``)
    await queryRunner.query(`DROP TABLE \`expense_categories\``)
    await queryRunner.query(`DROP TABLE \`employee_schedules\``)
    await queryRunner.query(`DROP TABLE \`categories\``)
    await queryRunner.query(
      `DROP INDEX \`menu_items_category_idx\` ON \`menu_items\``
    )
    await queryRunner.query(
      `DROP INDEX \`menu_items_is_available_idx\` ON \`menu_items\``
    )
    await queryRunner.query(`DROP TABLE \`menu_items\``)
    await queryRunner.query(
      `DROP INDEX \`order_items_order_id_idx\` ON \`order_items\``
    )
    await queryRunner.query(`DROP TABLE \`order_items\``)
    await queryRunner.query(`DROP INDEX \`order_number\` ON \`orders\``)
    await queryRunner.query(`DROP INDEX \`orders_status_idx\` ON \`orders\``)
    await queryRunner.query(
      `DROP INDEX \`orders_created_at_idx\` ON \`orders\``
    )
    await queryRunner.query(`DROP INDEX \`orders_table_id_idx\` ON \`orders\``)
    await queryRunner.query(`DROP TABLE \`orders\``)
    await queryRunner.query(
      `DROP INDEX \`order_voids_order_idx\` ON \`order_voids\``
    )
    await queryRunner.query(`DROP TABLE \`order_voids\``)
    await queryRunner.query(
      `DROP INDEX \`order_status_history_order_idx\` ON \`order_status_history\``
    )
    await queryRunner.query(`DROP TABLE \`order_status_history\``)
    await queryRunner.query(`DROP TABLE \`order_promotions\``)
    await queryRunner.query(`DROP TABLE \`promotions\``)
    await queryRunner.query(
      `DROP INDEX \`order_discounts_order_idx\` ON \`order_discounts\``
    )
    await queryRunner.query(`DROP TABLE \`order_discounts\``)
    await queryRunner.query(`DROP TABLE \`discount_types\``)
    await queryRunner.query(`DROP INDEX \`receipt_number\` ON \`payments\``)
    await queryRunner.query(`DROP INDEX \`payments_order_idx\` ON \`payments\``)
    await queryRunner.query(`DROP TABLE \`payments\``)
    await queryRunner.query(
      `DROP INDEX \`table_number\` ON \`restaurant_tables\``
    )
    await queryRunner.query(`DROP TABLE \`restaurant_tables\``)
    await queryRunner.query(
      `DROP INDEX \`reservations_date_time_idx\` ON \`reservations\``
    )
    await queryRunner.query(`DROP TABLE \`reservations\``)
    await queryRunner.query(`DROP INDEX \`email\` ON \`customers\``)
    await queryRunner.query(`DROP TABLE \`customers\``)
    await queryRunner.query(
      `DROP INDEX \`loyalty_tx_customer_idx\` ON \`loyalty_transactions\``
    )
    await queryRunner.query(`DROP TABLE \`loyalty_transactions\``)
    await queryRunner.query(`DROP TABLE \`loyalty_rewards\``)
    await queryRunner.query(
      `DROP INDEX \`menu_ingredients_inv_idx\` ON \`menu_item_ingredients\``
    )
    await queryRunner.query(`DROP TABLE \`menu_item_ingredients\``)
    await queryRunner.query(
      `DROP INDEX \`inventory_cat_active_idx\` ON \`inventory_items\``
    )
    await queryRunner.query(`DROP TABLE \`inventory_items\``)
    await queryRunner.query(
      `DROP INDEX \`inv_stock_logs_item_idx\` ON \`inventory_stock_logs\``
    )
    await queryRunner.query(
      `DROP INDEX \`inv_stock_logs_menu_idx\` ON \`inventory_stock_logs\``
    )
    await queryRunner.query(`DROP TABLE \`inventory_stock_logs\``)
    await queryRunner.query(`DROP TABLE \`inventory_categories\``)
    await queryRunner.query(`DROP INDEX \`code\` ON \`branches\``)
    await queryRunner.query(`DROP TABLE \`branches\``)
    await queryRunner.query(
      `DROP INDEX \`audit_logs_user_idx\` ON \`audit_logs\``
    )
    await queryRunner.query(
      `DROP INDEX \`audit_logs_entity_idx\` ON \`audit_logs\``
    )
    await queryRunner.query(`DROP TABLE \`audit_logs\``)
    await queryRunner.query(
      `DROP INDEX \`att_logs_employee_idx\` ON \`attendance_logs\``
    )
    await queryRunner.query(`DROP TABLE \`attendance_logs\``)
    await queryRunner.query(
      `DROP INDEX \`REL_2d83c53c3e553a48dadb9722e3\` ON \`employees\``
    )
    await queryRunner.query(`DROP INDEX \`user_id\` ON \`employees\``)
    await queryRunner.query(`DROP INDEX \`employee_number\` ON \`employees\``)
    await queryRunner.query(`DROP INDEX \`rfid_card_uid\` ON \`employees\``)
    await queryRunner.query(`DROP TABLE \`employees\``)
    await queryRunner.query(
      `DROP INDEX \`payroll_rec_emp_period_idx\` ON \`payroll_records\``
    )
    await queryRunner.query(`DROP TABLE \`payroll_records\``)
    await queryRunner.query(`DROP TABLE \`payroll_deductions\``)
    await queryRunner.query(`DROP TABLE \`deduction_types\``)
    await queryRunner.query(`DROP TABLE \`payroll_periods\``)
    await queryRunner.query(`DROP INDEX \`email\` ON \`users\``)
    await queryRunner.query(`DROP INDEX \`users_role_idx\` ON \`users\``)
    await queryRunner.query(`DROP TABLE \`users\``)
    await queryRunner.query(`DROP INDEX \`name\` ON \`roles\``)
    await queryRunner.query(`DROP TABLE \`roles\``)
    await queryRunner.query(`DROP INDEX \`code\` ON \`permissions\``)
    await queryRunner.query(`DROP TABLE \`permissions\``)
    await queryRunner.query(`DROP INDEX \`migration_unique\` ON \`migrations\``)
    await queryRunner.query(`DROP TABLE \`migrations\``)
  }
}
