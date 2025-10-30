import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameSettings, Stimulus, GameStats } from '../types';

interface UseGameLogicProps {
    settings: GameSettings;
    stimuli: Stimulus[];
    onResponse: (correct: boolean, comboCount: number) => void;
    isPaused: boolean;
}

type TurnResult = 'correct' | 'incorrect' | 'neutral';

export const useGameLogic = ({ settings, stimuli, onResponse, isPaused }: UseGameLogicProps) => {
    const [turn, setTurn] = useState(0);
    const [score, setScore] = useState(0);
    const [history, setHistory] = useState<(Stimulus | null)[]>([]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [userResponded, setUserResponded] = useState(false);
    const [showReviewHistory, setShowReviewHistory] = useState(false);
    const [lastResult, setLastResult] = useState<TurnResult>('neutral');
    const [scoreHistory, setScoreHistory] = useState<Array<{ turn: number; score: number; result: TurnResult }>>([{ turn: 0, score: 0, result: 'neutral' }]);

    // Stats for achievements
    const [currentStreak, setCurrentStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [incorrectPresses, setIncorrectPresses] = useState(0);
    
    const basePoints = useMemo(() => 10 * Math.pow(2, settings.nLevel - 1), [settings.nLevel]);
    const penalty = useMemo(() => Math.ceil(basePoints / 2), [basePoints]);


    const gameSequence = useMemo(() => {
        if (stimuli.length === 0) return [];
        const sequence: Stimulus[] = [];
        for (let i = 0; i < settings.gameLength; i++) {
            if (i >= settings.nLevel && Math.random() < 0.3) {
                sequence.push(sequence[i - settings.nLevel]);
            } else {
                const randomIndex = Math.floor(Math.random() * stimuli.length);
                sequence.push(stimuli[randomIndex]);
            }
        }
        return sequence;
    }, [settings.gameLength, settings.nLevel, stimuli]);

    const currentStimulus = turn < settings.gameLength ? gameSequence[turn] : null;

    const advanceTurn = useCallback(() => {
        if (isGameOver) return;

        setHistory(h => [...h, gameSequence[turn]]);
        if (turn < settings.gameLength - 1) {
            setTurn(t => t + 1);
            setUserResponded(false);
        } else {
            setIsGameOver(true);
        }
    }, [turn, settings.gameLength, isGameOver, gameSequence]);
    
    useEffect(() => {
        if (currentStreak > maxStreak) {
            setMaxStreak(currentStreak);
        }
    }, [currentStreak, maxStreak]);

    useEffect(() => {
        if (isPaused || isGameOver || stimuli.length === 0) {
            return;
        }

        const actualMatch = turn >= settings.nLevel && gameSequence[turn]?.id === gameSequence[turn - settings.nLevel]?.id;

        const turnTimer = setTimeout(() => {
            if (userResponded) return;
            
            if (actualMatch) {
                onResponse(false, 0);
                setScore(s => Math.max(0, s - penalty));
                setCurrentStreak(0);
                setIncorrectPresses(p => p + 1);
                setLastResult('incorrect');
                setShowReviewHistory(true);

                 setTimeout(() => {
                    setShowReviewHistory(false);
                    advanceTurn();
                }, 1000);
            } else {
                 setLastResult('neutral');
                 // A correct "no-op" should reset the streak.
                 setCurrentStreak(0);
                 advanceTurn();
            }

        }, settings.speed);

        return () => clearTimeout(turnTimer);

    }, [turn, isPaused, isGameOver, userResponded, stimuli.length, settings.speed, onResponse, advanceTurn, settings.nLevel, gameSequence, penalty]);

    const handleMatch = (userPressedMatch: boolean) => {
        if (userResponded || turn < settings.nLevel || isPaused) return;

        setUserResponded(true);

        const actualMatch = gameSequence[turn]?.id === gameSequence[turn - settings.nLevel]?.id;
        const isCorrect = userPressedMatch === actualMatch;

        if (isCorrect) {
            const newStreak = currentStreak + 1;
            const comboBonus = (newStreak - 1) * (5 * settings.nLevel);
            setScore(s => s + basePoints + comboBonus);
            setCurrentStreak(newStreak);
            onResponse(true, newStreak);
            setLastResult('correct');
            setTimeout(advanceTurn, 500);
        } else {
            setScore(s => Math.max(0, s - penalty));
            setCurrentStreak(0);
            setIncorrectPresses(p => p + 1);
            onResponse(false, 0);
            setLastResult('incorrect');
            setShowReviewHistory(true);
            setTimeout(() => {
                setShowReviewHistory(false);
                advanceTurn();
            }, settings.speed);
        }
    };
    
    useEffect(() => {
        setScoreHistory(prev => {
            const newHistory = [...prev];
            const lastTurnInHistory = newHistory[newHistory.length - 1];
            if (!lastTurnInHistory || lastTurnInHistory.turn !== turn) {
                newHistory.push({ turn, score, result: lastResult });
            }
            return newHistory;
        });
    }, [score, turn, lastResult]);


    const progress = ((turn + 1) / settings.gameLength) * 100;

    const gameStats: GameStats = {
        score,
        settings,
        maxStreak,
        incorrectPresses,
        gameCompleted: isGameOver
    };

    return {
        currentStimulus,
        score,
        turn: turn + 1,
        isGameOver,
        handleMatch,
        progress,
        history,
        showReviewHistory,
        scoreHistory,
        gameStats,
        currentStreak,
    };
};