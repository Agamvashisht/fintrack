import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from '../repositories/auth.repository';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '../utils/jwt';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../utils/errors';
import { config } from '../config/env';
import { CategoryRepository } from '../repositories/category.repository';

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
  };
  tokens: AuthTokens;
}

export class AuthService {
  private authRepo: AuthRepository;
  private categoryRepo: CategoryRepository;

  constructor() {
    this.authRepo = new AuthRepository();
    this.categoryRepo = new CategoryRepository();
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await this.authRepo.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, config.BCRYPT_SALT_ROUNDS);

    const user = await this.authRepo.createUser({
      email: input.email,
      password: hashedPassword,
      name: input.name,
    });

    // Seed default categories for new user
    await this.categoryRepo.seedDefaultCategories(user.id);

    const tokens = await this.generateAndStoreTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.authRepo.findUserByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = await this.generateAndStoreTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenRecord = await this.authRepo.findRefreshToken(refreshToken);
    if (tokenRecord) {
      await this.authRepo.revokeRefreshToken(refreshToken);
    }
  }

  async refreshTokens(oldRefreshToken: string): Promise<AuthTokens> {
    let payload;
    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokenRecord = await this.authRepo.findRefreshToken(oldRefreshToken);
    if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
      // Potential token reuse attack - revoke all tokens for this user
      if (payload.userId) {
        await this.authRepo.revokeAllUserRefreshTokens(payload.userId);
      }
      throw new UnauthorizedError('Refresh token is invalid or expired');
    }

    const user = await this.authRepo.findUserById(payload.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Rotate: revoke old token, issue new ones
    await this.authRepo.revokeRefreshToken(oldRefreshToken);
    return this.generateAndStoreTokens(user.id, user.email, user.role);
  }

  async getMe(userId: string) {
    const user = await this.authRepo.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  private async generateAndStoreTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<AuthTokens> {
    const tokenId = uuidv4();

    const accessToken = generateAccessToken({ userId, email, role });
    const refreshToken = generateRefreshToken({ userId, tokenId });

    await this.authRepo.createRefreshToken({
      token: refreshToken,
      userId,
      expiresAt: getRefreshTokenExpiry(),
    });

    return { accessToken, refreshToken };
  }
}
