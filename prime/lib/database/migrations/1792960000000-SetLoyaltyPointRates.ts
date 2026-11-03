import type { MigrationInterface, QueryRunner } from "typeorm"

export class SetLoyaltyPointRates1792960000000 implements MigrationInterface {
  name = "SetLoyaltyPointRates1792960000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE `loyalty_settings` SET `points_per_peso` = 5, `peso_value_per_point` = 0.25"
    )
    await queryRunner.query(
      "ALTER TABLE `loyalty_settings` ALTER COLUMN `points_per_peso` SET DEFAULT 5.00"
    )
    await queryRunner.query(
      "ALTER TABLE `loyalty_settings` ALTER COLUMN `peso_value_per_point` SET DEFAULT 0.25"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `loyalty_settings` ALTER COLUMN `points_per_peso` SET DEFAULT 1.00"
    )
    await queryRunner.query(
      "ALTER TABLE `loyalty_settings` ALTER COLUMN `peso_value_per_point` SET DEFAULT 0.50"
    )
  }
}
