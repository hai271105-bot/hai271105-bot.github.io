
export type GameState = 'setup' | 'quiz' | 'mastery';

export interface SubjectInfo {
  grade: string;
  subject: string;
  topic: string;
}

export interface Question {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}
