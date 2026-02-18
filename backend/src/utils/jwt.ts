import jwt , { SignOptions } from 'jsonwebtoken';
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

export const generateAccessToken = (
  payload: AccessTokenPayload
): string => {
  const options: SignOptions = {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: 'fintrack-api',
    audience: 'fintrack-app',
  };

  return jwt.sign(
    payload,
    config.JWT_ACCESS_SECRET,
    options
  );
};

export const generateRefreshToken = (
  payload: RefreshTokenPayload
): string => {
  const options: SignOptions = {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: 'fintrack-api',
    audience: 'fintrack-app',
  };

  return jwt.sign(
    payload,
    config.JWT_REFRESH_SECRET,
    options
  );
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
