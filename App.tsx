
import React, { useState, useCallback } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { QuizScreen } from './components/QuizScreen';
import { MasteryCertificate } from './components/MasteryCertificate';
import { generateInitialQuestion, generateNextQuestion } from './services/geminiService';
import type { GameState, Question, SubjectInfo } from './types';
import { MASTERY_THRESHOLD } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [subjectInfo, setSubjectInfo] = useState<SubjectInfo | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnswerWasCorrect, setLastAnswerWasCorrect] = useState<boolean | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleStartQuiz = useCallback(async (info: SubjectInfo, originalQuestion: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const question = await generateInitialQuestion(info, originalQuestion);
      setSubjectInfo(info);
      setCurrentQuestion(question);
      setCorrectAnswersCount(0);
      setGameState('quiz');
      setLastAnswerWasCorrect(null);
      setExplanation(null);
    } catch (err) {
      setError('Không thể tạo câu hỏi. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAnswer = useCallback(async (answerIndex: number) => {
    if (!currentQuestion || !subjectInfo) return;

    setIsLoading(true);
    setError(null);
    setExplanation(null);
    
    const isCorrect = answerIndex === currentQuestion.correctAnswerIndex;
    setLastAnswerWasCorrect(isCorrect);

    try {
        if (isCorrect) {
            const newCount = correctAnswersCount + 1;
            if (newCount >= MASTERY_THRESHOLD) {
                setGameState('mastery');
                return;
            }
            setCorrectAnswersCount(newCount);
        }

        const nextQuestionData = await generateNextQuestion(
            subjectInfo,
            currentQuestion,
            isCorrect,
            answerIndex
        );

        setCurrentQuestion(nextQuestionData.question);
        if (nextQuestionData.explanation) {
            setExplanation(nextQuestionData.explanation);
        }
    } catch (err) {
        setError('Không thể tạo câu hỏi tiếp theo. Vui lòng thử lại.');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
}, [currentQuestion, subjectInfo, correctAnswersCount]);


  const handleRestart = () => {
    setGameState('setup');
    setSubjectInfo(null);
    setCurrentQuestion(null);
    setCorrectAnswersCount(0);
    setError(null);
    setLastAnswerWasCorrect(null);
    setExplanation(null);
  };

  const renderContent = () => {
    switch (gameState) {
      case 'setup':
        return <SetupScreen onStart={handleStartQuiz} isLoading={isLoading} error={error} />;
      case 'quiz':
        if (currentQuestion && subjectInfo) {
          return (
            <QuizScreen
              question={currentQuestion}
              subjectInfo={subjectInfo}
              onAnswer={handleAnswer}
              isLoading={isLoading}
              progress={correctAnswersCount / MASTERY_THRESHOLD}
              lastAnswerCorrect={lastAnswerWasCorrect}
              explanation={explanation}
            />
          );
        }
        return null; 
      case 'mastery':
        return <MasteryCertificate subjectInfo={subjectInfo!} onRestart={handleRestart} />;
      default:
        return <div>Trạng thái không xác định</div>;
    }
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-3xl mx-auto">
            <header className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                    Trắc Nghiệm Biến Thể - Master AI
                </h1>
                <p className="text-slate-400 mt-2">Hiểu sâu bản chất, chinh phục kiến thức.</p>
            </header>
            <main className="bg-slate-800 rounded-2xl shadow-2xl shadow-purple-500/10 p-6 md:p-8 min-h-[400px] flex items-center justify-center">
                {renderContent()}
            </main>
             <footer className="text-center mt-8 text-slate-500 text-sm">
                <p>Cung cấp bởi Google Gemini API</p>
            </footer>
        </div>
    </div>
  );
};

export default App;
