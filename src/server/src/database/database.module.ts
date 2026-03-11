import { Module, Global } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { User } from './entities/user.entity'
import { Video } from './entities/video.entity'
import { Subtitle } from './entities/subtitle.entity'
import { Order } from './entities/order.entity'
import { WatchHistory } from './entities/watch-history.entity'
import { Favorite } from './entities/favorite.entity'
import { VideoTag } from './entities/video-tag.entity'

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [User, Video, Subtitle, Order, WatchHistory, Favorite, VideoTag],
        synchronize: true,
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),
    TypeOrmModule.forFeature([User, Video, Subtitle, Order, WatchHistory, Favorite, VideoTag]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
