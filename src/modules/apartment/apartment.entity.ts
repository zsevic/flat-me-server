import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Location } from 'common/interfaces/location.interface';

@Entity({
  name: 'apartments',
})
export class ApartmentEntity extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  apartmentId: string;

  @Column()
  providerName: string;

  @Column()
  address: string;

  @Column({
    nullable: true,
  })
  availableFrom?: string;

  @Column()
  coverPhotoUrl: string;

  @Column()
  floor: string;

  @Column('varchar', { array: true })
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
