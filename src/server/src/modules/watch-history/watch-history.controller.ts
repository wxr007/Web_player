import { Controller, Get, Post, Body, Delete, UseGuards, Request, Query, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { WatchHistoryService } from './watch-history.service'

@ApiTags('观看历史')
@ApiBearerAuth()
@Controller('user/history')
@UseGuards(AuthGuard('jwt'))
export class WatchHistoryController {
  constructor(private readonly watchHistoryService: WatchHistoryService) {}

  @ApiOperation({ summary: '更新观看进度' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Post()
  async updateProgress(
    @Request() req,
    @Body() data: { videoId: string; progress: number },
  ) {
    const history = await this.watchHistoryService.updateProgress(
      req.user.id,
      data.videoId,
      data.progress,
    )
    return { success: true, history }
  }

  @ApiOperation({ summary: '获取观看历史' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Get()
  async getHistory(
    @Request() req,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.watchHistoryService.getHistory(req.user.id, page || 1, pageSize || 12)
  }

  @ApiOperation({ summary: '获取视频观看进度' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Get('progress/:videoId')
  async getProgress(@Request() req, @Param('videoId') videoId: string) {
    const progress = await this.watchHistoryService.getProgress(req.user.id, videoId)
    return { progress }
  }

  @ApiOperation({ summary: '清空观看历史' })
  @ApiResponse({ status: 200, description: '清空成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Delete('clear')
  async clearHistory(@Request() req) {
    await this.watchHistoryService.clearHistory(req.user.id)
    return { success: true }
  }

  @ApiOperation({ summary: '删除单个观看记录' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Delete(':videoId')
  async deleteHistoryItem(@Request() req, @Param('videoId') videoId: string) {
    await this.watchHistoryService.deleteHistoryItem(req.user.id, videoId)
    return { success: true }
  }
}
