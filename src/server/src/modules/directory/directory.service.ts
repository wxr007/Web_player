import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Video, VideoStatus } from '../../database/entities/video.entity'
import * as fs from 'fs/promises'
import * as path from 'path'
import { execSync } from 'child_process'

@Injectable()
export class DirectoryService {
  private readonly logger = new Logger(DirectoryService.name)
  private readonly videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm']

  constructor(
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
  ) {}

  async scanDirectory(directoryPath: string): Promise<{ added: number; updated: number; total: number }> {
    this.logger.log(`开始扫描目录: ${directoryPath}`)
    
    try {
      // 检查目录是否存在
      const stat = await fs.stat(directoryPath)
      if (!stat.isDirectory()) {
        throw new Error('指定的路径不是目录')
      }

      // 递归扫描目录
      const videoFiles = await this.findVideoFiles(directoryPath)
      this.logger.log(`找到 ${videoFiles.length} 个视频文件`)

      let added = 0
      let updated = 0

      // 处理每个视频文件
      for (const videoFile of videoFiles) {
        const result = await this.processVideoFile(videoFile)
        if (result.added) added++
        if (result.updated) updated++
      }

      this.logger.log(`扫描完成: 新增 ${added} 个视频, 更新 ${updated} 个视频, 总计 ${videoFiles.length} 个视频`)
      return { added, updated, total: videoFiles.length }
    } catch (error) {
      this.logger.error(`扫描目录失败: ${error.message}`)
      throw error
    }
  }

  private async findVideoFiles(directoryPath: string): Promise<string[]> {
    const videoFiles: string[] = []
    const entries = await fs.readdir(directoryPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(directoryPath, entry.name)
      
      if (entry.isDirectory()) {
        // 递归扫描子目录
        const subdirVideos = await this.findVideoFiles(fullPath)
        videoFiles.push(...subdirVideos)
      } else if (entry.isFile()) {
        // 检查文件扩展名
        const ext = path.extname(entry.name).toLowerCase()
        if (this.videoExtensions.includes(ext)) {
          videoFiles.push(fullPath)
        }
      }
    }

    return videoFiles
  }

  private async extractVideoInfo(filePath: string): Promise<{ duration: number; resolution: string }> {
    try {
      // 使用 ffprobe 命令获取视频信息
      const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
      const output = execSync(command, { encoding: 'utf8' })
      const info = JSON.parse(output)

      // 提取时长
      let duration = 0
      if (info.format && info.format.duration) {
        duration = Math.round(parseFloat(info.format.duration))
      }

      // 提取分辨率
      let resolution = ''
      if (info.streams) {
        const videoStream = info.streams.find((stream: any) => stream.codec_type === 'video')
        if (videoStream && videoStream.width && videoStream.height) {
          resolution = `${videoStream.width}x${videoStream.height}`
        }
      }

      return { duration, resolution }
    } catch (error) {
      this.logger.warn(`提取视频信息失败 ${filePath}: ${error.message}`)
      return { duration: 0, resolution: '' }
    }
  }

  private async processVideoFile(filePath: string): Promise<{ added: boolean; updated: boolean }> {
    try {
      const stat = await fs.stat(filePath)
      const fileName = path.basename(filePath)
      const title = path.parse(fileName).name

      // 提取视频信息
      const videoInfo = await this.extractVideoInfo(filePath)

      // 检查视频是否已存在
      const existingVideo = await this.videoRepository.findOne({
        where: { localPath: filePath }
      })

      if (existingVideo) {
        // 更新现有视频信息
        await this.videoRepository.update(existingVideo.id, {
          title,
          fileSize: stat.size,
          duration: videoInfo.duration,
          resolution: videoInfo.resolution,
          updatedAt: new Date()
        })
        return { added: false, updated: true }
      } else {
        // 创建新视频
        const newVideo = this.videoRepository.create({
          title,
          localPath: filePath,
          fileSize: stat.size,
          duration: videoInfo.duration,
          resolution: videoInfo.resolution,
          status: VideoStatus.PUBLISHED,
          isVipOnly: false
        })
        await this.videoRepository.save(newVideo)
        return { added: true, updated: false }
      }
    } catch (error) {
      this.logger.error(`处理视频文件失败 ${filePath}: ${error.message}`)
      return { added: false, updated: false }
    }
  }

  async getVideoDirectories(): Promise<string[]> {
    // 从数据库中获取所有视频的目录
    const videos = await this.videoRepository.find({
      select: ['localPath']
    })

    const directories = new Set<string>()
    videos.forEach(video => {
      if (video.localPath) {
        directories.add(path.dirname(video.localPath))
      }
    })

    return Array.from(directories)
  }

  async removeDirectory(directoryPath: string): Promise<number> {
    // 移除指定目录下的所有视频
    const videos = await this.videoRepository
      .createQueryBuilder('video')
      .where('video.localPath LIKE :path', { path: `${directoryPath}%` })
      .getMany()

    const count = videos.length
    await this.videoRepository.remove(videos)
    return count
  }
}
