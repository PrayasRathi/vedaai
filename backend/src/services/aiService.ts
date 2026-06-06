import Groq from 'groq-sdk';
import { IQuestionPaper, ISection, IQuestion } from '../models/Assignment';
import { v4 as uuidv4 } from 'uuid';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface GenerateInput {
  title: string;
  subject: string;
  questionTypes: { type: string; count: number; marks: number }[];
  totalQuestions: number;
  totalMarks: number;
  additionalInstructions?: string;
  fileContent?: string;
}

function buildPrompt(input: GenerateInput): string {
  const questionTypesDesc = input.questionTypes
    .map((qt) => `- ${qt.type}: ${qt.count} questions, ${qt.marks} marks each`)
    .join('\n');
  const context = input.fileContent
    ? `\n\nReference material:\n${input.fileContent.slice(0, 3000)}`
    : '';
  return `You are an expert teacher. Return ONLY a valid JSON object, no markdown, no explanation, no code fences.
Start your response with { and end with }

Assignment: ${input.title}
Subject: ${input.subject}
Total Questions: ${input.totalQuestions}
Total Marks: ${input.totalMarks}
Question Types Required:
${questionTypesDesc}
${input.additionalInstructions ? `Additional Instructions: ${input.additionalInstructions}` : ''}${context}

Return this exact JSON structure:
{
  "title": "assignment title",
  "subject": "subject name",
  "totalMarks": 0,
  "duration": "60 minutes",
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions",
      "questions": [
        {
          "text": "full question text here",
          "difficulty": "easy",
          "marks": 1,
          "type": "short_answer",
          "options": []
        }
      ]
    }
  ]
}

STRICT RULES:
- difficulty must be exactly one of: "easy", "medium", "hard"
- type must be exactly one of: "mcq", "short_answer", "long_answer", "true_false"
- For MCQ always include exactly 4 options: ["A. option1", "B. option2", "C. option3", "D. option4"]
- For non-MCQ set options to empty array []
- Group questions by type into separate sections (Section A, B, C...)
- Distribute difficulty: 40% easy, 40% medium, 20% hard
- Make questions specific and relevant to the subject
- RETURN ONLY THE JSON OBJECT, NOTHING ELSE`;
}

function sanitizeJson(raw: string): string {
  let s = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a !== -1 && b > a) s = s.slice(a, b + 1);
  return s;
}

function enrichPaper(parsed: any, input: GenerateInput): IQuestionPaper {
  if (!parsed || !Array.isArray(parsed.sections) || parsed.sections.length === 0)
    throw new Error('Invalid paper structure from AI');

  const validD = ['easy', 'medium', 'hard'];
  const validT = ['mcq', 'short_answer', 'long_answer', 'true_false'];

  const sections: ISection[] = parsed.sections.map((sec: any, si: number) => {
    const questions: IQuestion[] = (sec.questions || []).map((q: any) => ({
      id: uuidv4(),
      text: String(q.text || '').trim() || 'Question text missing',
      difficulty: validD.includes(q.difficulty) ? q.difficulty : 'medium',
      marks: Number(q.marks) > 0 ? Number(q.marks) : (input.questionTypes[0]?.marks || 1),
      type: validT.includes(q.type) ? q.type : 'short_answer',
      options: q.type === 'mcq' && Array.isArray(q.options) && q.options.length >= 2
        ? q.options.slice(0, 4)
        : undefined,
    }));
    return {
      id: uuidv4(),
      title: sec.title || `Section ${String.fromCharCode(65 + si)}`,
      instruction: sec.instruction || 'Attempt all questions.',
      questions,
      totalMarks: questions.reduce((s, q) => s + q.marks, 0),
    };
  });

  return {
    title: parsed.title || input.title,
    subject: parsed.subject || input.subject,
    totalMarks: sections.reduce((s, sec) => s + sec.totalMarks, 0),
    duration: parsed.duration || '60 minutes',
    sections,
    generatedAt: new Date(),
  };
}

export async function generateQuestionPaper(input: GenerateInput): Promise<IQuestionPaper> {
  const prompt = buildPrompt(input);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🤖 Groq AI attempt ${attempt}/3`);

      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert teacher who creates structured question papers. Always respond with valid JSON only, no markdown, no explanation.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      });

      const raw = completion.choices[0]?.message?.content || '';
      if (!raw) throw new Error('Empty response from Groq');

      console.log(`📝 Raw response length: ${raw.length} chars`);

      const cleaned = sanitizeJson(raw);
      const parsed = JSON.parse(cleaned);
      const paper = enrichPaper(parsed, input);

      console.log(`✅ Groq generation successful on attempt ${attempt}`);
      return paper;

    } catch (err) {
      lastError = err as Error;
      console.error(`❌ Attempt ${attempt} failed:`, lastError.message);
      if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  throw new Error(`AI generation failed after 3 attempts: ${lastError?.message}`);
}