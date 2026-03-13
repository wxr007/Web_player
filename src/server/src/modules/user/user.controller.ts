import { Controller, Get, Put, Body, UseGuards, Request, BadRequestException, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { UserService } from './user.service'

@ApiTags('用户')
@ApiBearerAuth()
@Controller('user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  private readonly logger = new Logger(UserController.name)
  constructor(private userService: UserService) {}

  @ApiOperation({ summary: '获取用户个人资料' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Get('profile')
  async getProfile(@Request() req) {
    return this.userService.findById(req.user.id)
  }

  @ApiOperation({ summary: '更新用户个人资料' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '更新失败' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Put('profile')
  async updateProfile(@Request() req, @Body() data: any) {
    this.logger.log('Update profile request received', {
      userId: req.user.id,
      data: {
        username: data.username,
        email: data.email,
        avatarLength: data.avatar?.length,
        avatarPreview: data.avatar?.substring(0, 50) + '...'
      }
    })
    
    try {
      const result = await this.userService.update(req.user.id, data)
      this.logger.log('Profile updated successfully', { userId: req.user.id, result })
      return result
    } catch (error) {
      this.logger.error('Failed to update profile', error, { userId: req.user.id })
      throw error
    }
  }

  @ApiOperation({ summary: '获取用户订阅信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
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
