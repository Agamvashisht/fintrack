import bcrypt from 'bcryptjs';
import { AuthService } from '../../src/services/auth.service';
import { AuthRepository } from '../../src/repositories/auth.repository';
import { CategoryRepository } from '../../src/repositories/category.repository';
import { ConflictError, UnauthorizedError } from '../../src/utils/errors';

jest.mock('../../src/repositories/auth.repository');
jest.mock('../../src/repositories/category.repository');
jest.mock('bcryptjs');
jest.mock('../../src/utils/jwt', () => ({
  generateAccessToken: jest.fn(() => 'mock-access-token'),
  generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
  verifyRefreshToken: jest.fn(() => ({ userId: 'user-1', tokenId: 'token-1' })),
  getRefreshTokenExpiry: jest.fn(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
}));

const MockAuthRepo = AuthRepository as jest.MockedClass<typeof AuthRepository>;
const MockCategoryRepo = CategoryRepository as jest.MockedClass<typeof CategoryRepository>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockAuthRepoInstance: jest.Mocked<AuthRepository>;
  let mockCategoryRepoInstance: jest.Mocked<CategoryRepository>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashed-password',
    name: 'Test User',
    role: 'USER' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthRepoInstance = {
      findUserByEmail: jest.fn(),
      findUserById: jest.fn(),
      createUser: jest.fn(),
      createRefreshToken: jest.fn(),
      findRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      revokeAllUserRefreshTokens: jest.fn(),
      deleteExpiredTokens: jest.fn(),
      findTokenById: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;

    mockCategoryRepoInstance = {
      seedDefaultCategories: jest.fn(),
    } as unknown as jest.Mocked<CategoryRepository>;

    MockAuthRepo.mockImplementation(() => mockAuthRepoInstance);
    MockCategoryRepo.mockImplementation(() => mockCategoryRepoInstance);
    authService = new AuthService();
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      mockAuthRepoInstance.findUserByEmail.mockResolvedValue(null);
      mockAuthRepoInstance.createUser.mockResolvedValue(mockUser);
      mockAuthRepoInstance.createRefreshToken.mockResolvedValue({
        id: 'token-id',
        token: 'mock-refresh-token',
        userId: 'user-1',
        expiresAt: new Date(),
        createdAt: new Date(),
        revoked: false,
      });
      mockCategoryRepoInstance.seedDefaultCategories.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(mockCategoryRepoInstance.seedDefaultCategories).toHaveBeenCalledWith('user-1');
    });

    it('should throw ConflictError if email already exists', async () => {
      mockAuthRepoInstance.findUserByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User',
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      mockAuthRepoInstance.findUserByEmail.mockResolvedValue(mockUser);
      mockAuthRepoInstance.createRefreshToken.mockResolvedValue({
        id: 'token-id',
        token: 'mock-refresh-token',
        userId: 'user-1',
        expiresAt: new Date(),
        createdAt: new Date(),
        revoked: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should throw UnauthorizedError with invalid email', async () => {
      mockAuthRepoInstance.findUserByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'wrong@example.com', password: 'Password123' }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError with wrong password', async () => {
      mockAuthRepoInstance.findUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({ email: 'test@example.com', password: 'WrongPass' }),
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
