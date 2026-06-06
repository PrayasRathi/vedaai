import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  type: 'mcq' | 'short_answer' | 'long_answer' | 'true_false';
  options?: string[];
}

export interface ISection {
  id: string;
  title: string;
  instruction: string;
  questions: IQuestion[];
  totalMarks: number;
}

export interface IQuestionPaper {
  title: string;
  subject: string;
  totalMarks: number;
  duration: string;
  sections: ISection[];
  generatedAt: Date;
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  dueDate: Date;
  questionTypes: string[];
  totalQuestions: number;
  totalMarks: number;
  additionalInstructions?: string;
  fileContent?: string;
  fileName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  questionPaper?: IQuestionPaper;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema({
  id: String,
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  marks: { type: Number, required: true },
  type: { type: String, enum: ['mcq', 'short_answer', 'long_answer', 'true_false'], required: true },
  options: [String],
});

const SectionSchema = new Schema({
  id: String,
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema],
  totalMarks: Number,
});

const QuestionPaperSchema = new Schema({
  title: String,
  subject: String,
  totalMarks: Number,
  duration: String,
  sections: [SectionSchema],
  generatedAt: Date,
});

const AssignmentSchema = new Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    dueDate: { type: Date, required: true },
    questionTypes: [{ type: String }],
    totalQuestions: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    additionalInstructions: String,
    fileContent: String,
    fileName: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    jobId: String,
    questionPaper: QuestionPaperSchema,
    error: String,
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
