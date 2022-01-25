import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { isEnvironment } from 'common/utils';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly configService: ConfigService) {}

  async subscribeByEmail(email: string) {
    try {
      if (!isEnvironment('production')) return;

      await axios({
        url: 'https://api.sendgrid.com/v3/marketing/contacts',
        method: 'PUT',
        headers: {
          authorization: `Bearer ${this.configService.get('SENDGRID_API_KEY')}`,
        },
        data: {
          contacts: [
            {
              email,
            },
          ],
          list_ids: [this.configService.get('SENDGRID_MAILING_ID')],
        },
      });
    } catch (error) {
      this.logger.error(`Subscribing user with email ${email} failed`, error);
      throw new ConflictException();
    }
  }
}
