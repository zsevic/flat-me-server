export interface InitialToken {
  expiresAt: Date;

  value: string;
}

export interface Token extends InitialToken {
  filter?: string;

  user?: string;
}
