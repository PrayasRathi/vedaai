import { create } from 'zustand';

export interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  type: 'mcq' | 'short_answer' | 'long_answer' | 'true_false';
  options?: string[];
}

export interface Section {
  id: string;
  title: string;
  instruction: string;
  questions: Question[];
  totalMarks: number;
}

export interface QuestionPaper {
  title: string;
  subject: string;
  totalMarks: number;
  duration: string;
  sections: Section[];
  generatedAt: string;
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  dueDate: string;
  questionTypes: string[];
  totalQuestions: number;
  totalMarks: number;
  additionalInstructions?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  questionPaper?: QuestionPaper;
  error?: string;
  createdAt: string;
  fileName?: string;
}

export interface GenerationStatus {
  status: string;
  progress: number;
  message?: string;
}

interface AssignmentStore {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  generationStatus: GenerationStatus | null;
  wsConnected: boolean;

  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
  removeAssignment: (id: string) => void;
  setCurrentAssignment: (assignment: Assignment | null) => void;
  updateAssignmentStatus: (id: string, status: Assignment['status'], questionPaper?: QuestionPaper) => void;
  setGenerationStatus: (status: GenerationStatus | null) => void;
  setWsConnected: (connected: boolean) => void;
}

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  assignments: [],
  currentAssignment: null,
  generationStatus: null,
  wsConnected: false,

  setAssignments: (assignments) => set({ assignments }),
  addAssignment: (assignment) =>
    set((state) => ({ assignments: [assignment, ...state.assignments] })),
  removeAssignment: (id) =>
    set((state) => ({ assignments: state.assignments.filter((a) => a._id !== id) })),
  setCurrentAssignment: (assignment) => set({ currentAssignment: assignment }),
  updateAssignmentStatus: (id, status, questionPaper) =>
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a._id === id ? { ...a, status, ...(questionPaper ? { questionPaper } : {}) } : a
      ),
      currentAssignment:
        state.currentAssignment?._id === id
          ? { ...state.currentAssignment, status, ...(questionPaper ? { questionPaper } : {}) }
          : state.currentAssignment,
    })),
  setGenerationStatus: (status) => set({ generationStatus: status }),
  setWsConnected: (connected) => set({ wsConnected: connected }),
}));
