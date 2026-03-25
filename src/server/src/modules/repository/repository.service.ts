import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Video, VideoStatus } from '../../database/entities/video.entity'
import { Subtitle } from '../../database/entities/subtitle.entity'
import { VideoRepository, RepositoryStatus } from '../../database/entities/video-repository.entity'
import * as fs from 'fs/promises'
import * as path from 'path'
import { execSync } from 'child_process'
import { FileLogger } from '../../common/file-logger'

@Injectable()
export class RepositoryService {
  private readonly logger = new FileLogger(RepositoryService.name)
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

      this.logger.log(`[封面调试] 开始处理文件: ${fileName}`)
      this.logger.log(`[封面调试] 文件路径: ${filePath}`)

      // 提取视频信息
      const videoInfo = await this.extractVideoInfo(filePath)
      this.logger.log(`[封面调试] 视频时长: ${videoInfo.duration}秒`)

      // 检查视频是否已存在
      this.logger.log(`[封面调试] 查询数据库检查视频是否存在...`)
      const existingVideo = await this.videoRepository.findOne({
        where: { localPath: filePath }
      })

      this.logger.log(`[封面调试] 视频是否已存在: ${existingVideo ? '是' : '否'}`)
      if (existingVideo) {
        this.logger.log(`[封面调试] 现有视频ID: ${existingVideo.id}`)
        this.logger.log(`[封面调试] 现有视频coverUrl: ${existingVideo.coverUrl || 'null'}`)
      }

      let coverUrl: string | null = null

      // 生成封面截图（如果是新视频或没有封面）
      // 注意：这里强制为所有视频生成封面，即使已有封面也要检查封面文件是否存在
      const needCover = !existingVideo || !existingVideo.coverUrl
      this.logger.log(`[封面调试] 是否需要生成封面: ${needCover}`)
      
      // 始终尝试生成封面，以确保封面存在
      this.logger.log(`[封面调试] 开始生成封面: ${fileName}`)
      coverUrl = await this.generateVideoCover(filePath)
      this.logger.log(`[封面调试] 封面生成结果: ${coverUrl || 'null'}`)
      if (coverUrl) {
        this.logger.log(`[封面调试] 封面生成成功: ${fileName}`)
      } else {
        this.logger.warn(`[封面调试] 封面生成失败: ${fileName}`)
      }

      let video: Video

      if (existingVideo) {
        // 更新现有视频信息
        const updateData: any = {
          title,
          fileSize: stat.size,
          duration: videoInfo.duration,
          resolution: videoInfo.resolution,
          repositoryId,
          updatedAt: new Date()
        }
        if (coverUrl) {
          updateData.coverUrl = coverUrl
          this.logger.log(`[封面调试] 更新视频 ${existingVideo.id} 的 coverUrl: ${coverUrl}`)
        }
        await this.videoRepository.update(existingVideo.id, updateData)
        // 重新查询获取更新后的数据
        const updatedVideo = await this.videoRepository.findOne({ where: { id: existingVideo.id } })
        if (!updatedVideo) {
          throw new Error('更新后无法找到视频')
        }
        video = updatedVideo
        this.logger.log(`[封面调试] 更新后视频的 coverUrl: ${video.coverUrl || 'null'}`)
      } else {
        // 创建新视频
        this.logger.log(`[封面调试] 创建新视频，coverUrl: ${coverUrl || 'null'}`)
        const newVideo = this.videoRepository.create({
          title,
          localPath: filePath,
          fileSize: stat.size,
          duration: videoInfo.duration,
          resolution: videoInfo.resolution,
          status: VideoStatus.PUBLISHED,
          isVipOnly: false,
          repositoryId,
          coverUrl: coverUrl || undefined
        })
        video = await this.videoRepository.save(newVideo)
        this.logger.log(`[封面调试] 新视频创建成功，ID: ${video.id}, coverUrl: ${video.coverUrl || 'null'}`)
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

  /**
   * 生成视频封面截图
   * 在视频第10秒处截取一帧作为封面，压缩为480x270分辨率
   */
  private async generateVideoCover(filePath: string): Promise<string | null> {
    try {
      this.logger.log(`[封面调试] generateVideoCover被调用: ${filePath}`)

      const videoDir = path.dirname(filePath)
      const videoName = path.parse(filePath).name
      const coverFileName = `${videoName}_cover.jpg`
      const coverPath = path.join(videoDir, coverFileName)

      this.logger.log(`[封面调试] 视频目录: ${videoDir}`)
      this.logger.log(`[封面调试] 视频名称: ${videoName}`)
      this.logger.log(`[封面调试] 封面路径: ${coverPath}`)

      // 检查封面是否已存在
      try {
        await fs.access(coverPath)
        this.logger.log(`[封面调试] 封面已存在，跳过生成: ${coverPath}`)
        // 返回相对路径，前端通过视频ID获取封面
        return `/api/videos/cover/${videoName}_cover.jpg`
      } catch {
        this.logger.log(`[封面调试] 封面不存在，需要生成: ${coverPath}`)
      }

      // 先获取视频时长，确保视频有足够的长度
      const videoInfo = await this.extractVideoInfo(filePath)
      this.logger.log(`[封面调试] 视频时长: ${videoInfo.duration}秒`)

      if (videoInfo.duration < 1) {
        this.logger.warn(`[封面调试] 视频时长太短，无法生成封面: ${filePath}`)
        return null
      }

      // 确定截图时间点（第10秒，或视频时长的一半，取较小值）
      const captureTime = Math.min(10, Math.floor(videoInfo.duration / 2))
      const timeStr = new Date(captureTime * 1000).toISOString().substr(11, 8)
      this.logger.log(`[封面调试] 将在 ${timeStr} 处截取封面`)

      // 使用ffmpeg生成封面截图
      // -ss 00:00:10 在指定时间处截取
      // -vframes 1 只截取一帧
      // -vf "scale=480:270" 缩放到480x270（16:9比例）
      // -q:v 2 设置JPEG质量（2-5是较好的质量范围）
      const command = `ffmpeg -ss ${timeStr} -i "${filePath}" -vframes 1 -vf "scale=480:270" -q:v 2 "${coverPath}"`
      this.logger.log(`[封面调试] ffmpeg命令: ${command}`)

      try {
        this.logger.log(`[封面调试] 开始执行ffmpeg命令`)
        execSync(command, { encoding: 'utf8' })
        this.logger.log(`[封面调试] ffmpeg命令执行成功`)
      } catch (ffmpegError) {
        this.logger.error(`[封面调试] ffmpeg命令执行失败: ${ffmpegError.message}`)
        throw ffmpegError
      }

      // 检查封面是否成功生成
      try {
        await fs.access(coverPath)
        const stats = await fs.stat(coverPath)
        this.logger.log(`[封面调试] 封面生成成功: ${coverPath}, 大小: ${stats.size} bytes`)
        // 返回相对路径，前端通过视频ID获取封面
        return `/api/videos/cover/${videoName}_cover.jpg`
      } catch (error) {
        this.logger.error(`[封面调试] 封面生成后无法访问: ${coverPath}, 错误: ${error.message}`)
        return null
      }
    } catch (error) {
      this.logger.error(`[封面调试] 生成封面失败 ${filePath}: ${error.message}`)
      return null
    }
  }
}