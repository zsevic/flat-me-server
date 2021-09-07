import { BaseEntity } from 'common/entities/base.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  name: 'token',
})
export class TokenEntity extends BaseEntity {
  @Column({
    name: 'expires_at',
  })
  expiresAt: Date;

  @Column()
  value: string;

  @Column()
  filter?: string;

  @Column()
  user?: string;
}
