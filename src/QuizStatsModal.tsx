import { useState, useEffect } from "react";
import { getAllResults } from "./quizStorage";

interface Stats {
    totalQuestions: number;
    totalCorrect: number;
    totalIncorrect: number;
    totalAttempts: number;
    accuracy: number;
    questionStats: Array<{
        questionIndex: number;
        correctCount: number;
        incorrectCount: number;
        totalAttempts: number;
        accuracy: number;
    }>;
}

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function QuizStatsModal({ isOpen, onClose }: StatsModalProps) {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchStats();
        }
        // eslint-disable-next-line
    }, [isOpen]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const results = await getAllResults();
            const totalQuestions = results.length;
            const totalCorrect = results.reduce((sum, r) => sum + (r.correctCount || 0), 0);
            const totalIncorrect = results.reduce((sum, r) => sum + (r.incorrectCount || 0), 0);
            const totalAttempts = totalCorrect + totalIncorrect;
            const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
            const questionStats = results.map((r: any) => ({
                questionIndex: r.questionIndex,
                correctCount: r.correctCount || 0,
                incorrectCount: r.incorrectCount || 0,
                totalAttempts: (r.correctCount || 0) + (r.incorrectCount || 0),
                accuracy: (r.correctCount || 0) + (r.incorrectCount || 0) > 0
                    ? Math.round((r.correctCount / ((r.correctCount || 0) + (r.incorrectCount || 0))) * 100 * 100) / 100
                    : 0
            }));
            setStats({
                totalQuestions,
                totalCorrect,
                totalIncorrect,
                totalAttempts,
                accuracy: Math.round(accuracy * 100) / 100,
                questionStats
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : '統計情報の取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">統計情報</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {loading && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">統計情報を読み込み中...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-8">
                            <p className="text-red-600">{error}</p>
                            <button
                                onClick={fetchStats}
                                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                再試行
                            </button>
                        </div>
                    )}

                    {stats && !loading && (
                        <div className="space-y-6">
                            {/* 全体統計 */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-600">{stats.totalQuestions}</div>
                                    <div className="text-sm text-gray-600">問題数</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-600">{stats.totalCorrect}</div>
                                    <div className="text-sm text-gray-600">正解数</div>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-red-600">{stats.totalIncorrect}</div>
                                    <div className="text-sm text-gray-600">不正解数</div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-purple-600">{stats.accuracy}%</div>
                                    <div className="text-sm text-gray-600">正解率</div>
                                </div>
                            </div>

                            {/* 問題別統計 */}
                            {stats.questionStats.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">問題別統計</h3>
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {stats.questionStats.map((questionStat, index) => (
                                            <div key={index} className="border rounded-lg p-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium">問題 {questionStat.questionIndex + 1}</span>
                                                    <span className={`px-2 py-1 rounded text-sm font-semibold ${questionStat.accuracy >= 80 ? 'bg-green-100 text-green-800' :
                                                            questionStat.accuracy >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                        }`}>
                                                        {questionStat.accuracy}%
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                                                    <div>正解: {questionStat.correctCount}</div>
                                                    <div>不正解: {questionStat.incorrectCount}</div>
                                                    <div>挑戦回数: {questionStat.totalAttempts}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {stats.questionStats.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    まだ統計データがありません。問題に挑戦してみてください。
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 