import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { VideoService } from './video.service'

@Controller('videos')
export class VideoController {
  constructor(private videoService: VideoService) {}

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

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.videoService.findById(id)
  }

  @Get(':id/play')
  async getPlayUrl(@Param('id') id: string, @Request() req) {
    return this.videoService.getPlayUrl(id, req.user)
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() data: any) {
    return this.videoService.create(data)
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() data: any) {
    return this.videoService.update(id, data)
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Param('id') id: string) {
    return this.videoService.delete(id)
  }
}
