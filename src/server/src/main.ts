import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  // 启用详细日志
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose']
  })

  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }))
  app.enableCors()

  await app.listen(process.env.PORT || 3001)
  console.log(`Server is running on: http://localhost:${process.env.PORT || 3001}`)
  console.log(`Health check: http://localhost:${process.env.PORT || 3001}/api/health`)
}
bootstrap()
