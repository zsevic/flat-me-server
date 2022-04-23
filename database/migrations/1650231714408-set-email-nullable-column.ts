import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLE_NAME = 'user';
const TABLE_COLUMN = 'email';

export class SetEmailNullableColumn1650231714408 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "${TABLE_NAME}" ALTER COLUMN ${TABLE_COLUMN} DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "${TABLE_NAME}" SET ${TABLE_COLUMN} = 'placeholder' WHERE ${TABLE_COLUMN} IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "${TABLE_NAME}" ALTER COLUMN ${TABLE_COLUMN} SET NOT NULL`,
    );
  }
}
