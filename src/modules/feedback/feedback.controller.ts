import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { FeedbackDto } from './feedback.dto';
import { FeedbackService } from './feedback.service';

@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  sendFeedback(@Body() feedbackDto: FeedbackDto): Promise<void> {
    return this.feedbackService.sendFeedback(feedbackDto.text);
  }
}
