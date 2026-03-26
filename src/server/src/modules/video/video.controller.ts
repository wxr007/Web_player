import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Response, NotFoundException } from '@nestjs/common'
import { createReadStream } from 'fs'
import * as path from 'path'
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

  @ApiOperation({ summary: '获取视频字幕' })
  @ApiParam({ name: 'id', description: '视频ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '视频不存在' })
  @Get(':id/subtitles')
  async getVideoSubtitles(@Param('id') id: string) {
    const video = await this.videoService.findById(id)
    return video.subtitles || []
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

  @ApiOperation({ summary: '流式播放本地视频' })
  @ApiParam({ name: 'id', description: '视频ID' })
  @ApiResponse({ status: 200, description: '播放成功' })
  @ApiResponse({ status: 206, description: '部分内容' })
  @ApiResponse({ status: 404, description: '视频不存在' })
  @Get(':id/stream')
  async streamVideo(@Param('id') id: string, @Request() req, @Response() res) {
    console.log(`[Stream Video] 开始处理视频流请求，视频ID: ${id}`)
    
    try {
      const video = await this.videoService.findById(id)
      console.log(`[Stream Video] 找到视频: ${video.title}`)
      console.log(`[Stream Video] 本地路径: ${video.localPath}`)
      
      if (!video.localPath) {
        console.log(`[Stream Video] 视频文件不存在，视频ID: ${id}`)
        throw new NotFoundException('视频文件不存在')
      }
      
      // 检查文件是否存在
      const fs = require('fs')
      if (!fs.existsSync(video.localPath)) {
        console.log(`[Stream Video] 本地文件不存在: ${video.localPath}`)
        throw new NotFoundException('视频文件不存在')
      }
      
      // 获取文件信息
      const stat = fs.statSync(video.localPath)
      const fileSize = stat.size
      const range = req.headers.range
      
      console.log(`[Stream Video] 文件大小: ${fileSize}`)
      console.log(`[Stream Video] Range请求: ${range}`)
      
      if (range) {
        // 处理Range请求
        const parts = range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
        const chunkSize = (end - start) + 1
        
        console.log(`[Stream Video] 开始: ${start}, 结束: ${end}, 块大小: ${chunkSize}`)
        
        // 设置响应头
        res.set('Content-Range', `bytes ${start}-${end}/${fileSize}`)
        res.set('Accept-Ranges', 'bytes')
        res.set('Content-Length', chunkSize.toString())
        res.set('Content-Type', 'video/mp4')
        res.set('Content-Disposition', `inline; filename="${encodeURIComponent(video.title)}.mp4"`)
        
        // 发送部分内容
        res.status(206)
        
        const fileStream = fs.createReadStream(video.localPath, {
          start,
          end
        })
        
        // 处理流错误
        fileStream.on('error', (err: any) => {
          console.error(`[Stream Video] 文件流错误: ${err.message}`)
          res.status(500).send('视频文件读取失败')
        })
        
        // 处理流结束
        fileStream.on('end', () => {
          console.log(`[Stream Video] 视频流传输完成`)
        })
        
        fileStream.pipe(res)
      } else {
        // 处理完整请求
        console.log(`[Stream Video] 开始流式传输视频: ${video.localPath}`)
        
        // 设置响应头
        res.set('Content-Length', fileSize.toString())
        res.set('Content-Type', 'video/mp4')
        res.set('Content-Disposition', `inline; filename="${encodeURIComponent(video.title)}.mp4"`)
        res.set('Accept-Ranges', 'bytes')
        
        const fileStream = fs.createReadStream(video.localPath)
        
        // 处理流错误
        fileStream.on('error', (err: any) => {
          console.error(`[Stream Video] 文件流错误: ${err.message}`)
          res.status(500).send('视频文件读取失败')
        })
        
        // 处理流结束
        fileStream.on('end', () => {
          console.log(`[Stream Video] 视频流传输完成`)
        })
        
        fileStream.pipe(res)
      }
    } catch (error) {
      console.error(`[Stream Video] 错误: ${error.message}`)
      throw error
    }
  }

  @ApiOperation({ summary: '获取字幕文件' })
  @ApiParam({ name: 'id', description: '字幕ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '字幕不存在' })
  @Get('subtitles/:id')
  async getSubtitleFile(@Param('id') id: string, @Response() res) {
    console.log(`[Get Subtitle] 开始处理字幕文件请求，字幕ID: ${id}`)
    
    try {
      // 测试字幕端点
      if (id === 'test') {
        console.log(`[Get Subtitle] 测试字幕请求`)
        // 返回测试字幕内容
        const testSubtitle = `WEBVTT

00:00:00.000 --> 00:00:05.000
这是测试字幕，用于测试字幕功能

00:00:05.000 --> 00:00:10.000
如果看到此字幕，说明字幕功能正常`
        
        // 设置响应头
        res.set('Content-Length', testSubtitle.length.toString())
        res.set('Content-Type', 'text/vtt')
        res.set('Content-Disposition', 'inline; filename="test.vtt"')
        
        // 发送测试字幕
        res.status(200).send(testSubtitle)
        return
      }
      
      // 从数据库中获取字幕信息
      const subtitle = await this.videoService.getSubtitleById(id)
      console.log(`[Get Subtitle] 找到字幕: ${subtitle.name}`)
      console.log(`[Get Subtitle] 字幕路径: ${subtitle.ossKey}`)
      
      // 检查字幕文件是否存在
      const fs = require('fs')
      if (!fs.existsSync(subtitle.ossKey)) {
        console.log(`[Get Subtitle] 字幕文件不存在: ${subtitle.ossKey}`)
        throw new NotFoundException('字幕文件不存在')
      }
      
      // 获取文件信息
      const stat = fs.statSync(subtitle.ossKey)
      
      // 读取字幕文件内容
      const fileContent = fs.readFileSync(subtitle.ossKey, 'utf-8')
      
      // 根据字幕文件类型转换内容
      let convertedContent = fileContent
      if (subtitle.fileType === 'srt') {
        // 将SRT转换为VTT格式
        convertedContent = this.convertSrtToVtt(fileContent)
        console.log(`[Get Subtitle] 已将SRT转换为VTT格式`)
      }
      
      // 设置响应头
      res.set('Content-Length', convertedContent.length.toString())
      res.set('Content-Type', 'text/vtt')
      res.set('Content-Disposition', `inline; filename="${encodeURIComponent(subtitle.name)}.vtt"`)
      
      // 发送转换后的内容
      res.status(200).send(convertedContent)
    } catch (error) {
      console.error(`[Get Subtitle] 错误: ${error.message}`)
      throw error
    }
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

  @ApiOperation({ summary: '获取视频封面' })
  @ApiParam({ name: 'id', description: '视频ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '封面不存在' })
  @Get(':id/cover')
  async getVideoCover(@Param('id') id: string, @Response() res) {
    console.log(`[Get Cover] 开始处理封面请求，视频ID: ${id}`)
    
    try {
      // 从数据库中获取视频信息
      const video = await this.videoService.findById(id)
      
      if (!video.coverUrl) {
        console.log(`[Get Cover] 视频没有封面: ${id}`)
        throw new NotFoundException('封面不存在')
      }
      
      // 根据coverUrl获取封面文件路径
      // coverUrl格式: /api/videos/cover/{filename}.jpg
      const coverFileName = video.coverUrl.replace('/api/videos/cover/', '')
      const videoDir = path.dirname(video.localPath)
      const fullCoverPath = path.join(videoDir, coverFileName)
      
      console.log(`[Get Cover] 封面路径: ${fullCoverPath}`)
      
      // 检查封面文件是否存在
      const fs = require('fs')
      if (!fs.existsSync(fullCoverPath)) {
        console.log(`[Get Cover] 封面文件不存在: ${fullCoverPath}`)
        throw new NotFoundException('封面文件不存在')
      }
      
      // 获取文件信息
      const stat = fs.statSync(fullCoverPath)
      
      // 设置响应头
      res.set('Content-Length', stat.size.toString())
      res.set('Content-Type', 'image/jpeg')
      res.set('Cache-Control', 'public, max-age=86400') // 缓存1天
      
      // 创建文件流并发送
      const fileStream = fs.createReadStream(fullCoverPath)
      fileStream.on('error', (error) => {
        console.error(`[Get Cover] 文件流错误: ${error.message}`)
        if (!res.headersSent) {
          res.status(500).send('读取封面失败')
        }
      })
      
      fileStream.pipe(res)
    } catch (error) {
      console.error(`[Get Cover] 错误: ${error.message}`)
      throw error
    }
  }

  /**
   * 将SRT格式转换为VTT格式
   */
  private convertSrtToVtt(srtContent: string): string {
    // VTT文件头
    let vttContent = 'WEBVTT\n\n'
    
    // 将SRT的时间格式 (00:00:00,000) 转换为VTT格式 (00:00:00.000)
    // SRT格式：序号\n时间线\n文本\n\n
    const lines = srtContent.split('\n')
    let isFirstLine = true
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // 跳过空行
      if (!line) {
        if (!isFirstLine) {
          vttContent += '\n'
        }
        continue
      }
      
      // 检查是否是时间线 (00:00:00,000 --> 00:00:00,000)
      const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}),(\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}),(\d{3})/)
      if (timeMatch) {
        // 转换时间格式
        const startTime = `${timeMatch[1]}.${timeMatch[2]}`
        const endTime = `${timeMatch[3]}.${timeMatch[4]}`
        vttContent += `${startTime} --> ${endTime}\n`
        isFirstLine = false
      } else if (!/^\d+$/.test(line)) {
        // 不是序号行，添加到VTT内容
        vttContent += line + '\n'
        isFirstLine = false
      }
      // 如果是序号行，跳过（VTT不需要序号）
    }
    
    return vttContent
  }
}
