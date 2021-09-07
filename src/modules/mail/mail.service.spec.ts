import { MailerService } from '@nestjs-modules/mailer';
import { Test, TestingModule } from '@nestjs/testing';
import { getLocationUrl } from 'common/utils/location';
import { Apartment } from 'modules/apartment/apartment.interface';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { MailService } from './mail.service';

const mailerService = {
  sendMail: jest.fn(),
};

describe('MailService', () => {
  let mailService: MailService;
  const clientUrl = 'client-url';
  const senderEmail = 'info@flatme.com';
  const email = 'example@example.com';
  const mailInfo = {
    accepted: [email],
    rejected: [],
    envelopeTime: 169,
    messageTime: 165,
    messageSize: 544,
    response:
      '250 Accepted [STATUS=new MSGID=YSQgoO7epjDLxzysYSQhPcp.DDGKgisZAAAAAfUby9BASiJwUehOFn3NKPc]',
    envelope: { from: senderEmail, to: [email] },
    messageId: '<357f2d1a-daac-acbc-624f-1c5c37389530@flatme.com>',
  };
  const token = 'token';

  beforeAll(() => {
    process.env.CLIENT_URL = clientUrl;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mailerService,
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  describe('sendFilterVerificationMail', () => {
    it('should send filter verification mail', async () => {
      jest.spyOn(mailerService, 'sendMail').mockResolvedValue(mailInfo);

      await mailService.sendFilterVerificationMail(email, token);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'Potvrda pretrage',
        template: './filter-verification',
        context: {
          url: `client-url/filters/verification/${token}`,
        },
      });
    });
  });

  describe('sendMailWithNewApartments', () => {
    it('should send mail with new apartments', async () => {
      const apartmentList = [
        {
          price: 420,
          id: 'cetiriZida_60993e3e7906cd3a4c6832fd',
          apartmentId: '60993e3e7906cd3a4c6832fd',
          providerName: 'cetiriZida',
          address: 'Dalmatinska',
          coverPhotoUrl: 'cover-photo-url',
          floor: '1',
          furnished: 'furnished',
          heatingTypes: ['district'],
          municipality: 'Zvezdara',
          place: 'Zvezdara opština',
          postedAt: new Date('2021-05-10T16:07:58+02:00'),
          rentOrSale: 'rent',
          size: 69,
          structure: 1.5,
          url: 'https://4zida.rs/url',
          location: undefined,
        },
      ];
      const filter = {
        rentOrSale: 'rent',
        municipalities: ['Zvezdara'],
        structures: [1, 1.5],
        furnished: ['furnished'],
        minPrice: 200,
        maxPrice: 500,
      };
      const deactivationUrl = 'deactivation-url';
      jest.spyOn(mailerService, 'sendMail').mockResolvedValue(mailInfo);

      await mailService.sendMailWithNewApartments(
        email,
        apartmentList as Apartment[],
        filter as FilterDto,
        deactivationUrl,
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: `Found ${apartmentList.length} new apartment(s) for ${filter.rentOrSale}`,
        template: './new-apartments',
        context: {
          apartmentList: apartmentList.map(apartment => ({
            ...apartment,
            ...(apartment.location && {
              locationUrl: getLocationUrl(apartment.location),
            }),
          })),
          filter,
          name: 'user',
          deactivationUrl,
        },
      });
    });
  });
});
