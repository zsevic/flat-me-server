import { BaseEntity } from 'common/entities/base.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  name: 'tokens',
})
export class TokenEntity extends BaseEntity {
  @Column()
  expiresAt: Date;

  @Column()
  value: string;

  @Column()
  filter?: string;

  @Column()
  user?: string;
}
