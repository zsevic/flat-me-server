import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'filter';
const COLUMN_NAME = 'advertiser_types';

export class AddAdvertiserTypesFilterColumn1642779515749
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: COLUMN_NAME,
        type: 'varchar',
        isArray: true,
        default: 'array[]::varchar[]',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, COLUMN_NAME);
  }
}
