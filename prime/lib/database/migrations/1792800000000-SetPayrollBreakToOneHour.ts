import type { MigrationInterface, QueryRunner } from "typeorm"

export class SetPayrollBreakToOneHour1792800000000 implements MigrationInterface {
  name = "SetPayrollBreakToOneHour1792800000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `system_settings` MODIFY `payroll_unpaid_break_hours` decimal(5,2) NOT NULL DEFAULT '1.00'"
    )
    await queryRunner.query(
      "UPDATE `system_settings` SET `payroll_unpaid_break_hours` = 1 WHERE `payroll_unpaid_break_hours` = 2"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `system_settings` MODIFY `payroll_unpaid_break_hours` decimal(5,2) NOT NULL DEFAULT '2.00'"
    )
  }
}
