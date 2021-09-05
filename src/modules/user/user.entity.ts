import { FilterEntity } from 'modules/filter/filter.entity';
import { Column, Entity, ObjectIdColumn, OneToMany } from 'typeorm';
import { Subscription } from './subscription.enum';

@Entity({
  name: 'users',
})
export class UserEntity {
  @ObjectIdColumn()
  _id: string;

  @Column()
  email: string;

  @Column({
    name: 'is_verified',
    default: false,
  })
  isVerified: boolean;

  @Column({
    enum: Subscription,
    default: Subscription.FREE,
  })
  subscription: string;

  @OneToMany(
    () => FilterEntity,
    filterEntity => filterEntity.user,
  )
  @Column()
  filters: string[];

  @Column({
    name: 'received_apartments',
  })
  receivedApartments: string[];
}
