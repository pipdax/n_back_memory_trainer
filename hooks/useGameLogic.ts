import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameSettings, Stimulus, GameStats } from '../types';

interface UseGameLogicProps {
    settings: GameSettings;
    stimuli: Stimulus[];
    onResponse: (correct: boolean, comboCount: number) => void;
    isPaused: boolean;
}

type TurnResult = 'correct' | 'incorrect' | 'neutral';

/**
 * Post-processes a shuffled array of turn types to break up long streaks.
 * This ensures a more balanced distribution of matches and non-matches.
 * @param types The shuffled array of booleans (true for match, false for non-match).
 * @param maxStreak The maximum allowed number of consecutive identical types.
 * @returns A new array with streaks broken up.
 */
const balanceTurnTypes = (types: boolean[], maxStreak: number): boolean[] => {
    const balanced = [...types];
    let passes = 0;
    const maxPasses = 5; // Failsafe to prevent infinite loops in weird edge cases

    // A single pass might not be enough as a swap can create a new streak.
    // We'll loop until a full pass makes no changes, or we hit a pass limit.
    while (passes < maxPasses) {
        let changesMade = false;
        for (let i = 0; i <= balanced.length - maxStreak; i++) {
            const slice = balanced.slice(i, i + maxStreak + 1);
            if (slice.length < maxStreak + 1) continue;

            const allSame = slice.every(val => val === slice[0]);

            if (allSame) {
                // A streak longer than maxStreak is found.
                const streakType = slice[0];
                let swapIndex = -1;
                
                // Find a different typed element to swap with the end of the streak.
                // We search from the end of the array backwards to increase randomness.
                for (let j = balanced.length - 1; j > i + maxStreak; j--) {
                    if (balanced[j] !== streakType) {
                        swapIndex = j;
                        break;
                    }
                }
                
                if (swapIndex !== -1) {
                    const swapTargetIndex = i + maxStreak;
                    [balanced[swapTargetIndex], balanced[swapIndex]] = [balanced[swapIndex], balanced[swapTargetIndex]];
                    changesMade = true;
                }
            }
        }
        if (!changesMade) {
            break; // The sequence is balanced, exit the loop.
        }
        passes++;
    }
    return balanced;
};


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
        // Need at least 2 unique stimuli for a good game, otherwise non-match logic fails.
        if (stimuli.length < 2) return [];

        const { gameLength, nLevel } = settings;
        const sequence: Stimulus[] = [];

        // Helper to get a random stimulus, excluding specific ones by ID
        const getRandomStimulus = (exclude: (Stimulus | null)[] = []): Stimulus => {
            const excludeIds = new Set(exclude.filter(s => s).map(s => s!.id));
            const available = stimuli.filter(s => !excludeIds.has(s.id));

            if (available.length === 0) {
                // Fallback: if all unique stimuli are excluded (very unlikely), just pick from the original list
                return stimuli[Math.floor(Math.random() * stimuli.length)];
            }

            return available[Math.floor(Math.random() * available.length)];
        };

        // 1. Generate the initial part of the sequence (no matches possible)
        for (let i = 0; i < nLevel; i++) {
            // Ensure the first nLevel items are unique to avoid accidental 1-back matches etc.
            const exclusions = sequence.slice(0, i);
            sequence.push(getRandomStimulus(exclusions));
        }

        // 2. Determine the number and position of matches for the rest of the game
        const remainingTurns = gameLength - nLevel;
        if (remainingTurns <= 0) return sequence;
        
        // Aim for ~33% matches, ensuring at least one if possible.
        const numMatches = Math.max(1, Math.round(remainingTurns * 0.33));
        const numNonMatches = remainingTurns - numMatches;

        const turnTypes: boolean[] = [
            ...Array(numMatches).fill(true), // true for match
            ...Array(numNonMatches).fill(false), // false for non-match
        ];

        // Shuffle turn types for randomness (Fisher-Yates shuffle)
        for (let i = turnTypes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [turnTypes[i], turnTypes[j]] = [turnTypes[j], turnTypes[i]];
        }
        
        // Balance the shuffled sequence to avoid long streaks of matches or non-matches
        const balancedTurnTypes = balanceTurnTypes(turnTypes, 3); // Max streak of 3

        // 3. Generate the rest of the sequence based on balanced turn types
        for (let i = 0; i < remainingTurns; i++) {
            const turnIndex = i + nLevel;
            const isMatchTurn = balancedTurnTypes[i];
            
            const nBackStimulus = sequence[turnIndex - nLevel];

            if (isMatchTurn) {
                sequence.push(nBackStimulus);
            } else {
                // It's a non-match turn. Pick a stimulus that is NOT the n-back one.
                // Also, for n-level=1, ensure it's not the same as the previous one
                // to avoid creating an unintentional 1-back non-match.
                const exclusions = [nBackStimulus];
                if (nLevel === 1) {
                    const previousStimulus = sequence[turnIndex - 1];
                    exclusions.push(previousStimulus);
                }
                sequence.push(getRandomStimulus(exclusions));
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
        if (isPaused || isGameOver || stimuli.length === 0 || gameSequence.length === 0) {
            return;
        }

        const actualMatch = turn >= settings.nLevel && gameSequence[turn]?.id === gameSequence[turn - settings.nLevel]?.id;

        const turnTimer = setTimeout(() => {
            if (userResponded) return;
            
            // Timer runs out - this is an incorrect action only if there WAS a match
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
                 // Correct "no-op": No match, and user correctly did nothing.
                 // This no longer breaks the combo streak.
                 setLastResult('neutral');
                 advanceTurn();
            }

        }, settings.speed);

        return () => clearTimeout(turnTimer);

    }, [turn, isPaused, isGameOver, userResponded, stimuli.length, settings.speed, onResponse, advanceTurn, settings.nLevel, gameSequence, penalty]);

    const handleMatch = (userPressedMatch: boolean) => {
        if (userResponded || turn < settings.nLevel || isPaused || gameSequence.length === 0) return;

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
