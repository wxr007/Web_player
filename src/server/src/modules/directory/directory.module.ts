import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Video } from '../../database/entities/video.entity'
import { DirectoryService } from './directory.service'
import { DirectoryController } from './directory.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Video])],
  providers: [DirectoryService],
  controllers: [DirectoryController],
  exports: [DirectoryService]
})
export class DirectoryModule {}
