import {
  BadRequestException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { RentOrSale } from 'modules/filter/filter.enums';
import { FilterRepository } from 'modules/filter/filter.repository';
import { Subscription } from 'modules/user/subscription.enum';
import { UserRepository } from 'modules/user/user.repository';
import { NotificationSubscriptionRepository } from './notification-subscription.repository';
import { SUBSCRIPTION_URL } from './subscription.constants';
import { SubscriptionService } from './subscription.service';

const configService = {
  get: jest.fn(),
};

const filterRepository = {
  createFilter: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  saveFilterForNotificationSubscription: jest.fn(),
  update: jest.fn(),
};

const notificationSubscriptionRepository = {
  findOne: jest.fn(),
  saveSubscription: jest.fn(),
  update: jest.fn(),
};

const userRepository = {
  save: jest.fn(),
  update: jest.fn(),
};

jest.mock('typeorm-transactional-cls-hooked', () => ({
  Transactional: () => () => ({}),
}));

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: FilterRepository,
          useValue: filterRepository,
        },
        {
          provide: NotificationSubscriptionRepository,
          useValue: notificationSubscriptionRepository,
        },
        {
          provide: UserRepository,
          useValue: userRepository,
        },
      ],
    }).compile();

    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
  });

  describe('sendNotification', () => {
    it('should unverify user when subscription is not found', async () => {
      const filter = {
        userId: 'userid',
        rentOrSale: 'rent',
        municipalities: ['Palilula'],
        structures: [1, 1.5],
        furnished: ['semi-furnished'],
        minPrice: 200,
        maxPrice: 300,
        isActive: true,
        isVerified: true,
      };
      const updateSpy = jest.spyOn(userRepository, 'update');

      await subscriptionService.sendNotification(filter, 1);

      expect(updateSpy).toHaveBeenCalledWith(
        {
          id: filter.userId,
        },
        {
          isVerified: false,
        },
      );
    });

    it('should invalidate subscription', async () => {
      const userId = 'userid';
      const filter = {
        userId,
        rentOrSale: 'rent',
        municipalities: ['Palilula'],
        structures: [1, 1.5],
        furnished: ['semi-furnished'],
        minPrice: 200,
        maxPrice: 300,
        isActive: true,
        isVerified: true,
      };
      const subscription = {
        userId,
        token: 'token',
        isActive: true,
        isValid: true,
      };
      jest
        .spyOn(notificationSubscriptionRepository, 'findOne')
        .mockResolvedValue(subscription);
      const subscriptionUpdateSpy = jest.spyOn(
        notificationSubscriptionRepository,
        'update',
      );
      jest.spyOn(configService, 'get').mockReturnValue('url');
      jest.spyOn(axios, 'post').mockResolvedValue({
        data: {
          results: [
            {
              error: 'InvalidRegistration',
            },
          ],
        },
      });

      await subscriptionService.sendNotification(filter, 1);

      expect(subscriptionUpdateSpy).toHaveBeenCalledWith(
        {
          token: subscription.token,
        },
        {
          isValid: false,
        },
      );
    });

    it('should handle not registered subscription', async () => {
      const userId = 'userid';
      const filter = {
        userId,
        rentOrSale: 'rent',
        municipalities: ['Palilula'],
        structures: [1, 1.5],
        furnished: ['semi-furnished'],
        minPrice: 200,
        maxPrice: 300,
        isActive: true,
        isVerified: true,
      };
      const subscription = {
        userId,
        token: 'token',
        isActive: true,
        isValid: true,
      };
      jest
        .spyOn(notificationSubscriptionRepository, 'findOne')
        .mockResolvedValue(subscription);
      const subscriptionUpdateSpy = jest.spyOn(
        notificationSubscriptionRepository,
        'update',
      );
      jest.spyOn(configService, 'get').mockReturnValue('url');
      jest.spyOn(axios, 'post').mockResolvedValue({
        data: {
          results: [
            {
              error: 'NotRegistered',
            },
          ],
        },
      });

      const response = await subscriptionService.sendNotification(filter, 1);

      expect(response).not.toBe(true);
      expect(subscriptionUpdateSpy).not.toBeCalled();
    });

    it('should send notification', async () => {
      const userId = 'userid';
      const filter = {
        userId,
        rentOrSale: 'rent',
        municipalities: ['Palilula'],
        structures: [1, 1.5],
        furnished: ['semi-furnished'],
        minPrice: 200,
        maxPrice: 300,
        isActive: true,
        isVerified: true,
      };
      const subscription = {
        userId,
        token: 'token',
        isActive: true,
        isValid: true,
      };
      const key = 'key';
      const clientUrl = 'url';
      jest
        .spyOn(notificationSubscriptionRepository, 'findOne')
        .mockResolvedValue(subscription);
      jest.spyOn(configService, 'get').mockReturnValueOnce(key);
      jest.spyOn(configService, 'get').mockReturnValueOnce(clientUrl);
      const postRequestSpy = jest.spyOn(axios, 'post').mockResolvedValue({
        data: {
          success: 1,
        },
      });

      const response = await subscriptionService.sendNotification(filter, 1);

      expect(postRequestSpy).toBeCalledWith(
        SUBSCRIPTION_URL,
        {
          notification: {
            title: 'Novi pronađeni stanovi',
            body: '1 novi stan za iznajmljivanje',
            click_action: 'url/app?tab=2&foundCounter=1',
            icon: 'url/icons/icon-128x128.png',
          },
          to: subscription.token,
        },
        {
          headers: {
            Authorization: 'key=key',
            'Content-Type': 'application/json',
          },
        },
      );
      expect(response).toEqual(true);
    });
  });

  describe('subscribeForNotifications', () => {
    it('should subscribe for new filter', async () => {
      const subscriptionType = Subscription.FREE;
      const subscriptionDto = {
        filter: {
          advertiserTypes: [],
          rentOrSale: RentOrSale.rent,
          municipalities: ['Palilula'],
          structures: [],
          furnished: ['semi-furnished'],
          minPrice: 200,
          maxPrice: 300,
        },
        token: 'token',
      };
      const newUser = {
        id: 'userid',
      };
      const userSaveSpy = jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue(newUser);
      const saveFilterSpy = jest.spyOn(
        filterRepository,
        'saveFilterForNotificationSubscription',
      );
      const saveSubscriptionSpy = jest.spyOn(
        notificationSubscriptionRepository,
        'saveSubscription',
      );

      const response = await subscriptionService.subscribeForNotifications(
        subscriptionDto,
      );

      expect(response.isUpdated).toEqual(false);
      expect(userSaveSpy).toHaveBeenCalledWith({
        isVerified: true,
        subscription: subscriptionType,
        receivedApartments: [],
      });
      expect(saveFilterSpy).toHaveBeenCalledWith(
        subscriptionDto.filter,
        newUser.id,
      );
      expect(saveSubscriptionSpy).toHaveBeenCalledWith(
        subscriptionDto.token,
        newUser.id,
      );
    });

    it('should add first subscription', async () => {
      const token = 'token';
      const subscriptionDto = {
        filter: {
          advertiserTypes: [],
          rentOrSale: RentOrSale.rent,
          municipalities: ['Palilula'],
          structures: [],
          furnished: ['semi-furnished'],
          minPrice: 200,
          maxPrice: 300,
        },
        token,
      };
      const foundSubscription = {
        token,
        userId: 'userid',
      };
      jest
        .spyOn(notificationSubscriptionRepository, 'findOne')
        .mockResolvedValue(foundSubscription);
      jest
        .spyOn(filterRepository, 'createFilter')
        .mockReturnValue(subscriptionDto.filter);
      jest.spyOn(filterRepository, 'findAndCount').mockResolvedValue([null, 0]);

      const response = await subscriptionService.subscribeForNotifications(
        subscriptionDto,
      );

      expect(response.isUpdated).toEqual(false);
      expect(filterRepository.findAndCount).toHaveBeenCalledWith({
        userId: foundSubscription.userId,
        isActive: true,
      });
      expect(filterRepository.update).not.toHaveBeenCalled();
      expect(
        filterRepository.saveFilterForNotificationSubscription,
      ).toHaveBeenCalledWith(subscriptionDto.filter, foundSubscription.userId);
    });

    it('should update subscription for new filter', async () => {
      const token = 'token';
      const subscriptionDto = {
        filter: {
          advertiserTypes: [],
          rentOrSale: RentOrSale.rent,
          municipalities: ['Palilula'],
          structures: [],
          furnished: ['semi-furnished'],
          minPrice: 200,
          maxPrice: 300,
        },
        token,
      };
      const foundSubscription = {
        token,
        userId: 'userid',
      };
      jest
        .spyOn(notificationSubscriptionRepository, 'findOne')
        .mockResolvedValue(foundSubscription);
      jest
        .spyOn(filterRepository, 'createFilter')
        .mockReturnValue(subscriptionDto.filter);
      jest.spyOn(filterRepository, 'findAndCount').mockResolvedValue([null, 1]);

      const response = await subscriptionService.subscribeForNotifications(
        subscriptionDto,
      );

      expect(response.isUpdated).toEqual(true);
      expect(filterRepository.findAndCount).toHaveBeenCalledWith({
        userId: foundSubscription.userId,
        isActive: true,
      });
      expect(filterRepository.update).toHaveBeenCalledWith(
        {
          userId: foundSubscription.userId,
          isActive: true,
        },
        {
          isActive: false,
        },
      );
      expect(
        filterRepository.saveFilterForNotificationSubscription,
      ).toHaveBeenCalledWith(subscriptionDto.filter, foundSubscription.userId);
    });

    it('should throw an error when filter is already active', async () => {
      const token = 'token';
      const subscriptionDto = {
        filter: {
          advertiserTypes: [],
          rentOrSale: RentOrSale.rent,
          municipalities: ['Palilula'],
          structures: [],
          furnished: ['semi-furnished'],
          minPrice: 200,
          maxPrice: 300,
        },
        token,
      };
      const foundSubscription = {
        token,
        userId: 'userid',
      };
      jest
        .spyOn(notificationSubscriptionRepository, 'findOne')
        .mockResolvedValue(foundSubscription);
      jest
        .spyOn(filterRepository, 'createFilter')
        .mockReturnValue(subscriptionDto.filter);
      jest.spyOn(filterRepository, 'findOne').mockResolvedValue({
        ...subscriptionDto.filter,
        isActive: true,
      });

      await expect(
        subscriptionService.subscribeForNotifications(subscriptionDto),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('unsubscribeFromNotifications', () => {
    it('should throw an error when token is not found', async () => {
      await expect(
        subscriptionService.unsubscribeFromNotifications('token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an error when filter is not found', async () => {
      jest
        .spyOn(notificationSubscriptionRepository, 'findOne')
        .mockResolvedValue({
          userId: 'userid',
        });

      await expect(
        subscriptionService.unsubscribeFromNotifications('token'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should unsubscribe notifications from the found filter', async () => {
      const userId = 'userid';
      const filter = {
        advertiserTypes: [],
        rentOrSale: 'rent',
        municipalities: ['Palilula'],
        structures: [],
        furnished: ['semi-furnished'],
        minPrice: 200,
        maxPrice: 300,
        userId,
        isActive: true,
        isVerified: true,
      };
      jest
        .spyOn(notificationSubscriptionRepository, 'findOne')
        .mockResolvedValue({
          userId,
        });
      jest.spyOn(filterRepository, 'findOne').mockResolvedValue(filter);
      const saveFilterSpy = jest.spyOn(filterRepository, 'save');

      await subscriptionService.unsubscribeFromNotifications('token');

      expect(saveFilterSpy).toHaveBeenCalledWith({
        ...filter,
        isActive: false,
      });
    });
  });
});
