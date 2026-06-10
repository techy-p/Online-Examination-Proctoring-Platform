import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY_DAYS = 7;

export interface TokenUser {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

export function signAccessToken(user: TokenUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_EXPIRY }
  );
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function storeRefreshToken(userId: string, refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRY_DAYS);

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
}

export async function verifyRefreshToken(refreshToken: string): Promise<TokenUser | null> {
  const tokenHash = hashToken(refreshToken);

  const result = await query(
    `SELECT rt.user_id, u.email, u.full_name, u.role
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1 AND rt.expires_at > NOW() AND rt.revoked = false`,
    [tokenHash]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.user_id,
    email: row.email,
    role: row.role,
    fullName: row.full_name,
  };
}

export async function revokeRefreshToken(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await query(`UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1`, [tokenHash]);
}

export async function revokeAllUserTokens(userId: string) {
  await query(`UPDATE refresh_tokens SET revoked = true WHERE user_id = $1`, [userId]);
}

export function formatAuthResponse(user: { id: string; email: string; full_name?: string; fullName?: string; role: string }, accessToken: string, refreshToken: string) {
  return {
    accessToken,
    refreshToken,
    expiresIn: 900,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name || user.fullName,
      role: user.role,
    },
  };
}
