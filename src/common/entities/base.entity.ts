import { CreateDateColumn, ObjectIdColumn, UpdateDateColumn } from 'typeorm';

export class BaseEntity {
  @ObjectIdColumn()
  _id?: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
