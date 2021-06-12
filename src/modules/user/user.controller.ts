import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('verify/:token')
  async verifyUser(@Param('token') token: string): Promise<void> {
    return this.userService.verifyUser(token);
  }
}
