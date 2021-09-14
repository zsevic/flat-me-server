export interface ThrottlerStorage {
  addRecord(key: string, ttl: number): Promise<void>;

  getRecord(key: string): Promise<number[]>;
}
