import { ConsoleLogger } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'

// 自定义日志类，同时输出到控制台和文件
export class FileLogger extends ConsoleLogger {
  private logFilePath: string

  constructor(context: string = 'Application') {
    super(context, {
      logLevels: ['log', 'error', 'warn', 'debug', 'verbose'],
      timestamp: true,
    })
    
    // 生成带日期时间标记的日志文件名
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS
    const fileName = `app-${dateStr}_${timeStr}.log`
    
    this.logFilePath = path.join(process.cwd(), 'logs', fileName)
    
    // 确保日志目录存在
    const logDir = path.dirname(this.logFilePath)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
  }

  private writeToFile(level: string, message: string) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level}] ${message}\n`
    try {
      fs.appendFileSync(this.logFilePath, logMessage)
    } catch (error) {
      // 忽略写入错误
    }
  }

  log(message: string, context?: string) {
    super.log(message, context)
    this.writeToFile('LOG', `[${context || this.context}] ${message}`)
  }

  error(message: string, trace?: string, context?: string) {
    super.error(message, trace, context)
    this.writeToFile('ERROR', `[${context || this.context}] ${message} ${trace || ''}`)
  }

  warn(message: string, context?: string) {
    super.warn(message, context)
    this.writeToFile('WARN', `[${context || this.context}] ${message}`)
  }

  debug(message: string, context?: string) {
    super.debug(message, context)
    this.writeToFile('DEBUG', `[${context || this.context}] ${message}`)
  }

  verbose(message: string, context?: string) {
    super.verbose(message, context)
    this.writeToFile('VERBOSE', `[${context || this.context}] ${message}`)
  }
}
