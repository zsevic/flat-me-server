import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'apartment';
const COLUMN_NAME = 'advertiser_type';

export class AddAdvertiserTypeColumn1642774869735
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: COLUMN_NAME,
        type: 'varchar',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, COLUMN_NAME);
  }
}
