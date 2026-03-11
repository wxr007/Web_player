import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../../database/entities/user.entity'
import { UserService } from '../user/user.service'
import { AdminController } from './admin.controller'

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AdminController],
  providers: [UserService],
  exports: [UserService]
})
export class AdminModule {}