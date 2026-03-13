import { Controller, Get, Put, Delete, Query, Param, Body, UseGuards, BadRequestException } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { UserService } from '../user/user.service'

@ApiTags('管理员')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(private userService: UserService) {}

  @ApiOperation({ summary: '获取用户列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', default: 1 })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量', default: 10 })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
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

  @ApiOperation({ summary: '获取用户详情' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 400, description: '用户不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    const user = await this.userService.findById(id)
    if (!user) {
      throw new BadRequestException('User not found')
    }
    return user
  }

  @ApiOperation({ summary: '更新用户信息' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '用户不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() data: any) {
    const user = await this.userService.update(id, data)
    if (!user) {
      throw new BadRequestException('User not found')
    }
    return user
  }

  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    await this.userService.delete(id)
    return { message: 'User deleted successfully' }
  }

  @ApiOperation({ summary: '设置用户 VIP 状态' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isVip: { type: 'boolean', description: '是否为VIP' },
        expireAt: { type: 'string', format: 'date-time', description: '过期时间' }
      },
      required: ['isVip']
    }
  })
  @ApiResponse({ status: 200, description: '设置成功' })
  @ApiResponse({ status: 400, description: '用户不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
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