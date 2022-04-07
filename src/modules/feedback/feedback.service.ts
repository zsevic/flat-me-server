import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { MailService } from 'modules/mail/mail.service';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(private readonly mailService: MailService) {}

  async sendFeedback(feedback: string): Promise<void> {
    try {
      await this.mailService.sendMailWithFeedback(feedback);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Creating feedback failed');
    }
  }
}
