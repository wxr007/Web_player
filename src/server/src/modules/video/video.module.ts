import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Video } from '../../database/entities/video.entity'
import { Subtitle } from '../../database/entities/subtitle.entity'
import { VideoService } from './video.service'
import { VideoController } from './video.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Video, Subtitle])],
  controllers: [VideoController],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}
