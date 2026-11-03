import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm"

/**
 * Bookkeeping table of the existing migration tool (migration number + when it ran).
 * Named AppMigration to avoid clashing with TypeORM's own Migration class.
 *
 * If you also use TypeORM migrations, set `migrationsTableName: 'typeorm_migrations'`
 * in the DataSource so the two never share the table called `migrations`.
 */
@Entity("migrations")
@Index("migration_unique", ["migration"], { unique: true })
export class AppMigration {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number

  @Column({ type: "int" })
  migration!: number

  @Column({
    name: "applied_at",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  appliedAt!: Date
}
