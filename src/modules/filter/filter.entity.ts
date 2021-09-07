import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { UserEntity } from 'modules/user/user.entity';

@Entity({
  name: 'filters',
})
export class FilterEntity extends BaseEntity {
  @Column('varchar', { array: true })
  furnished: string[];

  @Column()
  minPrice: number;

  @Column()
  maxPrice: number;

  @Column('varchar', { array: true })
  municipalities: string[];

  @Column()
  rentOrSale: string;

  @Column('decimal', { array: true })
  structures: number[];

  @Column({
    default: false,
  })
  isActive: boolean;

  @Column({
    default: false,
  })
  isVerified: boolean;

  @ManyToOne(
    () => UserEntity,
    userEntity => userEntity.filters,
  )
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;
}
