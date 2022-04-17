import { ApartmentEntity } from 'modules/apartment/apartment.entity';
import { FilterEntity } from 'modules/filter/filter.entity';
import { NotificationSubscriptionEntity } from 'modules/subscription/notification-subscription.entity';
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

  @Column({
    nullable: true,
  })
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
  @JoinTable({
    name: 'user_received_apartment',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'apartment_id',
      referencedColumnName: 'id',
    },
  })
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

  @OneToMany(
    () => NotificationSubscriptionEntity,
    notificationSubscriptionEntity => notificationSubscriptionEntity.user,
  )
  notificationSubscriptions?: NotificationSubscriptionEntity[];
}
