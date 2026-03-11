import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator'

export class LoginDto {
  @IsString()
  username: string

  @IsString()
  password: string
}

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  password: string
}
