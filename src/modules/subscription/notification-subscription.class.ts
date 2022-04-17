import { NotificationSubscriptionKeys } from './notification-subscription.interfaces';

export class NotificationSubscription {
  endpoint: string;

  expirationTime: any;

  keys: NotificationSubscriptionKeys;
}
