import { Column, Entity, ObjectIdColumn } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Location } from 'common/interfaces/location.interface';

@Entity({
  name: 'apartments',
})
export class ApartmentEntity extends BaseEntity {
  @ObjectIdColumn()
  _id: string;

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
  })
  availableFrom?: string;

  @Column({
    name: 'cover_photo_url',
  })
  coverPhotoUrl: string;

  @Column()
  floor: string;

  @Column({
    name: 'heating_types',
  })
  heatingTypes: string[];

  @Column()
  furnished: string;

  @Column()
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
