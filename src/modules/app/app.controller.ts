import { Controller, Get, Query, Sse } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FILTER_VERIFIED } from 'common/events/constants';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { MessageEvent, MessageEventData } from './message-event.interface';
import { SseQueryDto } from './sse-query.dto';

@Controller()
export class AppController {
  constructor(private readonly eventService: EventEmitter2) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Sse('sse')
  sse(@Query() sseQuery: SseQueryDto): Observable<MessageEvent> {
    const subject$ = new Subject();

    this.eventService.on(FILTER_VERIFIED, data => {
      if (sseQuery.email !== data.email) return;

      subject$.next({ isVerifiedFilter: true });
    });

    return subject$.pipe(
      map((data: MessageEventData): MessageEvent => ({ data })),
    );
  }
}
