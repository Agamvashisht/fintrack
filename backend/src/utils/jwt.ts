import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN,
    issuer: 'fintrack-api',
    audience: 'fintrack-app',
  });
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
    issuer: 'fintrack-api',
    audience: 'fintrack-app',
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, config.JWT_ACCESS_SECRET, {
    issuer: 'fintrack-api',
    audience: 'fintrack-app',
  }) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET, {
    issuer: 'fintrack-api',
    audience: 'fintrack-app',
  }) as RefreshTokenPayload;
};

export const getRefreshTokenExpiry = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
};
