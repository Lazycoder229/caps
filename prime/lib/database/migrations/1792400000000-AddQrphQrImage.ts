import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddQrphQrImage1792400000000 implements MigrationInterface {
  name = "AddQrphQrImage1792400000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `system_settings` ADD `qrph_qr_image` longtext NULL"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `system_settings` DROP COLUMN `qrph_qr_image`"
    )
  }
}
