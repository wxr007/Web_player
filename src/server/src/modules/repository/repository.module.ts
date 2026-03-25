import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { VideoRepository } from '../../database/entities/video-repository.entity'
import { Video } from '../../database/entities/video.entity'
import { Subtitle } from '../../database/entities/subtitle.entity'
import { RepositoryService } from './repository.service'
import { RepositoryController } from './repository.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([VideoRepository, Video, Subtitle])
  ],
  providers: [RepositoryService],
  controllers: [RepositoryController]
})
export class RepositoryModule {}