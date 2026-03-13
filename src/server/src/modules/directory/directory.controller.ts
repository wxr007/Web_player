import { Controller, Post, Get, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger'
import { DirectoryService } from './directory.service'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { UserRole } from '../../database/entities/user.entity'

@ApiTags('目录管理')
@ApiBearerAuth()
@Controller('directory')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class DirectoryController {
  constructor(private readonly directoryService: DirectoryService) {}

  @ApiOperation({ summary: '扫描目录' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '目录路径' }
      },
      required: ['path']
    }
  })
  @ApiResponse({ status: 200, description: '扫描完成' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @Post('scan')
  @HttpCode(HttpStatus.OK)
  async scanDirectory(@Body('path') directoryPath: string) {
    if (!directoryPath) {
      return {
        success: false,
        message: '目录路径不能为空'
      }
    }

    try {
      const result = await this.directoryService.scanDirectory(directoryPath)
      return {
        success: true,
        message: `扫描完成`,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        message: error.message
      }
    }
  }

  @ApiOperation({ summary: '获取目录列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @Get('list')
  @HttpCode(HttpStatus.OK)
  async getVideoDirectories() {
    try {
      const directories = await this.directoryService.getVideoDirectories()
      return {
        success: true,
        data: directories
      }
    } catch (error) {
      return {
        success: false,
        message: error.message
      }
    }
  }

  @ApiOperation({ summary: '移除目录' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '目录路径' }
      },
      required: ['path']
    }
  })
  @ApiResponse({ status: 200, description: '移除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @Delete('remove')
  @HttpCode(HttpStatus.OK)
  async removeDirectory(@Body('path') directoryPath: string) {
    if (!directoryPath) {
      return {
        success: false,
        message: '目录路径不能为空'
      }
    }

    try {
      const count = await this.directoryService.removeDirectory(directoryPath)
      return {
        success: true,
        message: `已移除 ${count} 个视频`,
        data: { count }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message
      }
    }
  }
}
