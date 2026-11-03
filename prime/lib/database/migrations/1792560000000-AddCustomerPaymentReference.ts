import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddCustomerPaymentReference1792560000000 implements MigrationInterface {
  name = "AddCustomerPaymentReference1792560000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `orders` ADD `customer_payment_reference` varchar(100) NULL, ADD `payment_reference_token` char(36) NULL"
    )
    await queryRunner.query(
      "CREATE UNIQUE INDEX `orders_payment_reference_token_uq` ON `orders` (`payment_reference_token`)"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DROP INDEX `orders_payment_reference_token_uq` ON `orders`"
    )
    await queryRunner.query(
      "ALTER TABLE `orders` DROP COLUMN `payment_reference_token`, DROP COLUMN `customer_payment_reference`"
    )
  }
}
