import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByUsername: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'test-token'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const username = 'testuser';
      const password = 'password123';
      const user = {
        id: '1',
        username,
        passwordHash: 'hashed-password',
        role: 'user',
      };

      (userService.findByUsername as jest.Mock).mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(true);

      const result = await authService.validateUser(username, password);

      expect(result).toEqual({
        id: '1',
        username,
        role: 'user',
      });
      expect(userService.findByUsername).toHaveBeenCalledWith(username);
      expect(bcryptMock.compare).toHaveBeenCalledWith(password, user.passwordHash);
    });

    it('should return null if user not found', async () => {
      (userService.findByUsername as jest.Mock).mockResolvedValue(null);

      const result = await authService.validateUser('testuser', 'password123');

      expect(result).toBeNull();
    });

    it('should return null if password is incorrect', async () => {
      const user = {
        id: '1',
        username: 'testuser',
        passwordHash: 'hashed-password',
      };

      (userService.findByUsername as jest.Mock).mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(false);

      const result = await authService.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info if login successful', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };
      const user = {
        id: '1',
        username: 'testuser',
        role: 'user',
      };

      (authService as any).validateUser = jest.fn().mockResolvedValue(user);

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        accessToken: 'test-token',
        user,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: user.username,
        sub: user.id,
        role: user.role,
      });
    });

    it('should throw UnauthorizedException if validation fails', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };

      (authService as any).validateUser = jest.fn().mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create user and return access token', async () => {
      const registerDto: RegisterDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };
      const user = {
        id: '1',
        username: 'newuser',
        email: 'newuser@example.com',
        role: 'user',
      };

      (userService.findByUsername as jest.Mock).mockResolvedValue(null);
      (userService.findByEmail as jest.Mock).mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue('hashed-password');
      (userService.create as jest.Mock).mockResolvedValue(user);

      const result = await authService.register(registerDto);

      expect(result).toEqual({
        accessToken: 'test-token',
        user,
      });
      expect(userService.create).toHaveBeenCalledWith({
        username: registerDto.username,
        email: registerDto.email,
        passwordHash: 'hashed-password',
      });
    });

    it('should throw ConflictException if username already exists', async () => {
      const registerDto: RegisterDto = {
        username: 'existinguser',
        email: 'newemail@example.com',
        password: 'password123',
      };

      (userService.findByUsername as jest.Mock).mockResolvedValue({ id: '1' });

      await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto: RegisterDto = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
      };

      (userService.findByUsername as jest.Mock).mockResolvedValue(null);
      (userService.findByEmail as jest.Mock).mockResolvedValue({ id: '1' });

      await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });
});