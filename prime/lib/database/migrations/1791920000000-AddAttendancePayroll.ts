import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddAttendancePayroll1791920000000 implements MigrationInterface {
  name = "AddAttendancePayroll1791920000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `payroll_records` ADD `paid_hours` decimal(7,2) NOT NULL DEFAULT '0.00', ADD `overtime_hours` decimal(7,2) NOT NULL DEFAULT '0.00', ADD `attendance_days` decimal(6,2) NOT NULL DEFAULT '0.00', MODIFY `processed_by_staff_id` char(36) NULL"
    )
    await queryRunner.query(
      "ALTER TABLE `payroll_deductions` ADD `employer_amount` decimal(10,2) NOT NULL DEFAULT '0.00', ADD `deduction_name` varchar(100) NULL"
    )
    await queryRunner.query(
      "ALTER TABLE `deduction_types` ADD `code` varchar(30) NULL"
    )
    await queryRunner.query(
      "CREATE UNIQUE INDEX `deduction_types_code_uq` ON `deduction_types` (`code`)"
    )
    await queryRunner.query(
      "INSERT IGNORE INTO `deduction_types` (`id`,`code`,`name`,`is_mandatory`,`is_active`) SELECT 'a1a1a1a1-1111-4111-8111-111111111111','SSS','SSS contribution',1,1 WHERE NOT EXISTS (SELECT 1 FROM `deduction_types` WHERE `code`='SSS')"
    )
    await queryRunner.query(
      "INSERT IGNORE INTO `deduction_types` (`id`,`code`,`name`,`is_mandatory`,`is_active`) SELECT 'a2a2a2a2-2222-4222-8222-222222222222','PHILHEALTH','PhilHealth contribution',1,1 WHERE NOT EXISTS (SELECT 1 FROM `deduction_types` WHERE `code`='PHILHEALTH')"
    )
    await queryRunner.query(
      "INSERT IGNORE INTO `deduction_types` (`id`,`code`,`name`,`is_mandatory`,`is_active`) SELECT 'a3a3a3a3-3333-4333-8333-333333333333','PAGIBIG','Pag-IBIG contribution',1,1 WHERE NOT EXISTS (SELECT 1 FROM `deduction_types` WHERE `code`='PAGIBIG')"
    )
    await queryRunner.query(
      "UPDATE IGNORE `deduction_types` SET `code`='SSS' WHERE `id`='a1a1a1a1-1111-4111-8111-111111111111' AND `code` IS NULL"
    )
    await queryRunner.query(
      "UPDATE IGNORE `deduction_types` SET `code`='PHILHEALTH' WHERE `id`='a2a2a2a2-2222-4222-8222-222222222222' AND `code` IS NULL"
    )
    await queryRunner.query(
      "UPDATE IGNORE `deduction_types` SET `code`='PAGIBIG' WHERE `id`='a3a3a3a3-3333-4333-8333-333333333333' AND `code` IS NULL"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE `deduction_types` SET `code` = NULL WHERE `id` IN ('a1a1a1a1-1111-4111-8111-111111111111','a2a2a2a2-2222-4222-8222-222222222222','a3a3a3a3-3333-4333-8333-333333333333')"
    )
    await queryRunner.query(
      "DELETE FROM `deduction_types` WHERE `id` IN ('a1a1a1a1-1111-4111-8111-111111111111','a2a2a2a2-2222-4222-8222-222222222222','a3a3a3a3-3333-4333-8333-333333333333') AND NOT EXISTS (SELECT 1 FROM `payroll_deductions` WHERE `payroll_deductions`.`deduction_type_id` = `deduction_types`.`id`)"
    )
    await queryRunner.query(
      "DROP INDEX `deduction_types_code_uq` ON `deduction_types`"
    )
    await queryRunner.query("ALTER TABLE `deduction_types` DROP COLUMN `code`")
    await queryRunner.query(
      "ALTER TABLE `payroll_deductions` DROP COLUMN `deduction_name`, DROP COLUMN `employer_amount`"
    )
    await queryRunner.query(
      "ALTER TABLE `payroll_records` DROP COLUMN `attendance_days`, DROP COLUMN `overtime_hours`, DROP COLUMN `paid_hours`"
    )
  }
}
