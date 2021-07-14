export interface MessageEventData {
  isVerifiedEmail?: boolean;
  isVerifiedFilter?: boolean;
}

export interface MessageEvent {
  data: MessageEventData;
  id?: string;
  type?: string;
  retry?: number;
}
