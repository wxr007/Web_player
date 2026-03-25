import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Video, VideoStatus } from '../../database/entities/video.entity'
import { Subtitle } from '../../database/entities/subtitle.entity'
import { VideoRepository, RepositoryStatus } from '../../database/entities/video-repository.entity'
import * as fs from 'fs/promises'
import * as path from 'path'
import { execSync } from 'child_process'

@Injectable()
export class RepositoryService {
  private readonly logger = new Logger(RepositoryService.name)
  private readonly videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm']
  private readonly subtitleExtensions = ['.srt', '.vtt', '.ass', '.ssa', '.sub']

  constructor(
    @InjectRepository(VideoRepository)
    private repositoryRepository: Repository<VideoRepository>,
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
    @InjectRepository(Subtitle)
    private subtitleRepository: Repository<Subtitle>,
  ) {}

  async createRepository(name: string, path: string): Promise<VideoRepository> {
    // 检查路径是否存在
    const stat = await fs.stat(path)
    if (!stat.isDirectory()) {
      throw new Error('指定的路径不是目录')
    }

    // 检查路径是否已存在
    const existingRepo = await this.repositoryRepository.findOne({
      where: { path }
    })

    if (existingRepo) {
      throw new Error('该路径已被添加为仓库')
    }

    // 创建新仓库
    const repository = this.repositoryRepository.create({
      name,
      path,
      status: RepositoryStatus.IDLE
    })

    return await this.repositoryRepository.save(repository)
  }

  async getAllRepositories(): Promise<VideoRepository[]> {
    return await this.repositoryRepository.find()
  }

  async getRepositoryById(id: string): Promise<VideoRepository> {
    const repository = await this.repositoryRepository.findOne({
      where: { id },
      relations: ['videos']
    })
    
    if (!repository) {
      throw new Error('仓库不存在')
    }
    
    return repository
  }

  async updateRepository(id: string, data: Partial<VideoRepository>): Promise<VideoRepository> {
    await this.repositoryRepository.update(id, data)
    return await this.getRepositoryById(id)
  }

  async deleteRepository(id: string): Promise<void> {
    // 先删除仓库下的所有视频
    await this.videoRepository.delete({ repositoryId: id })
    // 再删除仓库
    await this.repositoryRepository.delete(id)
  }

  async scanRepository(id: string): Promise<{ added: number; updated: number; total: number }> {
    const repository = await this.getRepositoryById(id)
    
    // 更新仓库状态为扫描中
    await this.repositoryRepository.update(id, {
      status: RepositoryStatus.SCANNING
    })

    try {
      this.logger.log(`开始扫描仓库: ${repository.name} (${repository.path})`)
      
      // 递归扫描目录，获取所有文件
      const allFiles = await this.findAllFiles(repository.path)
      this.logger.log(`找到 ${allFiles.length} 个文件`)

      // 分离视频文件和字幕文件
      const videoFiles = allFiles.filter(file => this.videoExtensions.includes(path.extname(file).toLowerCase()))
      const subtitleFiles = allFiles.filter(file => this.subtitleExtensions.includes(path.extname(file).toLowerCase()))
      
      this.logger.log(`找到 ${videoFiles.length} 个视频文件, ${subtitleFiles.length} 个字幕文件`)

      let added = 0
      let updated = 0

      // 处理每个视频文件
      for (const videoFile of videoFiles) {
        const result = await this.processVideoFile(videoFile, id, subtitleFiles)
        if (result.added) added++
        if (result.updated) updated++
      }

      // 更新仓库状态
      await this.repositoryRepository.update(id, {
        status: RepositoryStatus.COMPLETED,
        lastScanAt: new Date(),
        videoCount: added + updated
      })

      this.logger.log(`扫描完成: 新增 ${added} 个视频, 更新 ${updated} 个视频, 总计 ${videoFiles.length} 个视频`)
      return { added, updated, total: videoFiles.length }
    } catch (error) {
      this.logger.error(`扫描仓库失败: ${error.message}`)
      
      // 更新仓库状态为错误
      await this.repositoryRepository.update(id, {
        status: RepositoryStatus.ERROR,
        errorMessage: error.message
      })

      throw error
    }
  }

