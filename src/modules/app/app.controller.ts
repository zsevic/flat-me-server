import { Controller, Get, Query, Sse } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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

    this.eventService.on('user.verified', data => {
      if (sseQuery.email !== data.email) return;

      subject$.next({ isVerifiedEmail: true });
    });

    this.eventService.on('filter.verified', () => {
      subject$.next({ isVerifiedFilter: true });
    });

    return subject$.pipe(
      map((data: MessageEventData): MessageEvent => ({ data })),
    );
  }
}
