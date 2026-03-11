import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../../database/entities/user.entity'

@Injectable()
export class UserService {
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

  async create(data: { username: string; email: string; passwordHash: string }): Promise<User> {
    const user = this.userRepository.create(data)
    return this.userRepository.save(user)
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, data)
    return this.findById(id)
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
