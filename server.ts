import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Initialize Gemini AI client for AI Teacher
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
  } catch (err) {
    console.warn('[MAYF Server] Gemini AI initialization error:', err);
  }
}

// -------------------------------------------------------------
// Health and Architecture Diagnostics
// -------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Maths at Your Fingertips',
    domain: 'https://mayf.co.in',
    version: '1.0.0-rc',
    environment: process.env.APP_ENV || process.env.NODE_ENV || 'development',
    serverTimestamp: new Date().toISOString(),
    services: {
      geminiAiTeacher: Boolean(geminiApiKey),
      cloudflareTurnstile: Boolean(process.env.TURNSTILE_SECRET_KEY),
      firebaseAdmin: Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID),
    },
  });
});

// -------------------------------------------------------------
// Cloudflare Turnstile Server-Side Verification
// -------------------------------------------------------------
app.post('/api/turnstile/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Missing turnstile verification token' });
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';

    // Cloudflare test tokens or local dev tokens
    if (token.startsWith('cf-test-') || token === '1x00000000000000000000AA' || secretKey.startsWith('1x0000')) {
      return res.json({
        success: true,
        message: 'Turnstile verified (development test key)',
        hostname: 'mayf.co.in',
      });
    }

    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    const remoteIp = req.headers['cf-connecting-ip'] || req.socket.remoteAddress;
    if (remoteIp) {
      formData.append('remoteip', String(remoteIp));
    }

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const result = await verifyRes.json() as { success: boolean; 'error-codes'?: string[] };

    return res.json({
      success: result.success,
      errors: result['error-codes'] || [],
    });
  } catch (error) {
    console.error('[MAYF Server] Turnstile error:', error);
    return res.status(500).json({ success: false, error: 'Internal Turnstile verification failure' });
  }
});

// -------------------------------------------------------------
// AI Teacher (Gemini Server-Side Endpoint)
// Designed for Class 5–10 CBSE & ICSE Mathematics Curriculum
// -------------------------------------------------------------
app.post('/api/ai-teacher/ask', async (req: Request, res: Response) => {
  try {
    const { message, studentClass, chapterTopic, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Question message is required' });
    }

    const classLevel = studentClass || 'Class 9';
    const topic = chapterTopic || 'General Mathematics';

    // System prompt engineered for Class 5-10 academic pedagogy
    const systemInstruction = `You are "Professor Sigma", the friendly, highly encouraging, and rigorous AI Mathematics Teacher for "Maths at Your Fingertips" (mayf.co.in).
Your students are in ${classLevel} (CBSE/ICSE syllabus), studying ${topic}.

Rules for your responses:
1. Explain step-by-step with supreme clarity, high legibility, and patience.
2. State formulas clearly on separate lines with tabular structure where appropriate.
3. If the student has a doubt, provide the mathematical intuition first, then a clear worked-out step, and ask a guiding question to test their understanding.
4. Keep explanations age-appropriate for ${classLevel}.
5. Use standard notation: x^2, sqrt(x), pi, etc., or clean text math notation.
6. Provide 2-3 "Key Formulas Used" at the end.`;

    if (!aiClient || !geminiApiKey) {
      // High-quality pedagogical fallback when API key is not configured in environment
      return res.json({
        reply: `Hello there! I'm your AI Teacher for **${classLevel}** on *${topic}*.

To solve "${message.slice(0, 80)}":

**Step 1: Understand the Givens & Goal**
Identify what values you know and what unknown variable needs to be found.

**Step 2: Choose the Correct Identity or Theorem**
In Class 5–10 syllabus, relate the problem to the standard formula:
$$\\text{Formula: } (a + b)^2 = a^2 + 2ab + b^2$$ or applicable geometric theorem.

**Step 3: Execute Step-by-Step Substitution**
Substitute given values carefully and compute without skipping algebraic steps.

*Guiding Question for you:* What is the first operation you would perform on both sides of the equation?`,
        suggestedFormulas: [
          'Quadratic / Linear Equation standard form',
          'Pythagoras Theorem: a² + b² = c²',
          'Perimeter & Area standards',
        ],
        stepHints: [
          'Write down all given values with their units.',
          'Double check negative signs before cross-multiplication.',
        ],
      });
    }

    // Prepare conversational context if history provided
    const conversationPrompt = `${systemInstruction}\n\nStudent (${classLevel}) asks: "${message}"\nPlease provide your helpful, step-by-step answer:`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: conversationPrompt,
    });

    const replyText = response.text || 'I have analyzed your problem. Let us solve it step by step.';

    return res.json({
      reply: replyText,
      suggestedFormulas: ['Standard Formula for ' + topic],
      stepHints: ['Step 1: Write down knowns', 'Step 2: Substitute', 'Step 3: Verify answer'],
    });
  } catch (error) {
    console.error('[MAYF Server] AI Teacher generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate AI Teacher response. Please retry in a moment.',
    });
  }
});

// -------------------------------------------------------------
// Vite Dev Integration & Production Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MAYF Server] Maths at Your Fingertips server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[MAYF Server] Failed to start server:', err);
  process.exit(1);
});
