import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateApartmentTable1631304078495 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'apartment',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'apartment_id',
            type: 'varchar',
          },
          {
            name: 'provider_name',
            type: 'varchar',
          },
          {
            name: 'address',
            type: 'varchar',
          },
          {
            name: 'available_from',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'cover_photo_url',
            type: 'varchar',
          },
          {
            name: 'advertiser_logo_url',
            type: 'varchar',
          },
          {
            name: 'floor',
            type: 'varchar',
          },
          {
            name: 'heating_types',
            type: 'varchar',
            isArray: true,
          },
          {
            name: 'furnished',
            type: 'varchar',
          },
          {
            name: 'last_checked_at',
            type: 'timestamp',
            default: 'current_timestamp',
          },
          {
            name: 'location',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'municipality',
            type: 'varchar',
          },
          {
            name: 'place',
            type: 'varchar',
          },
          {
            name: 'posted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'price',
            type: 'decimal',
          },
          {
            name: 'rent_or_sale',
            type: 'varchar',
          },
          {
            name: 'size',
            type: 'decimal',
          },
          {
            name: 'structure',
            type: 'decimal',
          },
          {
            name: 'url',
            type: 'varchar',
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
    await queryRunner.dropTable('apartment');
  }
}
