import { Test, TestingModule } from '@nestjs/testing';
import { NotificationSubscriptionRepository } from './notification-subscription.repository';

describe('NotificationSubscriptionRepository', () => {
  let notificationSubscriptionRepository: NotificationSubscriptionRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationSubscriptionRepository],
    }).compile();

    notificationSubscriptionRepository = module.get<
      NotificationSubscriptionRepository
    >(NotificationSubscriptionRepository);
  });

  describe('saveSubscription', () => {
    it('should save subscription', async () => {
      const token = 'token';
      const userId = 'userid';
      const subscriptionForSaving = {
        token,
        userId,
        isActive: true,
        isValid: true,
      };
      const saveSpy = jest
        .spyOn(notificationSubscriptionRepository, 'save')
        .mockResolvedValue(undefined);

      await notificationSubscriptionRepository.saveSubscription(token, userId);

      expect(saveSpy).toHaveBeenCalledWith(subscriptionForSaving);
    });
  });
});
