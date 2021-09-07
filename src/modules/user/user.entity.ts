import { ApartmentEntity } from 'modules/apartment/apartment.entity';
import { FilterEntity } from 'modules/filter/filter.entity';
import { TokenEntity } from 'modules/token/token.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
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

  @ManyToMany(() => ApartmentEntity)
  @JoinTable()
  apartments?: ApartmentEntity[];

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
