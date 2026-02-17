import { User, RefreshToken } from '@prisma/client';
import prisma from '../config/database';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
}

export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async createUser(data: CreateUserData): Promise<User> {
    return prisma.user.create({ data });
  }

  async createRefreshToken(data: {
    token: string;
    userId: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data });
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({ where: { token } });
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: { revoked: true },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  async deleteExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { revoked: true }],
      },
    });
    return result.count;
  }

  async findTokenById(id: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({ where: { id } });
  }
}
