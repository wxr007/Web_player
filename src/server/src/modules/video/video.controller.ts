import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { VideoService } from './video.service'

@ApiTags('视频')
@Controller('videos')
export class VideoController {
  constructor(private videoService: VideoService) {}

  @ApiOperation({ summary: '获取视频列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'tag', required: false, description: '标签' })
  @ApiQuery({ name: 'status', required: false, description: '状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
    @Query('tag') tag?: string,
    @Query('status') status?: string,
  ) {
    return this.videoService.findAll({ page, pageSize, keyword, tag, status })
  }

  @ApiOperation({ summary: '获取视频详情' })
  @ApiParam({ name: 'id', description: '视频ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '视频不存在' })
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.videoService.findById(id)
  }

  @ApiOperation({ summary: '获取视频播放地址' })
  @ApiParam({ name: 'id', description: '视频ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '视频不存在' })
  @ApiResponse({ status: 403, description: '需要VIP会员' })
  @Get(':id/play')
  async getPlayUrl(@Param('id') id: string, @Request() req) {
    return this.videoService.getPlayUrl(id, req.user)
  }

  @ApiOperation({ summary: '创建视频' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() data: any) {
    return this.videoService.create(data)
  }

  @ApiOperation({ summary: '更新视频' })
  @ApiParam({ name: 'id', description: '视频ID' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '视频不存在' })
  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() data: any) {
    return this.videoService.update(id, data)
  }

  @ApiOperation({ summary: '删除视频' })
  @ApiParam({ name: 'id', description: '视频ID' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Param('id') id: string) {
    return this.videoService.delete(id)
  }
}
