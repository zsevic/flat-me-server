import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { UserEntity } from 'modules/user/user.entity';
import { TokenEntity } from 'modules/token/token.entity';

@Entity({
  name: 'filter',
})
export class FilterEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column('varchar', { array: true })
  furnished: string[];

  @Column({
    name: 'min_price',
  })
  minPrice: number;

  @Column({
    name: 'max_price',
  })
  maxPrice: number;

  @Column('varchar', { array: true })
  municipalities: string[];

  @Column({
    name: 'rent_or_sale',
  })
  rentOrSale: string;

  @Column('decimal', { array: true })
  structures: number[];

  @Column({
    name: 'is_active',
    default: false,
  })
  isActive: boolean;

  @Column({
    name: 'is_verified',
    default: false,
  })
  isVerified: boolean;

  @ManyToOne(
    () => UserEntity,
    userEntity => userEntity.filters,
  )
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({
    name: 'user_id',
  })
  userId: string;

  @OneToMany(
    () => TokenEntity,
    tokenEntity => tokenEntity.filter,
  )
  tokens?: FilterEntity[];
}
