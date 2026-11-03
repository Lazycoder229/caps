import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddGlobalPayrollContributionSettings1792160000000 implements MigrationInterface {
  name = "AddGlobalPayrollContributionSettings1792160000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `system_settings` ADD `payroll_sss_employee_share` decimal(10,2) NOT NULL DEFAULT '0.00', ADD `payroll_sss_employer_share` decimal(10,2) NOT NULL DEFAULT '255.00', ADD `payroll_philhealth_employee_share` decimal(10,2) NOT NULL DEFAULT '0.00', ADD `payroll_philhealth_employer_share` decimal(10,2) NOT NULL DEFAULT '125.00', ADD `payroll_pagibig_employee_share` decimal(10,2) NOT NULL DEFAULT '0.00', ADD `payroll_pagibig_employer_share` decimal(10,2) NOT NULL DEFAULT '4.50'"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `system_settings` DROP COLUMN `payroll_pagibig_employer_share`, DROP COLUMN `payroll_pagibig_employee_share`, DROP COLUMN `payroll_philhealth_employer_share`, DROP COLUMN `payroll_philhealth_employee_share`, DROP COLUMN `payroll_sss_employer_share`, DROP COLUMN `payroll_sss_employee_share`"
    )
  }
}
