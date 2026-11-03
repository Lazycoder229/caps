import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddCustomerDelivery1792600000000 implements MigrationInterface {
  name = "AddCustomerDelivery1792600000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `orders` MODIFY `order_type` enum ('qr', 'counter', 'delivery') NOT NULL, ADD `delivery_fee` decimal(10,2) NOT NULL DEFAULT '0.00'"
    )
    await queryRunner.query(
      "ALTER TABLE `system_settings` ADD `delivery_enabled` tinyint NOT NULL DEFAULT '1', ADD `delivery_fee` decimal(10,2) NOT NULL DEFAULT '49.00', ADD `delivery_minimum_order` decimal(10,2) NOT NULL DEFAULT '0.00'"
    )
    await queryRunner.query(
      "CREATE TABLE `deliveries` (`id` char(36) NOT NULL, `order_id` char(36) NOT NULL, `recipient_name` varchar(100) NOT NULL, `recipient_phone` varchar(20) NOT NULL, `address` text NOT NULL, `latitude` decimal(10,7) NOT NULL, `longitude` decimal(10,7) NOT NULL, `delivery_fee` decimal(10,2) NOT NULL, `instructions` text NULL, `status` enum ('pending', 'assigned', 'picked_up', 'delivered', 'failed', 'cancelled') NOT NULL DEFAULT 'pending', `assigned_rider_id` char(36) NULL, `picked_up_at` datetime NULL, `delivered_at` datetime NULL, `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updated_at` timestamp NULL, UNIQUE INDEX `deliveries_order_uq` (`order_id`), INDEX `deliveries_status_idx` (`status`), INDEX `deliveries_rider_idx` (`assigned_rider_id`), PRIMARY KEY (`id`), CONSTRAINT `deliveries_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `deliveries`")
    await queryRunner.query(
      "ALTER TABLE `system_settings` DROP COLUMN `delivery_minimum_order`, DROP COLUMN `delivery_fee`, DROP COLUMN `delivery_enabled`"
    )
    await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `delivery_fee`")
    await queryRunner.query(
      "UPDATE `orders` SET `order_type` = 'counter' WHERE `order_type` = 'delivery'"
    )
    await queryRunner.query(
      "ALTER TABLE `orders` MODIFY `order_type` enum ('qr', 'counter') NOT NULL"
    )
  }
}
