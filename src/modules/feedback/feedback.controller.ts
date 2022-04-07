import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  DEACTIVATION_FEEDBACK_LIMIT,
  DEACTIVATION_FEEDBACK_TTL,
} from 'common/config/rate-limiter';
import { FeedbackDto } from './feedback.dto';
import { FeedbackService } from './feedback.service';

@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Throttle(DEACTIVATION_FEEDBACK_LIMIT, DEACTIVATION_FEEDBACK_TTL)
  @Post()
  @HttpCode(HttpStatus.OK)
  sendFeedback(@Body() feedbackDto: FeedbackDto): Promise<void> {
    return this.feedbackService.sendFeedback(feedbackDto.text);
  }
}
