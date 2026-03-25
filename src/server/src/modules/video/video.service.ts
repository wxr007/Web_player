import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Video, VideoStatus } from '../../database/entities/video.entity'
import { Subtitle } from '../../database/entities/subtitle.entity'
import { User, UserRole } from '../../database/entities/user.entity'

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
    @InjectRepository(Subtitle)
    private subtitleRepository: Repository<Subtitle>,
  ) {}

  async findAll(params: {
    page?: number
    pageSize?: number
    keyword?: string
    tag?: string
    status?: string
  }) {
    const { page = 1, pageSize = 12, keyword, tag, status } = params
    
    const query = this.videoRepository.createQueryBuilder('video')
      .leftJoinAndSelect('video.tags', 'tags')
    
    if (keyword) {
      query.where('video.title ILIKE :keyword', { keyword: `%${keyword}%` })
    }
    
    if (status) {
      query.andWhere('video.status = :status', { status })
    } else {
      query.andWhere('video.status = :status', { status: VideoStatus.PUBLISHED })
    }
    
    if (tag) {
      query.andWhere('tags.tag = :tag', { tag })
    }
    
    const [list, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('video.createdAt', 'DESC')
      .getManyAndCount()
    
    return { list, total, page, pageSize }
  }

  async findById(id: string): Promise<Video> {
    const video = await this.videoRepository.findOne({ 
      where: { id },
      relations: ['subtitles', 'tags'],
    })
    if (!video) {
      throw new NotFoundException('视频不存在')
    }
    return video
  }

  async getSubtitleById(id: string): Promise<Subtitle> {
    console.log(`[VideoService] 开始查询字幕，ID: ${id}`)
    
    // 尝试使用不同的查询方式
    const subtitle = await this.subtitleRepository.findOne({
      where: { id },
      relations: ['video']
    })
    
    console.log(`[VideoService] 查询结果: ${subtitle ? '找到字幕' : '未找到字幕'}`)
    
    if (!subtitle) {
      // 尝试查询所有字幕，看看是否能找到
      const allSubtitles = await this.subtitleRepository.find()
      console.log(`[VideoService] 所有字幕数量: ${allSubtitles.length}`)
      console.log(`[VideoService] 所有字幕ID: ${allSubtitles.map(s => s.id).join(', ')}`)
      
      throw new NotFoundException('字幕不存在')
    }
    
    console.log(`[VideoService] 找到字幕: ${subtitle.name}`)
    return subtitle
  }

  async getPlayUrl(id: string, user?: User): Promise<{ url: string }> {
    const video = await this.findById(id)
    
    if (video.isVipOnly) {
      if (!user || user.role !== UserRole.VIP || !user.vipExpireAt || user.vipExpireAt < new Date()) {
        throw new ForbiddenException('需要VIP会员才能观看')
      }
    }
    
    if (video.ossUrl) {
      await this.videoRepository.increment({ id }, 'viewCount', 1)
      return { url: video.ossUrl }
    } else if (video.localPath) {
      // 对于本地视频文件，返回一个指向本地视频流的URL
      await this.videoRepository.increment({ id }, 'viewCount', 1)
      return { url: `videos/${id}/stream` }
    } else {
      throw new NotFoundException('视频文件不存在')
    }
  }

  async create(data: Partial<Video>): Promise<Video> {
    const video = this.videoRepository.create({
      ...data,
      status: VideoStatus.DRAFT,
    })
    return this.videoRepository.save(video)
  }

  async update(id: string, data: Partial<Video>): Promise<Video> {
    await this.videoRepository.update(id, data)
    return this.findById(id)
  }

  async delete(id: string): Promise<void> {
    await this.videoRepository.delete(id)
  }
}
