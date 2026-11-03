import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddPayrollCalculationSettings1792000000000 implements MigrationInterface {
  name = "AddPayrollCalculationSettings1792000000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `system_settings` ADD `payroll_duty_hours` decimal(5,2) NOT NULL DEFAULT '8.00', ADD `payroll_unpaid_break_hours` decimal(5,2) NOT NULL DEFAULT '2.00', ADD `payroll_workdays_per_month` decimal(5,2) NOT NULL DEFAULT '26.00', ADD `payroll_overtime_multiplier` decimal(5,2) NOT NULL DEFAULT '1.25'"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `system_settings` DROP COLUMN `payroll_overtime_multiplier`, DROP COLUMN `payroll_workdays_per_month`, DROP COLUMN `payroll_unpaid_break_hours`, DROP COLUMN `payroll_duty_hours`"
    )
  }
}
