import { BaseEntity } from 'common/entities/base.entity';
import { FilterEntity } from 'modules/filter/filter.entity';
import { UserEntity } from 'modules/user/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({
  name: 'token',
})
export class TokenEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column()
  type: string;

  @Column()
  value: string;

  @Column({
    name: 'filter_id',
  })
  filterId: string;

  @Column({
    name: 'user_id',
  })
  userId: string;

  @ManyToOne(
    () => FilterEntity,
    filterEntity => filterEntity.tokens,
  )
  @JoinColumn({ name: 'filter_id' })
  filter?: FilterEntity;

  @ManyToOne(
    () => UserEntity,
    userEntity => userEntity.tokens,
  )
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;
}
