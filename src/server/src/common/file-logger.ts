import { ConsoleLogger, LogLevel } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'

// 自定义日志类，同时输出到控制台和文件
export class FileLogger extends ConsoleLogger {
  private logFilePath: string
  private errorLogFilePath: string
  private static hasWrittenStartupMessage = false

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
    const errorFileName = `error-${dateStr}_${timeStr}.log`

    this.logFilePath = path.join(process.cwd(), 'logs', fileName)
    this.errorLogFilePath = path.join(process.cwd(), 'logs', errorFileName)

    // 确保日志目录存在
    const logDir = path.dirname(this.logFilePath)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    // 只在第一个实例时写入启动标记
    if (!FileLogger.hasWrittenStartupMessage) {
      FileLogger.hasWrittenStartupMessage = true
      this.writeToFile('LOG', '=== 应用程序启动 ===', this.logFilePath)
    }
  }

  private writeToFile(level: string, message: string, filePath?: string) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level}] ${message}\n`
    const targetPath = filePath || this.logFilePath
    try {
      fs.appendFileSync(targetPath, logMessage)
    } catch (error) {
      // 忽略写入错误
    }
  }

  private formatLogMessage(message: any): string {
    if (typeof message === 'object') {
      try {
        return JSON.stringify(message, null, 2)
      } catch {
        return String(message)
      }
    }
    return String(message)
  }

  protected printMessages(messages: unknown[], context = '', logLevel: LogLevel = 'log', writeStreamType?: 'stdout' | 'stderr') {
    // 调用父类方法输出到控制台
    super.printMessages(messages, context, logLevel, writeStreamType)

    // 写入文件
    const level = logLevel.toUpperCase()
    messages.forEach(message => {
      const formattedMessage = this.formatLogMessage(message)
      this.writeToFile(level, `[${context || this.context}] ${formattedMessage}`)

      // 错误日志同时写入错误文件
      if (logLevel === 'error') {
        this.writeToFile(level, `[${context || this.context}] ${formattedMessage}`, this.errorLogFilePath)
      }
    })
  }
}
