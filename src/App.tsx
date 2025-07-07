import { useEffect, useState } from "react";
import QuizStatsModal from "./QuizStatsModal";
import { getResult, setResult, getAllResults, clearAllResults } from "./quizStorage";

interface Question {
  section: string;
  question: string;
  options: string[];
  answer: string;
}

interface QuizState {
  currentQuestionIndex: number;
  selectedOption: number | null;
  isConfirmed: boolean;
  isCorrect: boolean | null;
  showExplanation: boolean;
  score: number;
  totalAnswered: number;
  wrongAnswers: number[];
}

function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    selectedOption: null,
    isConfirmed: false,
    isCorrect: null,
    showExplanation: false,
    score: 0,
    totalAnswered: 0,
    wrongAnswers: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/questions.json")
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data);
        setLoading(false);
      })
      .catch(() => {
        setError("問題データの読み込みに失敗しました");
        setLoading(false);
      });
  }, []);

  const handleOptionSelect = (optionIndex: number) => {
    if (!quizState.isConfirmed) {
      setQuizState((prev) => ({ ...prev, selectedOption: optionIndex }));
    }
  };

  const handleConfirm = async () => {
    if (quizState.selectedOption === null) return;
    const currentQuestion = questions[quizState.currentQuestionIndex];
    const isCorrect = currentQuestion.options[quizState.selectedOption] === currentQuestion.answer;
    setQuizState((prev) => ({
      ...prev,
      isConfirmed: true,
      isCorrect,
      showExplanation: true,
      score: prev.score + (isCorrect ? 1 : 0),
      totalAnswered: prev.totalAnswered + 1,
      wrongAnswers: isCorrect ? prev.wrongAnswers : [...prev.wrongAnswers, quizState.currentQuestionIndex],
    }));
    await setResult(quizState.currentQuestionIndex, isCorrect);
  };

  const handleNext = () => {
    if (quizState.currentQuestionIndex < questions.length - 1) {
      setQuizState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        selectedOption: null,
        isConfirmed: false,
        isCorrect: null,
        showExplanation: false,
      }));
    }
  };

  const handleWrongQuestionsOnly = () => {
    if (quizState.wrongAnswers.length === 0) {
      alert("間違えた問題はありません。");
      return;
    }
    const wrongQuestions = quizState.wrongAnswers.map((index) => questions[index]);
    setQuestions(wrongQuestions);
    setQuizState({
      currentQuestionIndex: 0,
      selectedOption: null,
      isConfirmed: false,
      isCorrect: null,
      showExplanation: false,
      score: 0,
      totalAnswered: 0,
      wrongAnswers: [],
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.questions && Array.isArray(data.questions)) {
          const convertedQuestions = data.questions.map((q: any) => ({
            section: q.section || "カスタム",
            question: q.question,
            options: q.options,
            answer: q.options[q.correct] || q.answer,
          }));
          setQuestions(convertedQuestions);
        } else if (Array.isArray(data)) {
          setQuestions(data);
        } else {
          alert("無効なJSONファイル形式です。");
        }
        setQuizState({
          currentQuestionIndex: 0,
          selectedOption: null,
          isConfirmed: false,
          isCorrect: null,
          showExplanation: false,
          score: 0,
          totalAnswered: 0,
          wrongAnswers: [],
        });
      } catch (err) {
        alert("JSONファイルの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">問題を読み込み中...</div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }
  const currentQuestion = questions[quizState.currentQuestionIndex];
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold">情報学基礎論</h3>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
              JSONファイルをアップロード
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
            <button onClick={handleWrongQuestionsOnly} className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors">
              間違えた問題のみ
            </button>
            <button onClick={() => setShowStatsModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">
              統計
            </button>
            <button onClick={async () => { await clearAllResults(); window.location.reload(); }} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
              成績リセット
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        {questions.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">問題 {quizState.currentQuestionIndex + 1} / {questions.length}</span>
                <span className="text-sm text-gray-600">正解: {quizState.score} / {quizState.totalAnswered}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${((quizState.currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
              </div>
            </div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">{currentQuestion.question}</h2>
              <p className="text-sm text-gray-600 mb-4">セクション: {currentQuestion.section}</p>
            </div>
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  disabled={quizState.isConfirmed}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${quizState.selectedOption === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'} ${quizState.isConfirmed ? option === currentQuestion.answer ? 'border-green-500 bg-green-50' : quizState.selectedOption === index ? 'border-red-500 bg-red-50' : '' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
            {!quizState.isConfirmed && quizState.selectedOption !== null && (
              <div className="mb-6">
                <button onClick={handleConfirm} className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  確定
                </button>
              </div>
            )}
            {quizState.showExplanation && (
              <div className="mb-6 p-4 rounded-lg bg-gray-50">
                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${quizState.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {quizState.isCorrect ? '正解！' : '不正解'}
                  </span>
                </div>
                <p className="text-gray-700">
                  <strong>正解:</strong> {currentQuestion.answer}
                </p>
              </div>
            )}
            {quizState.isConfirmed && quizState.currentQuestionIndex < questions.length - 1 && (
              <button onClick={handleNext} className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold">
                次の問題
              </button>
            )}
            {quizState.isConfirmed && quizState.currentQuestionIndex === questions.length - 1 && (
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4">クイズ完了！</h3>
                <p className="text-lg mb-4">最終スコア: {quizState.score} / {quizState.totalAnswered}</p>
                <button onClick={() => window.location.reload()} className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  最初からやり直す
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-600">問題がありません。</div>
        )}
      </main>
      <QuizStatsModal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} />
    </div>
  );
}

export default App;
