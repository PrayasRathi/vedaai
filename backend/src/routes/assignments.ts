import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { Assignment } from '../models/Assignment';
import { generateQuestionPaper } from '../services/aiService';
import { notifyAssignment } from '../services/websocket';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Process job directly without BullMQ
async function processAssignment(assignmentId: string) {
  try {
    await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });
    notifyAssignment(assignmentId, { type: 'status', status: 'processing', progress: 20, message: 'Starting generation...' });

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return;

    notifyAssignment(assignmentId, { type: 'status', status: 'processing', progress: 50, message: 'Generating questions with AI...' });

    const questionTypes = assignment.questionTypes.map((qt: string) => {
      try { return JSON.parse(qt); } catch { return qt; }
    });

    const questionPaper = await generateQuestionPaper({
      title: assignment.title,
      subject: assignment.subject,
      questionTypes,
      totalQuestions: assignment.totalQuestions,
      totalMarks: assignment.totalMarks,
      additionalInstructions: assignment.additionalInstructions,
      fileContent: assignment.fileContent,
    });

    await Assignment.findByIdAndUpdate(assignmentId, { status: 'completed', questionPaper });
    notifyAssignment(assignmentId, { type: 'completed', status: 'completed', progress: 100, questionPaper });
    console.log(`✅ Assignment ${assignmentId} completed`);
  } catch (err: any) {
    console.error(`❌ Assignment ${assignmentId} failed:`, err.message);
    await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed', error: err.message });
    notifyAssignment(assignmentId, { type: 'failed', status: 'failed', error: err.message });
  }
}

const schema = z.object({
  title: z.string().min(1),
  subject: z.string().min(1),
  dueDate: z.string().min(1),
  questionTypes: z.string(),
  totalQuestions: z.coerce.number().min(1),
  totalMarks: z.coerce.number().min(1),
  additionalInstructions: z.string().optional(),
});

// GET all
router.get('/', async (req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find()
      .select('-questionPaper -fileContent')
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET one
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Not found' });
    res.json(assignment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { title, subject, dueDate, questionTypes, totalQuestions, totalMarks, additionalInstructions } = parsed.data;

    const qtParsed = JSON.parse(questionTypes);

    const assignment = await Assignment.create({
      title,
      subject,
      dueDate: new Date(dueDate),
      questionTypes: qtParsed.map((qt: any) => JSON.stringify(qt)),
      totalQuestions,
      totalMarks,
      additionalInstructions,
      fileContent: req.file ? req.file.buffer.toString('utf-8') : undefined,
      status: 'pending',
    });

    res.status(201).json({ assignment });

    // Process in background WITHOUT Redis/BullMQ
    setImmediate(() => processAssignment(assignment._id.toString()));

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST regenerate
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Not found' });
    if (assignment.status === 'processing' || assignment.status === 'pending') {
      return res.status(409).json({ error: 'Already processing' });
    }

    await Assignment.findByIdAndUpdate(req.params.id, {
      status: 'pending', questionPaper: undefined, error: undefined,
    });

    res.json({ message: 'Regeneration started' });
    setImmediate(() => processAssignment(req.params.id));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;