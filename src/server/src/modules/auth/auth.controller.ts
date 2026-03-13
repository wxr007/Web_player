import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LoginDto, RegisterDto } from './dto/auth.dto'
import { LocalAuthGuard } from '../../common/guards/local-auth.guard'

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: '用户登录' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @ApiOperation({ summary: '用户注册' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 200, description: '注册成功' })
  @ApiResponse({ status: 400, description: '注册失败' })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @ApiOperation({ summary: '用户登出' })
  @ApiResponse({ status: 200, description: '登出成功' })
  @Post('logout')
  async logout() {
    return { message: '登出成功' }
  }

  @ApiOperation({ summary: '刷新令牌' })
  @ApiResponse({ status: 200, description: '刷新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Post('refresh')
  async refresh(@Request() req) {
    return { accessToken: req.user.accessToken }
  }
}
