import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from 'modules/user/user.entity';
import { NotificationSubscription } from './notification-subscription.class';

@Entity({
  name: 'notification-subscription',
})
export class NotificationSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId: string;

  @Column({
    name: 'subscription',
    type: 'jsonb',
  })
  subscription: NotificationSubscription;

  @Column({
    name: 'is_valid',
  })
  isValid: boolean;

  @ManyToOne(
    () => UserEntity,
    userEntity => userEntity.notificationSubscriptions,
  )
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user?: UserEntity;
}
