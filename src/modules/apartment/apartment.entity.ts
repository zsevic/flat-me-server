import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Location } from 'common/interfaces/location.interface';

@Entity({
  name: 'apartment',
})
export class ApartmentEntity extends BaseEntity {
  @PrimaryColumn()
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
  })
  availableFrom?: string;

  @Column({
    name: 'cover_photo_url',
  })
  coverPhotoUrl: string;

  @Column()
  floor: string;

  @Column({ name: 'heating_types', type: 'varchar', array: true })
  heatingTypes: string[];

  @Column()
  furnished: string;

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
  })
  postedAt: string;

  @Column()
  price: number;

  @Column({
    name: 'rent_or_sale',
  })
  rentOrSale: string;

  @Column()
  size: number;

  @Column()
  structure: number;

  @Column()
  url: string;
}
