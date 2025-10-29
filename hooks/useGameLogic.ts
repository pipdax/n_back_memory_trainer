import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameSettings, Stimulus } from '../types';

interface UseGameLogicProps {
    settings: GameSettings;
    stimuli: Stimulus[];
    onResponse: (correct: boolean) => void;
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

        if (turn < settings.nLevel) {
            setLastResult('neutral');
        }

        setHistory(h => [...h, gameSequence[turn]]);
        if (turn < settings.gameLength - 1) {
            setTurn(t => t + 1);
            setUserResponded(false);
        } else {
            setIsGameOver(true);
        }
    }, [turn, settings.gameLength, isGameOver, gameSequence, settings.nLevel]);

    useEffect(() => {
        if (isPaused || isGameOver || userResponded || stimuli.length === 0) {
            return;
        }

        const handleNoResponse = () => {
            if (turn < settings.nLevel) {
                advanceTurn();
                return;
            }

            onResponse(false);
            setScore(s => Math.max(0, s - 1));
            setLastResult('incorrect');
            setShowReviewHistory(true);

            setTimeout(() => {
                setShowReviewHistory(false);
                advanceTurn();
            }, settings.speed);
        };

        const timerId = window.setTimeout(handleNoResponse, settings.speed);
        return () => clearTimeout(timerId);

    }, [turn, isPaused, isGameOver, userResponded, stimuli.length, settings.speed, onResponse, advanceTurn, settings.nLevel]);

    const handleMatch = (userPressedMatch: boolean) => {
        if (userResponded || turn < settings.nLevel || isPaused) return;

        setUserResponded(true);

        const actualMatch = gameSequence[turn]?.id === gameSequence[turn - settings.nLevel]?.id;
        const isCorrect = userPressedMatch === actualMatch;

        setLastResult(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
            setScore(s => s + 2);
            onResponse(true);
            setTimeout(advanceTurn, 500);
        } else {
            setScore(s => Math.max(0, s - 1));
            onResponse(false);
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
            const existingEntryIndex = newHistory.findIndex(entry => entry.turn === turn);
            
            if(turn === 0 && score === 0) {
                return [{ turn: 0, score: 0, result: 'neutral' }];
            }

            if (existingEntryIndex !== -1) {
                // Entry for this turn already exists, update it
                if (newHistory[existingEntryIndex].score !== score || newHistory[existingEntryIndex].result !== lastResult) {
                    newHistory[existingEntryIndex] = { turn, score, result: lastResult };
                }
            } else {
                 // It's a new turn, add a new entry. `turn` is 0-indexed. The chart wants 1-based. Let's use `turn` as the key and adjust in the chart.
                 // The history should reflect the state *after* a turn is complete.
                 const lastTurnInHistory = prev[prev.length - 1];
                 if(lastTurnInHistory.turn < turn) {
                    newHistory.push({ turn, score, result: lastResult });
                 }
            }
             // Ensure turn 0 is always there.
             if(newHistory.length > 0 && newHistory[0].turn !== 0) {
                newHistory.unshift({ turn: 0, score: 0, result: 'neutral' });
             }

            return newHistory;
        });
    }, [score, turn, lastResult]);

    const progress = ((turn + 1) / settings.gameLength) * 100;

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
    };
};