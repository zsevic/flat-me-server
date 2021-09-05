import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { UserEntity } from 'modules/user/user.entity';

@Entity({
  name: 'filters',
})
export class FilterEntity extends BaseEntity {
  @Column()
  furnished: string[];

  @Column()
  minPrice: number;

  @Column()
  maxPrice: number;

  @Column()
  municipalities: string[];

  @Column()
  rentOrSale: string;

  @Column()
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
  @Column()
  user: string;
}
