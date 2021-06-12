import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../events/user-created.event';

@Injectable()
export class UserCreatedListener {
  @OnEvent('user.created', { async: true })
  handleUserCreatedEvent(event: UserCreatedEvent) {
    console.log('sending verification email');
  }
}
