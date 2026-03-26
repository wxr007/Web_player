import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { FileLogger } from './common/file-logger'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  // 启用详细日志，使用自定义日志类
  const app = await NestFactory.create(AppModule, {
    logger: new FileLogger()
  })

  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }))
  app.enableCors()

  // 配置 Swagger
  const config = new DocumentBuilder()
    .setTitle('视频平台 API')
    .setDescription('视频平台后端 API 文档')
    .setVersion('1.0')
    .addTag('认证')
    .addTag('用户')
    .addTag('视频')
    .addTag('健康检查')
    .addTag('管理员')
    .addTag('目录管理')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(process.env.PORT || 3001)
  logger.log(`Server is running on: http://localhost:${process.env.PORT || 3001}`)
  logger.log(`Health check: http://localhost:${process.env.PORT || 3001}/api/health`)
  logger.log(`Swagger docs: http://localhost:${process.env.PORT || 3001}/api/docs`)
}
bootstrap()
