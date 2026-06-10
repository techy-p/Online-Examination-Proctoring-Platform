export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email?.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(email.trim())) return 'Enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Include at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Include at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Include at least one number';
  return null;
}

export function validateFullName(name: string): string | null {
  if (!name?.trim()) return 'Full name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (name.trim().length > 100) return 'Name is too long';
  return null;
}

export function validateRegisterInput(data: {
  email: string;
  password: string;
  fullName: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const emailErr = validateEmail(data.email);
  if (emailErr) errors.email = emailErr;

  const passErr = validatePassword(data.password);
  if (passErr) errors.password = passErr;

  const nameErr = validateFullName(data.fullName);
  if (nameErr) errors.fullName = nameErr;

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateLoginInput(data: { email: string; password: string }): ValidationResult {
  const errors: Record<string, string> = {};

  const emailErr = validateEmail(data.email);
  if (emailErr) errors.email = emailErr;

  if (!data.password) errors.password = 'Password is required';

  return { valid: Object.keys(errors).length === 0, errors };
}
