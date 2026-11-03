import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddPaymentMethodSettings1792320000000 implements MigrationInterface {
  name = "AddPaymentMethodSettings1792320000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `system_settings` ADD `payment_cash_enabled` tinyint NOT NULL DEFAULT 1, ADD `payment_gcash_enabled` tinyint NOT NULL DEFAULT 1, ADD `payment_maya_enabled` tinyint NOT NULL DEFAULT 1, ADD `payment_qrph_enabled` tinyint NOT NULL DEFAULT 1"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `system_settings` DROP COLUMN `payment_qrph_enabled`, DROP COLUMN `payment_maya_enabled`, DROP COLUMN `payment_gcash_enabled`, DROP COLUMN `payment_cash_enabled`"
    )
  }
}
