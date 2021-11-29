import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Location } from 'common/interfaces/location.interface';

@Entity({
  name: 'apartment',
})
export class ApartmentEntity extends BaseEntity {
  @PrimaryColumn('varchar')
  id: string;

  @Column({
    name: 'apartment_id',
  })
  apartmentId: string;

  @Column({
    name: 'provider_name',
  })
  providerName: string;

  @Column()
  address: string;

  @Column({
    name: 'available_from',
    nullable: true,
    type: 'timestamp',
  })
  availableFrom?: Date;

  @Column({
    name: 'cover_photo_url',
  })
  coverPhotoUrl: string;

  @Column({
    name: 'advertiser_name',
    nullable: true,
  })
  advertiserName?: string;

  @Column()
  floor: string;

  @Column({ name: 'heating_types', type: 'varchar', array: true })
  heatingTypes: string[];

  @Column()
  furnished: string;

  @Column({
    name: 'last_checked_at',
    type: 'timestamp',
  })
  lastCheckedAt: Date;

  @Column({
    nullable: true,
    type: 'jsonb',
  })
  location?: Location;

  @Column()
  municipality: string;

  @Column()
  place: string;

  @Column({
    name: 'posted_at',
    nullable: true,
    type: 'timestamp',
  })
  postedAt?: Date;

  @Column()
  price: number;

  @Column({
    name: 'rent_or_sale',
  })
  rentOrSale: string;

  @Column()
  size: number;

  @Column({
    type: 'decimal',
  })
  structure: number;

  @Column()
  url: string;
}
