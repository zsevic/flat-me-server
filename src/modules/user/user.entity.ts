import { FilterEntity } from 'modules/filter/filter.entity';
import { TokenEntity } from 'modules/token/token.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Subscription } from './subscription.enum';

@Entity({
  name: 'user',
})
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({
    name: 'is_verified',
    default: false,
  })
  isVerified: boolean;

  @Column({
    default: Subscription.FREE,
  })
  subscription: string;

  @Column({ name: 'received_apartments', type: 'varchar', array: true })
  receivedApartments: string[];

  @OneToMany(
    () => FilterEntity,
    filterEntity => filterEntity.user,
  )
  filters?: FilterEntity[];

  @OneToMany(
    () => TokenEntity,
    tokenEntity => tokenEntity.user,
  )
  tokens?: FilterEntity[];
}
