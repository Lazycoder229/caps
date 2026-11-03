import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddCustomerOrderHistoryVisibility1792720000000
  implements MigrationInterface
{
  name = "AddCustomerOrderHistoryVisibility1792720000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `orders` ADD `customer_hidden_at` datetime NULL"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `orders` DROP COLUMN `customer_hidden_at`"
    )
  }
}
