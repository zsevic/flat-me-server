import { Column, Entity, ObjectIdColumn } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Location } from 'common/interfaces/location.interface';

@Entity({
  name: 'apartments',
})
export class ApartmentEntity extends BaseEntity {
  @ObjectIdColumn()
  _id: string;

  @Column()
  apartmentId: string;

  @Column()
  providerName: string;

  @Column()
  address: string;

  @Column()
  availableFrom?: string;

  @Column()
  coverPhotoUrl: string;

  @Column()
  floor: string;

  @Column()
  heatingTypes: string[];

  @Column()
  furnished: string;

  @Column()
  location?: Location;

  @Column()
  municipality: string;

  @Column()
  place: string;

  @Column()
  postedAt: string;

  @Column()
  price: number;

  @Column()
  rentOrSale: string;

  @Column()
  size: number;

  @Column()
  structure: number;

  @Column()
  url: string;
}
