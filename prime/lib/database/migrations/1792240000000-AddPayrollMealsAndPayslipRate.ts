import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddPayrollMealsAndPayslipRate1792240000000 implements MigrationInterface {
  name = "AddPayrollMealsAndPayslipRate1792240000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `system_settings` ADD `payroll_meals_deduction` decimal(10,2) NOT NULL DEFAULT '0.00'"
    )
    await queryRunner.query(
      "ALTER TABLE `payroll_records` ADD `daily_rate` decimal(10,2) NOT NULL DEFAULT '0.00'"
    )
    await queryRunner.query(
      "INSERT INTO `deduction_types` (`id`, `code`, `name`, `is_mandatory`, `is_active`) SELECT 'a4a4a4a4-4444-4444-8444-444444444444', 'MEALS', 'Meals deduction', 0, 1 WHERE NOT EXISTS (SELECT 1 FROM `deduction_types` WHERE `code` = 'MEALS')"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DELETE FROM `deduction_types` WHERE `code` = 'MEALS' AND NOT EXISTS (SELECT 1 FROM `payroll_deductions` WHERE `payroll_deductions`.`deduction_type_id` = `deduction_types`.`id`)"
    )
    await queryRunner.query(
      "ALTER TABLE `payroll_records` DROP COLUMN `daily_rate`"
    )
    await queryRunner.query(
      "ALTER TABLE `system_settings` DROP COLUMN `payroll_meals_deduction`"
    )
  }
}
