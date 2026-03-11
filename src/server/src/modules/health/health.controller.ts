import { Controller, Get } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  async check() {
    const dbStatus = this.dataSource.isInitialized
    
    let dbDetails = {
      connected: false,
      database: null as string | null,
      host: null as string | null,
      port: null as number | null,
    }

    if (dbStatus) {
      try {
        await this.dataSource.query('SELECT 1')
        const options = this.dataSource.options as any
        dbDetails = {
          connected: true,
          database: options.database as string,
          host: options.host as string,
          port: options.port as number,
        }
      } catch (error) {
        dbDetails.connected = false
      }
    }

    return {
      status: dbDetails.connected ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
      database: dbDetails,
    }
  }

  @Get('db')
  async checkDatabase() {
    try {
      if (!this.dataSource.isInitialized) {
        return {
          status: 'error',
          message: '数据库连接未初始化',
        }
      }

      await this.dataSource.query('SELECT 1')
      
      const options = this.dataSource.options as any
      return {
        status: 'connected',
        database: options.database,
        host: options.host,
        port: options.port,
        type: options.type,
      }
    } catch (error) {
      return {
        status: 'disconnected',
        error: error.message,
      }
    }
  }
}
