import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../../database/entities/user.entity'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } })
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } })
  }

  async findUsers(page: number = 1, pageSize: number = 10): Promise<[User[], number]> {
    const skip = (page - 1) * pageSize
    const [users, total] = await this.userRepository.findAndCount({
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' }
    })
    return [users, total]
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id)
  }

  async create(data: { username: string; email: string; passwordHash: string }): Promise<User> {
    const user = this.userRepository.create(data)
    return this.userRepository.save(user)
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    this.logger.log('Updating user', {
      id,
      updateData: {
        username: data.username,
        email: data.email,
        avatarLength: data.avatar?.length,
        avatarPreview: data.avatar?.substring(0, 50) + '...'
      }
    })
    
    try {
      await this.userRepository.update(id, data)
      this.logger.log('User updated successfully', { id })
      
      const updatedUser = await this.findById(id)
      this.logger.log('Retrieved updated user', { id, updatedUser })
      return updatedUser
    } catch (error) {
      this.logger.error('Failed to update user', error, { id })
      throw error
    }
  }

  async findAll(page = 1, pageSize = 10): Promise<{ list: User[]; total: number }> {
    const [list, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    })
    return { list, total }
  }
}
