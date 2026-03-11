import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UserService } from '../user/user.service'
import { LoginDto, RegisterDto } from './dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findByUsername(username)
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      const { passwordHash, ...result } = user
      return result
    }
    return null
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password)
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误')
    }
    
    const payload = { username: user.username, sub: user.id, role: user.role }
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    }
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userService.findByUsername(registerDto.username)
    if (existingUser) {
      throw new ConflictException('用户名已存在')
    }
    
    const existingEmail = await this.userService.findByEmail(registerDto.email)
    if (existingEmail) {
      throw new ConflictException('邮箱已被注册')
    }
    
    const passwordHash = await bcrypt.hash(registerDto.password, 10)
    const user = await this.userService.create({
      username: registerDto.username,
      email: registerDto.email,
      passwordHash,
    })
    
    const payload = { username: user.username, sub: user.id, role: user.role }
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    }
  }
}
