import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { WatchHistory } from '../../database/entities/watch-history.entity'
import { Video } from '../../database/entities/video.entity'

@Injectable()
export class WatchHistoryService {
  constructor(
    @InjectRepository(WatchHistory)
    private watchHistoryRepository: Repository<WatchHistory>,
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
  ) {}

  async updateProgress(userId: string, videoId: string, progress: number): Promise<WatchHistory> {
    // 查找是否已有记录
    let history = await this.watchHistoryRepository.findOne({
      where: { userId, videoId },
    })

    if (history) {
      // 更新现有记录
      history.progress = progress
      history.lastWatch = new Date()
      return this.watchHistoryRepository.save(history)
    } else {
      // 创建新记录
      history = this.watchHistoryRepository.create({
        userId,
        videoId,
        progress,
        lastWatch: new Date(),
      })
      return this.watchHistoryRepository.save(history)
    }
  }

  async getHistory(userId: string, page: number = 1, pageSize: number = 12) {
    const [list, total] = await this.watchHistoryRepository.findAndCount({
      where: { userId },
      relations: ['video'],
      order: { lastWatch: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // 格式化返回数据
    const formattedList = list.map(history => ({
      id: history.video.id,
      title: history.video.title,
      description: history.video.description,
      coverUrl: history.video.coverUrl,
      duration: history.video.duration,
      viewCount: history.video.viewCount,
      isVipOnly: history.video.isVipOnly,
      status: history.video.status,
      createdAt: history.video.createdAt,
      updatedAt: history.video.updatedAt,
      progress: history.progress,
      lastWatch: history.lastWatch,
    }))

    return { list: formattedList, total, page, pageSize }
  }

  async getProgress(userId: string, videoId: string): Promise<number> {
    const history = await this.watchHistoryRepository.findOne({
      where: { userId, videoId },
    })
    return history ? history.progress : 0
  }

  async clearHistory(userId: string): Promise<void> {
    await this.watchHistoryRepository.delete({ userId })
  }

  async deleteHistoryItem(userId: string, videoId: string): Promise<void> {
    await this.watchHistoryRepository.delete({ userId, videoId })
  }
}
