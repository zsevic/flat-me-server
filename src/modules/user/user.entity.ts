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
    default: false,
  })
  isVerified: boolean;

  @Column({
    default: Subscription.FREE,
  })
  subscription: string;

  @OneToMany(
    () => FilterEntity,
    filterEntity => filterEntity.user,
  )
  @Column()
  filters: string[];

  @Column()
  receivedApartments: string[];
}
