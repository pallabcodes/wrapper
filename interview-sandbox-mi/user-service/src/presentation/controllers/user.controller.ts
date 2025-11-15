import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { UserService } from '@application/services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.userService.getUserById(id);
    return {
      success: true,
      data: user,
    };
  }

  @Get()
  async getAllUsers() {
    const users = await this.userService.getAllUsers();
    return {
      success: true,
      data: users,
    };
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updates: any) {
    const user = await this.userService.updateUser(id, updates);
    return {
      success: true,
      data: user,
    };
  }
}

