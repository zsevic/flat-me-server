import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { UserEntity } from 'modules/user/user.entity';

@Entity({
  name: 'filters',
})
export class FilterEntity extends BaseEntity {
  @Column()
  furnished: string[];

  @Column({
    name: 'min_price',
  })
  minPrice: number;

  @Column({
    name: 'max_price',
  })
  maxPrice: number;

  @Column()
  municipalities: string[];

  @Column({
    name: 'rent_or_sale',
  })
  rentOrSale: string;

  @Column()
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
  @Column()
  user: string;
}
