import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { RepositoryService } from './repository.service'
import { VideoRepository } from '../../database/entities/video-repository.entity'
import { AuthGuard } from '@nestjs/passport'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'

@ApiTags('视频仓库')
@Controller('repositories')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class RepositoryController {
  constructor(private readonly repositoryService: RepositoryService) {}

  @Post()
  @ApiOperation({ summary: '创建视频仓库' })
  @ApiResponse({ status: 201, description: '仓库创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async createRepository(@Body() body: { name: string; path: string }): Promise<VideoRepository> {
    return await this.repositoryService.createRepository(body.name, body.path)
  }

  @Get()
  @ApiOperation({ summary: '获取所有视频仓库' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllRepositories(): Promise<VideoRepository[]> {
    return await this.repositoryService.getAllRepositories()
  }

  @Get('public/list')
  @ApiOperation({ summary: '获取视频仓库列表（公开）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPublicRepositories(): Promise<{ id: string; name: string }[]> {
    const repositories = await this.repositoryService.getAllRepositories()
    return repositories.map(repo => ({ id: repo.id, name: repo.name }))
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个视频仓库' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '仓库不存在' })
  async getRepositoryById(@Param('id') id: string): Promise<VideoRepository> {
    return await this.repositoryService.getRepositoryById(id)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新视频仓库' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '仓库不存在' })
  async updateRepository(@Param('id') id: string, @Body() data: Partial<VideoRepository>): Promise<VideoRepository> {
    return await this.repositoryService.updateRepository(id, data)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除视频仓库' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '仓库不存在' })
  async deleteRepository(@Param('id') id: string): Promise<void> {
    await this.repositoryService.deleteRepository(id)
  }

  @Post(':id/scan')
  @ApiOperation({ summary: '扫描视频仓库' })
  @ApiResponse({ status: 200, description: '扫描成功' })
  @ApiResponse({ status: 404, description: '仓库不存在' })
  async scanRepository(@Param('id') id: string): Promise<{ added: number; updated: number; total: number }> {
    return await this.repositoryService.scanRepository(id)
  }
}