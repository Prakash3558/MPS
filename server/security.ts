import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Salt rounds for bcrypt (10 rounds ~ 200-350ms)
const SALT_ROUNDS = 10;

/**
 * Pre-computed dummy bcrypt hash for timing equalization when accounts are not found.
 */
export const DUMMY_BCRYPT_HASH = hashPasswordSync('dummyPassword123');

/**
 * Hashes a plain-text password using bcrypt with 10 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Synchronously hashes a plain-text password using bcrypt.
 */
export function hashPasswordSync(password: string): string {
  if (!password) return '';
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

/**
 * Checks if a string is already a valid bcrypt hash ($2a$, $2b$, or $2y$).
 */
export function isBcryptHash(str: string): boolean {
  if (!str) return false;
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(str);
}

/**
 * Constant-time password verification supporting legacy plain-text password upgrade.
 */
export async function verifyPassword(
  inputPassword: string,
  storedHashOrPlain: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (!inputPassword || !storedHashOrPlain) {
    return { valid: false, needsRehash: false };
  }

  // If stored value is a valid bcrypt hash
  if (isBcryptHash(storedHashOrPlain)) {
    const match = await bcrypt.compare(inputPassword, storedHashOrPlain);
    return { valid: match, needsRehash: false };
  }

  // Legacy plain-text or old weak hash comparison
  const match = timingSafeEqualStr(inputPassword, storedHashOrPlain);
  if (match) {
    return { valid: true, needsRehash: true };
  }

  return { valid: false, needsRehash: false };
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Strip HTML tags and dangerous script / javascript protocols from free text.
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') return text;
  return text
    .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript\s*:/gi, '')
    .trim();
}

/**
 * Recursively sanitize all string properties in an object or array, except passwords/tokens.
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return sanitizeText(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
        cleaned[key] = (obj as any)[key];
      } else {
        cleaned[key] = sanitizeObject((obj as any)[key]);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// ZOD SCHEMAS FOR INPUT VALIDATION

export const LoginInputSchema = z.object({
  role: z.enum(['admin', 'teacher', 'student']),
  username: z.string().max(100).optional(),
  password: z.string().max(200).optional(),
  className: z.string().max(50).optional(),
  section: z.string().max(50).optional(),
  rollNo: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  studentName: z.string().max(100).optional(),
  name: z.string().max(100).optional(),
  class: z.string().max(50).optional(),
  admissionNo: z.string().max(50).optional(),
  captchaToken: z.string().max(500).optional()
});

export const ForgotPasswordSchema = z.object({
  email: z.string().max(150).optional(),
  username: z.string().max(100).optional(),
  phone: z.string().max(20).optional()
});

export const SignupSchema = z.object({
  email: z.string().max(150).optional(),
  password: z.string().max(200).optional(),
  name: z.string().max(100).optional(),
  role: z.string().max(50).optional()
});

export const ChangeAdminPasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newUsername: z.string().max(100).optional(),
  newPassword: z.string().min(1).max(200).optional(),
  newPhone: z.string().max(20).optional(),
  newEmail: z.string().email().max(150).optional().or(z.literal(''))
});

export const CreateTeacherSchema = z.object({
  name: z.string().min(1).max(100),
  username: z.string().min(1).max(100),
  password: z.string().max(200).optional(),
  subject: z.string().max(100).optional(),
  assignedClass: z.string().max(50).optional(),
  assignedSection: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().max(150).optional(),
  photo: z.string().max(5000000).optional()
});

export const CreateStudentSchema = z.object({
  name: z.string().min(1).max(100),
  rollNo: z.string().min(1).max(50),
  class: z.string().min(1).max(50),
  section: z.string().max(50).optional(),
  password: z.string().max(200).optional(),
  parentName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(300).optional(),
  photo: z.string().max(5000000).optional(),
  email: z.string().max(150).optional()
});

export const CreateNoticeSchema = z.object({
  title: z.string().min(1).max(200),
  date: z.string().max(50).optional(),
  category: z.enum(['General', 'Exam', 'Holiday', 'Urgent', 'Sports']).optional(),
  content: z.string().max(5000).optional(),
  fileUrl: z.string().max(1000).optional()
});

export const CreateHomeworkSchema = z.object({
  class: z.string().max(50).optional(),
  section: z.string().max(50).optional(),
  subject: z.string().max(100).optional(),
  topic: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  dueDate: z.string().max(50).optional(),
  fileUrl: z.string().max(1000).optional()
});
