export interface Token {
  expiresAt: Date;

  value: string;

  filter?: string;

  user?: string;
}
