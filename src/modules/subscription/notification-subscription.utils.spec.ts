import { generateNotificationText } from './notification-subscription.utils';

describe('generateNotificationText', () => {
  it('should return notification for 1 apartment for rent', () => {
    const response = '1 novi stan za iznajmljivanje';

    expect(generateNotificationText('rent', 1)).toEqual(response);
  });

  it('should return notification for less than 5 apartments for sale', () => {
    const response = '2 nova stana za kupovinu';

    expect(generateNotificationText('sale', 2)).toEqual(response);
  });

  it('should return notification for more than 4 apartments for sale', () => {
    const response = '5 novih stanova za kupovinu';

    expect(generateNotificationText('sale', 5)).toEqual(response);
  });
});
