import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from 'modules/mail/mail.service';
import { FeedbackService } from './feedback.service';

const mailService = {
  sendMailWithFeedback: jest.fn(),
};

describe('FeedbackService', () => {
  let feedbackService: FeedbackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: MailService,
          useValue: mailService,
        },
      ],
    }).compile();

    feedbackService = module.get<FeedbackService>(FeedbackService);
  });

  it('should throw an error when sending mail fails', async () => {
    const feedback = 'feedback';
    jest
      .spyOn(mailService, 'sendMailWithFeedback')
      .mockRejectedValue(new Error());

    await expect(feedbackService.sendFeedback(feedback)).rejects.toThrowError(
      InternalServerErrorException,
    );

    expect(mailService.sendMailWithFeedback).toHaveBeenCalledWith(feedback);
  });

  it('should send mail with feedback', async () => {
    const feedback = 'feedback';

    await feedbackService.sendFeedback(feedback);

    expect(mailService.sendMailWithFeedback).toHaveBeenCalledWith(feedback);
  });
});
