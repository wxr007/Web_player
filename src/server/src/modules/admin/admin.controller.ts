import { Controller, Get, Put, Delete, Query, Param, Body, UseGuards, BadRequestException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { UserService } from '../user/user.service'

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(private userService: UserService) {}

  // 获取用户列表
  @Get('users')
  async getUsers(@Query('page') page: number = 1, @Query('pageSize') pageSize: number = 10) {
    const [users, total] = await this.userService.findUsers(page, pageSize)
    return {
      list: users,
      total,
      page,
      pageSize
    }
  }

  // 获取用户详情
  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    const user = await this.userService.findById(id)
    if (!user) {
      throw new BadRequestException('User not found')
    }
    return user
  }

  // 更新用户信息
  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() data: any) {
    const user = await this.userService.update(id, data)
    if (!user) {
      throw new BadRequestException('User not found')
    }
    return user
  }

  // 删除用户
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    await this.userService.delete(id)
    return { message: 'User deleted successfully' }
  }

  // 设置用户 VIP 状态
  @Put('users/:id/vip')
  async setVipStatus(@Param('id') id: string, @Body() data: { isVip: boolean, expireAt?: Date }) {
    const user = await this.userService.findById(id)
    if (!user) {
      throw new BadRequestException('User not found')
    }

    const updateData: any = {
      role: data.isVip ? 'vip' : 'user'
    }

    if (data.isVip && data.expireAt) {
      updateData.vipExpireAt = data.expireAt
    } else {
      updateData.vipExpireAt = null
    }

    return this.userService.update(id, updateData)
  }
}