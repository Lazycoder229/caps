import type { MigrationInterface, QueryRunner } from "typeorm"

export class AllowUnassignedPaymentStaff1792480000000 implements MigrationInterface {
  name = "AllowUnassignedPaymentStaff1792480000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `payments` MODIFY `processed_by_staff_id` char(36) NULL"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE `payments` SET `processed_by_staff_id` = (SELECT `id` FROM `users` ORDER BY `created_at` ASC LIMIT 1) WHERE `processed_by_staff_id` IS NULL"
    )
    await queryRunner.query(
      "ALTER TABLE `payments` MODIFY `processed_by_staff_id` char(36) NOT NULL"
    )
  }
}
