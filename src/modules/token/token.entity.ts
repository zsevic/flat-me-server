import { BaseEntity } from 'common/entities/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'token',
})
export class TokenEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({
    name: 'expires_at',
  })
  expiresAt: Date;

  @Column()
  value: string;

  @Column()
  filterId: string;

  @Column()
  userId: string;
}
