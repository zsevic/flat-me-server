import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateFilterTable1631305711849 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'filter',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            generationStrategy: 'uuid',
            isGenerated: true,
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'floor',
            type: 'varchar',
            isArray: true,
          },
          {
            name: 'furnished',
            type: 'varchar',
            isArray: true,
          },
          {
            name: 'min_price',
            type: 'decimal',
          },
          {
            name: 'max_price',
            type: 'decimal',
          },
          {
            name: 'municipalities',
            type: 'varchar',
            isArray: true,
          },
          {
            name: 'rent_or_sale',
            type: 'varchar',
          },
          {
            name: 'structures',
            type: 'decimal',
            isArray: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
          },
          {
            name: 'is_verified',
            type: 'boolean',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'current_timestamp',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'current_timestamp',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('filter');
  }
}
