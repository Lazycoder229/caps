import type { MigrationInterface, QueryRunner } from "typeorm"

export class CreateCustomerDeliveryAddresses1793040000000 implements MigrationInterface {
  name = "CreateCustomerDeliveryAddresses1793040000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TABLE `customer_delivery_addresses` (`customer_id` char(36) NOT NULL, `label` enum ('home', 'work') NOT NULL, `recipient_name` varchar(100) NOT NULL, `contact_number` varchar(20) NOT NULL, `address` text NOT NULL, `latitude` decimal(10,7) NULL, `longitude` decimal(10,7) NULL, `instructions` text NULL, `is_default` tinyint NOT NULL DEFAULT '0', INDEX `customer_delivery_addresses_default_idx` (`customer_id`, `is_default`), PRIMARY KEY (`customer_id`, `label`), CONSTRAINT `customer_delivery_addresses_customer_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `customer_delivery_addresses`")
  }
}
