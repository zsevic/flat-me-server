export interface Token {
  _id?: string;

  expiresAt: Date;

  value: string;

  filter?: string;

  user?: string;
}
