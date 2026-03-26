import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WatchHistoryService } from './watch-history.service'
import { WatchHistoryController } from './watch-history.controller'
import { WatchHistory } from '../../database/entities/watch-history.entity'
import { Video } from '../../database/entities/video.entity'

@Module({
  imports: [TypeOrmModule.forFeature([WatchHistory, Video])],
  providers: [WatchHistoryService],
  controllers: [WatchHistoryController],
  exports: [WatchHistoryService],
})
export class WatchHistoryModule {}
