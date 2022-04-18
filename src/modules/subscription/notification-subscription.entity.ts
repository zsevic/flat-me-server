import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from 'modules/user/user.entity';

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

  @Column()
  token: string;

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
