import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';

const mockUserRepository = () => ({
  signUp: jest.fn(),
  validateUserPassword: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(),
});

const mockAuthCredentialsDto = {
  username: 'username',
  email: 'email@email.com',
  fistName: 'firsName',
  lastName: 'lastName',
  password: 'password',
};

const signInDto = {
  email: 'email@email.com',
  password: 'password',
};

describe('AuthService', () => {
  let authService;
  let jwtService;
  let userRepository;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useFactory: mockUserRepository },
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('signUp', () => {
    it('should return userRepository.signUp result', async () => {
      userRepository.signUp.mockResolvedValue(undefined);

      const result = await authService.signUp(mockAuthCredentialsDto);

      expect(result).toEqual(undefined);
      expect(userRepository.signUp).toHaveBeenCalledWith(
        mockAuthCredentialsDto,
      );
    });
  });

  describe('signIn', () => {
    it('should return user and access token given valid credentials ', async () => {
      userRepository.validateUserPassword.mockResolvedValue({
        username: 'username',
      });
      jwtService.sign.mockResolvedValue('access_token');

      const result = await authService.signIn(signInDto);

      expect(result).toEqual({
        user: { username: 'username' },
        token: 'access_token',
      });
      expect(userRepository.validateUserPassword).toHaveBeenCalledWith(
        signInDto,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: 'username',
      });
    });

    it('should return UnauthorizedException given invalid credentials ', async () => {
      userRepository.validateUserPassword.mockResolvedValue(null);

      await expect(authService.signIn(signInDto)).rejects.toThrowError(
        new UnauthorizedException('Invalid credentials'),
      );
    });
  });
});
