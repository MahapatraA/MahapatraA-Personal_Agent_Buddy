import { Request, Response } from 'express';
import {
  getCurrentUser,
  login,
  logout,
  refresh,
  register
} from '../services/auth.service';
import { parseCredentialsBody, parseRefreshTokenBody } from '../validation/auth';

export const registerController = async (req: Request, res: Response): Promise<void> => {
  const input = parseCredentialsBody(req.body, 'register');
  const session = await register(input);
  res.status(201).json(session);
};

export const loginController = async (req: Request, res: Response): Promise<void> => {
  const input = parseCredentialsBody(req.body, 'login');
  const session = await login(input);
  res.status(200).json(session);
};

export const refreshController = async (req: Request, res: Response): Promise<void> => {
  const input = parseRefreshTokenBody(req.body);
  const tokens = await refresh(input);
  res.status(200).json(tokens);
};

export const logoutController = async (req: Request, res: Response): Promise<void> => {
  const input = parseRefreshTokenBody(req.body);
  const result = await logout(input);
  res.status(200).json(result);
};

export const meController = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;

  if (user === undefined) {
    throw new Error('Authenticated user is missing from the request.');
  }

  const result = await getCurrentUser(user.id);
  res.status(200).json(result);
};
