import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { config } from '../config/env';

const authService = new AuthService();

const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth/refresh',
};

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email already in use
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    const result = await authService.register({ email, password, name });

    res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    sendCreated(res, {
      user: result.user,
      accessToken: result.tokens.accessToken,
    }, 'Account created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    sendSuccess(res, {
      user: result.user,
      accessToken: result.tokens.accessToken,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     responses:
 *       200:
 *         description: Logout successful
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     security: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const oldRefreshToken = req.cookies?.refreshToken;
    if (!oldRefreshToken) {
      res.status(401).json({ success: false, message: 'Refresh token not found' });
      return;
    }

    const tokens = await authService.refreshTokens(oldRefreshToken);

    res.cookie('refreshToken', tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    sendSuccess(res, { accessToken: tokens.accessToken }, 'Token refreshed');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Unauthorized
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getMe(req.user!.userId);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};
