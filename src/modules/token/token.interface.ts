export interface Token {
  id?: string;

  expiresAt: Date;

  value: string;

  filter?: string;

  user?: string;
}
