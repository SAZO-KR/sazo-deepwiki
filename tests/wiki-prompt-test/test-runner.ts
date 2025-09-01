#!/usr/bin/env node

/**
 * Standalone CLI test runner for wiki generation prompt
 * Usage: npm run test:wiki-prompt
 */

import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { generatePromptContent } from '../../src/utils/promptTemplate';

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Test configuration
interface TestConfig {
  topic: string;
  files: Record<string, string>;
  language?: string;
  provider?: 'openai' | 'anthropic' | 'local';
  model?: string;
}

// Sample test data
const TEST_DATA: TestConfig = {
  topic: "Authentication System",
  files: {
    'src/auth/login.ts': `
import { User } from '../models/User';
import { hashPassword, comparePassword } from '../utils/crypto';
import { generateToken } from '../utils/jwt';

export class AuthService {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isValid = await comparePassword(password, user.hashedPassword);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email });
    
    return { token, user };
  }
  
  async register(email: string, password: string, name: string): Promise<User> {
    // Check if user exists
    const existing = await User.findByEmail(email);
    if (existing) {
      throw new Error('User already exists');
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const user = await User.create({
      email,
      hashedPassword,
      name
    });
    
    return user;
  }
}`,
    'src/models/User.ts': `
export interface UserData {
  id: string;
  email: string;
  hashedPassword: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  constructor(private data: UserData) {}
  
  get id() { return this.data.id; }
  get email() { return this.data.email; }
  get name() { return this.data.name; }
  
  static async findByEmail(email: string): Promise<User | null> {
    // Database query implementation
    return null;
  }
  
  static async create(data: Partial<UserData>): Promise<User> {
    // Database insertion implementation
    return new User(data as UserData);
  }
}`,
    'src/utils/crypto.ts': `
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}`,
    'src/utils/jwt.ts': `
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'default-secret';
const EXPIRY = '24h';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload;
}`,
    'src/middleware/auth.ts': `
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}`
  },
  language: 'kr'
};

// Generate the actual prompt from page.tsx
function generatePrompt(config: TestConfig): string {
  // Generate file URLs similar to how it's done in page.tsx
  const generateFileUrl = (filePath: string) => {
    // Mock GitHub URL for testing
    return `https://github.com/test/repo/blob/main/${filePath}`;
  };
  
  // Use the exported function to generate prompt
  const filePaths = Object.keys(config.files);
  const language = config.language || 'en';
  
  // Generate the prompt using the shared template function
  let prompt = generatePromptContent(config.topic, filePaths, language, generateFileUrl);
  
  // Add the actual file contents at the end for the test
  const fileContents = filePaths.map(path => {
    return `
File: ${path}
\`\`\`
${config.files[path]}
\`\`\``;
  }).join('\n');
  
  prompt += '\n\n[RELEVANT_SOURCE_FILES]:\n' + fileContents;
  
  return prompt;
}

// Test with Google Gemini
async function testWithGoogle(config: TestConfig) {
  // Use the same env var as main project
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_API_KEY not found in environment');
    console.log('Please set it in the root .env file');
    return null;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: config.model || 'gemini-2.0-flash' });
  const prompt = generatePrompt(config);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Google API error:', error);
    return null;
  }
}

// Test with OpenAI
async function testWithOpenAI(config: TestConfig) {
  // Use the same env var as main project
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not found in environment');
    console.log('Please set it in the root .env file');
    return null;
  }

  const openai = new OpenAI({ apiKey });
  const prompt = generatePrompt(config);

  try {
    const response = await openai.chat.completions.create({
      model: config.model || 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return null;
  }
}

// Clean AI response from code block wrappers
function cleanAIResponse(content: string): string {
  // Remove HTML code block wrapper if present
  if (content.startsWith('```html\n') || content.startsWith('```markdown\n')) {
    // Find the closing backticks
    const lines = content.split('\n');
    if (lines[0].startsWith('```')) {
      lines.shift(); // Remove opening ```html or ```markdown
    }
    if (lines[lines.length - 1] === '```') {
      lines.pop(); // Remove closing ```
    }
    content = lines.join('\n');
  }
  
  // Remove any trailing backticks
  content = content.replace(/```\s*$/, '');
  
  return content.trim();
}

// Save output
function saveOutput(content: string, filename: string) {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, content);
  console.log(`✅ Output saved to: ${outputPath}`);
}

// Main test runner
async function runTest() {
  console.log('🚀 Starting Wiki Generation Prompt Test');
  console.log('=====================================\n');
  
  console.log(`📄 Topic: ${TEST_DATA.topic}`);
  console.log(`📁 Files: ${Object.keys(TEST_DATA.files).length} test files`);
  console.log(`🌐 Language: ${TEST_DATA.language || 'en'}\n`);

  // Generate prompt
  const prompt = generatePrompt(TEST_DATA);
  saveOutput(prompt, 'generated-prompt.md');

  // Test with AI provider (if configured)
  // Default to Google, but allow OpenAI with --openai flag
  const useOpenAI = process.env.OPENAI_API_KEY && process.argv.includes('--openai');
  const useGoogle = process.env.GOOGLE_API_KEY && !useOpenAI;
  const provider = useOpenAI ? 'openai' : useGoogle ? 'google' : 'local';
  
  if (provider === 'google') {
    console.log('🤖 Testing with Google Gemini...');
    const result = await testWithGoogle(TEST_DATA);
    
    if (result) {
      const cleanedResult = cleanAIResponse(result);
      saveOutput(cleanedResult, 'generated-wiki.md');
      console.log('✅ Wiki generated successfully!');
    } else {
      console.log('❌ Failed to generate wiki');
    }
  } else if (provider === 'openai') {
    console.log('🤖 Testing with OpenAI...');
    const result = await testWithOpenAI(TEST_DATA);
    
    if (result) {
      const cleanedResult = cleanAIResponse(result);
      saveOutput(cleanedResult, 'generated-wiki.md');
      console.log('✅ Wiki generated successfully!');
    } else {
      console.log('❌ Failed to generate wiki');
    }
  } else {
    console.log('💾 Local test mode - prompt saved for manual testing');
    console.log('To test with Google: Ensure GOOGLE_API_KEY is set in root .env');
    console.log('To test with OpenAI: Run with --openai flag');
  }

  console.log('\n✨ Test complete!');
}

// Run the test
runTest().catch(console.error);
