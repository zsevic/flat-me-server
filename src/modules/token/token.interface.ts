export interface Token {
  id?: string;

  expiresAt: Date;

  value: string;

  filterId: string;

  userId: string;
}
