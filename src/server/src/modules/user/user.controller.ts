import { Controller, Get, Put, Body, UseGuards, Request, BadRequestException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { UserService } from './user.service'

@Controller('user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.userService.findById(req.user.id)
  }

  @Put('profile')
  async updateProfile(@Request() req, @Body() data: any) {
    return this.userService.update(req.user.id, data)
  }

  @Get('subscription')
  async getSubscription(@Request() req) {
    const user = await this.userService.findById(req.user.id)
    if (!user) {
      throw new BadRequestException('User not found')
    }
    return {
      isVip: user.role === 'vip' && !!user.vipExpireAt && user.vipExpireAt > new Date(),
      vipExpireAt: user.vipExpireAt,
    }
  }
}
