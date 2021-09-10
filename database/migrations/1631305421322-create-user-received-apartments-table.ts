import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserReceivedApartmentsTable1631305421322
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_received_apartment',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'apartment_id',
            type: 'varchar',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_received_apartment');
  }
}
