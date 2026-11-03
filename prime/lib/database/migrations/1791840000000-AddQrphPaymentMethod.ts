import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddQrphPaymentMethod1791840000000 implements MigrationInterface {
  name = "AddQrphPaymentMethod1791840000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `payments` MODIFY `payment_method` enum ('cash', 'gcash', 'maya', 'qrph', 'card', 'other') NOT NULL"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE `payments` SET `payment_method` = 'other' WHERE `payment_method` = 'qrph'"
    )
    await queryRunner.query(
      "ALTER TABLE `payments` MODIFY `payment_method` enum ('cash', 'gcash', 'maya', 'card', 'other') NOT NULL"
    )
  }
}
