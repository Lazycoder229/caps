import type { MigrationInterface, QueryRunner } from "typeorm"

export class CreateStaffSessions1792880000000 implements MigrationInterface {
  name = "CreateStaffSessions1792880000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TABLE `staff_sessions` (`token_hash` char(64) NOT NULL, `user_id` char(36) NOT NULL, `expires_at` datetime NOT NULL, `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX `staff_sessions_user_idx` (`user_id`), INDEX `staff_sessions_expires_idx` (`expires_at`), PRIMARY KEY (`token_hash`)) ENGINE=InnoDB"
    )
    await queryRunner.query(
      "ALTER TABLE `staff_sessions` ADD CONSTRAINT `staff_sessions_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `staff_sessions` DROP FOREIGN KEY `staff_sessions_user_fk`"
    )
    await queryRunner.query("DROP TABLE `staff_sessions`")
  }
}