  private async findAllFiles(directoryPath: string): Promise<string[]> {
    const allFiles: string[] = []
    const entries = await fs.readdir(directoryPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(directoryPath, entry.name)
      
      if (entry.isDirectory()) {
        // 递归扫描子目录
        const subdirFiles = await this.findAllFiles(fullPath)
        allFiles.push(...subdirFiles)
      } else if (entry.isFile()) {
        allFiles.push(fullPath)
      }
    }

    return allFiles
  }

  private async findVideoFiles(directoryPath: string): Promise<string[]> {
    const allFiles = await this.findAllFiles(directoryPath)
    return allFiles.filter(file => this.videoExtensions.includes(path.extname(file).toLowerCase()))
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

  private async processVideoFile(filePath: string, repositoryId: string, subtitleFiles: string[]): Promise<{ added: boolean; updated: boolean }> {
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

      let video: Video

      if (existingVideo) {
        // 更新现有视频信息
        await this.videoRepository.update(existingVideo.id, {
          title,
          fileSize: stat.size,
          duration: videoInfo.duration,
          resolution: videoInfo.resolution,
          repositoryId,
          updatedAt: new Date()
        })
        video = existingVideo
        await this.videoRepository.save(video)
      } else {
        // 创建新视频
        const newVideo = this.videoRepository.create({
          title,
          localPath: filePath,
          fileSize: stat.size,
          duration: videoInfo.duration,
          resolution: videoInfo.resolution,
          status: VideoStatus.PUBLISHED,
          isVipOnly: false,
          repositoryId
        })
        video = await this.videoRepository.save(newVideo)
      }

      // 为视频匹配字幕文件
      await this.processSubtitles(video, subtitleFiles)

      return { added: !existingVideo, updated: !!existingVideo }
    } catch (error) {
      this.logger.error(`处理视频文件失败 ${filePath}: ${error.message}`)
      return { added: false, updated: false }
    }
  }

  private async processSubtitles(video: Video, subtitleFiles: string[]): Promise<void> {
    try {
      const videoDir = path.dirname(video.localPath)
      const videoName = path.parse(video.localPath).name

      // 查找与视频同名的字幕文件
      const matchingSubtitles = subtitleFiles.filter(subtitleFile => {
        const subDir = path.dirname(subtitleFile)
        const subName = path.parse(subtitleFile).name
        // 字幕文件应该与视频文件在同一目录，并且文件名相同（不包括扩展名）
        return subDir === videoDir && subName.startsWith(videoName)
      })

      this.logger.log(`为视频 ${video.title} 找到 ${matchingSubtitles.length} 个字幕文件`)

      // 删除现有的字幕记录
      await this.subtitleRepository.delete({ videoId: video.id })

      // 创建新的字幕记录
      for (let i = 0; i < matchingSubtitles.length; i++) {
        const subtitleFile = matchingSubtitles[i]
        const subExt = path.extname(subtitleFile).toLowerCase()
        const subName = path.basename(subtitleFile)

        // 从文件名中提取语言信息（如果有的话）
        const languageMatch = subName.match(/\.(\w+)(\.\w+)?$/)
        const language = languageMatch ? languageMatch[1] : 'unknown'

        const subtitle = this.subtitleRepository.create({
          videoId: video.id,
          language: language,
          name: subName,
          ossKey: subtitleFile, // 这里使用本地路径作为ossKey，实际项目中可能需要上传到OSS
          fileType: subExt.substring(1), // 去掉点号
          isDefault: i === 0 // 第一个字幕作为默认字幕
        })

        await this.subtitleRepository.save(subtitle)
      }
    } catch (error) {
      this.logger.error(`处理字幕文件失败: ${error.message}`)
    }
  }
}