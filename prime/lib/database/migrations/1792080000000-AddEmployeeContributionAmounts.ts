import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddEmployeeContributionAmounts1792080000000 implements MigrationInterface {
  name = "AddEmployeeContributionAmounts1792080000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `employees` ADD `sss_employee_share` decimal(10,2) NOT NULL DEFAULT '0.00', ADD `sss_employer_share` decimal(10,2) NOT NULL DEFAULT '0.00', ADD `philhealth_employee_share` decimal(10,2) NOT NULL DEFAULT '0.00', ADD `philhealth_employer_share` decimal(10,2) NOT NULL DEFAULT '0.00', ADD `pagibig_employee_share` decimal(10,2) NOT NULL DEFAULT '0.00', ADD `pagibig_employer_share` decimal(10,2) NOT NULL DEFAULT '0.00'"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `employees` DROP COLUMN `pagibig_employer_share`, DROP COLUMN `pagibig_employee_share`, DROP COLUMN `philhealth_employer_share`, DROP COLUMN `philhealth_employee_share`, DROP COLUMN `sss_employer_share`, DROP COLUMN `sss_employee_share`"
    )
  }
}
