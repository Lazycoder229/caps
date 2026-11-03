import type { MigrationInterface, QueryRunner } from "typeorm"

export class CreateCustomerSessions1792640000000 implements MigrationInterface {
  name = "CreateCustomerSessions1792640000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TABLE `customer_sessions` (`token_hash` char(64) NOT NULL, `customer_id` char(36) NOT NULL, `expires_at` datetime NOT NULL, `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX `customer_sessions_customer_idx` (`customer_id`), INDEX `customer_sessions_expires_idx` (`expires_at`), PRIMARY KEY (`token_hash`), CONSTRAINT `customer_sessions_customer_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `customer_sessions`")
  }
}
