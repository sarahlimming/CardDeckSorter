'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, RotateCcw, X, CheckCircle, XCircle } from 'lucide-react';

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'invalid';
type CardType = {
  id: string;
  suit: Suit;
  value: string;
  color: 'red' | 'black' | 'purple';
  isValid: boolean;
};

const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
  invalid: '★', // This will be overridden for individual invalid cards
};
const suitColors = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black',
  invalid: 'purple',
};

const invalidSymbols = ['★', '◆', '●', '▲', '◊', '※'];

export default function Component() {
  const [playerName, setPlayerName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [deck, setDeck] = useState<CardType[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [suitPiles, setSuitPiles] = useState<Record<Suit, CardType[]>>({
    hearts: [],
    diamonds: [],
    clubs: [],
    spades: [],
    invalid: [],
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [cardTimes, setCardTimes] = useState<number[]>([]);
  const [currentCardStartTime, setCurrentCardStartTime] = useState<
    number | null
  >(null);
  const [totalTime, setTotalTime] = useState(0);
  const [draggedCard, setDraggedCard] = useState<CardType | null>(null);
  const [correctMoves, setCorrectMoves] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);
  const [wrongMoves, setWrongMoves] = useState<
    { card: CardType; targetSuit: Suit; timestamp: number }[]
  >([]);

  const [leaderboard, setLeaderboard] = useState<
    { name: string; score: number; accuracy: number; time: number }[]
  >([]);

  const gameStartTimeRef = useRef<number | null>(null);

  // Initialize deck with 15 cards (12 valid + 3 invalid)
  const initializeDeck = () => {
    const values = [
      'A',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'J',
      'Q',
      'K',
    ];
    const validCards: CardType[] = [];

    // Create valid cards
    suits.forEach((suit) => {
      values.slice(0, 3).forEach((value) => {
        // Only take first 3 values per suit for 12 total
        validCards.push({
          id: `${suit}-${value}`,
          suit,
          value,
          color: suitColors[suit] as 'red' | 'black',
          isValid: true,
        });
      });
    });

    // Create 3 invalid cards
    const invalidCards: CardType[] = [];
    for (let i = 0; i < 3; i++) {
      invalidCards.push({
        id: `invalid-${i}`,
        suit: 'invalid',
        value: invalidSymbols[i],
        color: 'purple',
        isValid: false,
      });
    }

    // Combine and shuffle
    const allCards = [...validCards, ...invalidCards];
    return allCards.sort(() => Math.random() - 0.5);
  };

  const startGame = () => {
    if (!playerName.trim()) {
      setNameTouched(true);
      return;
    }
    const newDeck = initializeDeck();
    setDeck(newDeck);
    setCurrentCardIndex(0);
    setSuitPiles({
      hearts: [],
      diamonds: [],
      clubs: [],
      spades: [],
      invalid: [],
    });
    setGameStarted(true);
    setGameCompleted(false);
    setStartTime(Date.now());
    setCardTimes([]);
    setCurrentCardStartTime(Date.now());
    setTotalTime(0);
    setCorrectMoves(0);
    setTotalMoves(0);
    setWrongMoves([]);
    gameStartTimeRef.current = Date.now();
  };

  const nextCard = () => {
    if (currentCardIndex < deck.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setCurrentCardStartTime(Date.now());
    }
  };

  const handleDragStart = (e: React.DragEvent, card: CardType) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSuit: Suit) => {
    e.preventDefault();

    if (draggedCard) {
      const isCorrectMove =
        draggedCard.suit === targetSuit ||
        (!draggedCard.isValid && targetSuit === 'invalid');

      // Always add the card to the pile (allowing wrong moves)
      setSuitPiles((prev) => ({
        ...prev,
        [targetSuit]: [...prev[targetSuit], draggedCard],
      }));

      // Track the move
      setTotalMoves((prev) => prev + 1);

      if (isCorrectMove) {
        setCorrectMoves((prev) => prev + 1);
      } else {
        setWrongMoves((prev) => [
          ...prev,
          {
            card: draggedCard,
            targetSuit,
            timestamp: Date.now(),
          },
        ]);
      }

      // Record time taken for this card
      if (currentCardStartTime) {
        const timeForCard = Date.now() - currentCardStartTime;
        setCardTimes((prev) => [...prev, timeForCard]);
      }

      // Move to next card automatically
      if (currentCardIndex < deck.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setCurrentCardStartTime(Date.now());
      }
    }

    setDraggedCard(null);
  };

  // Check if game is completed
  useEffect(() => {
    const totalSorted = Object.values(suitPiles).reduce(
      (sum, pile) => sum + pile.length,
      0
    );
    if (totalSorted === 15 && gameStarted && !gameCompleted) {
      setGameCompleted(true);
      if (gameStartTimeRef.current) {
        setTotalTime(Date.now() - gameStartTimeRef.current);
      }
    }
  }, [suitPiles, gameStarted, gameCompleted]);

  // Save score to localStorage and update leaderboard
  useEffect(() => {
    if (gameCompleted && playerName.trim()) {
      const score = isPassed
        ? Math.round(accuracy * (1000 / (totalTime / 1000)))
        : 0;
      const newEntry = {
        name: playerName.trim(),
        score,
        accuracy,
        time: totalTime,
      };
      let scores: typeof leaderboard = [];
      try {
        scores = JSON.parse(
          localStorage.getItem('card-sorting-leaderboard') || '[]'
        );
      } catch {}
      scores.push(newEntry);
      scores.sort((a, b) => b.score - a.score || a.time - b.time);
      scores = scores.slice(0, 10); // keep top 10
      localStorage.setItem('card-sorting-leaderboard', JSON.stringify(scores));
      setLeaderboard(scores);
    } else if (gameCompleted) {
      // Load leaderboard if not saving
      try {
        setLeaderboard(
          JSON.parse(localStorage.getItem('card-sorting-leaderboard') || '[]')
        );
      } catch {
        setLeaderboard([]);
      }
    }
  }, [gameCompleted]);

  const currentCard = deck[currentCardIndex];
  const averageTime =
    cardTimes.length > 0
      ? cardTimes.reduce((a, b) => a + b, 0) / cardTimes.length
      : 0;
  const totalSorted = Object.values(suitPiles).reduce(
    (sum, pile) => sum + pile.length,
    0
  );
  const accuracy = totalMoves > 0 ? (correctMoves / totalMoves) * 100 : 0;
  const isPassed = accuracy >= 90; // 90% accuracy required to pass

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  const getCardSymbol = (card: CardType) => {
    if (!card.isValid) {
      return card.value; // For invalid cards, value contains the symbol
    }
    return suitSymbols[card.suit];
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-800">
              Card Sorting Solitaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Sort 15 cards into their correct suit piles. Watch out for invalid
              cards! You need 90% accuracy to pass.
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onBlur={() => setNameTouched(true)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {nameTouched && !playerName.trim() && (
                <div className="text-red-500 text-xs">
                  Please enter your name to start.
                </div>
              )}
            </div>
            <Button
              onClick={startGame}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!playerName.trim()}
            >
              Start Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            {accuracy === 100 && (
              <div className="bg-yellow-300 text-yellow-900 font-extrabold text-xl py-2 rounded mb-2 animate-bounce shadow">
                PERFECT!
              </div>
            )}
            {isPassed ? (
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            ) : (
              <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            )}
            <CardTitle
              className={`text-2xl font-bold ${
                isPassed ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {isPassed ? 'Congratulations!' : 'Game Over'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              {isPassed
                ? "You've successfully completed the game!"
                : 'You need 90% accuracy to pass. Try again!'}
            </p>
            <div className="text-lg font-semibold text-green-800">
              Player: {playerName}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Time:</span>
                  <Badge variant="secondary">{formatTime(totalTime)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Average per Card:</span>
                  <Badge variant="secondary">{formatTime(averageTime)}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <Badge variant={isPassed ? 'default' : 'destructive'}>
                    {accuracy.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Score:</span>
                  <Badge variant={isPassed ? 'default' : 'secondary'}>
                    {isPassed
                      ? Math.round(accuracy * (1000 / (totalTime / 1000)))
                      : 0}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>
                Correct: {correctMoves} | Wrong: {totalMoves - correctMoves} |
                Total: {totalMoves}
              </p>
            </div>

            {wrongMoves.length > 0 && (
              <div className="text-left">
                <h4 className="font-semibold text-sm mb-2">Wrong Moves:</h4>
                <div className="max-h-20 overflow-y-auto text-xs space-y-1">
                  {wrongMoves.map((move, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-red-600"
                    >
                      <X className="w-3 h-3" />
                      <span>
                        {move.card.isValid
                          ? `${move.card.value} of ${move.card.suit}`
                          : `Invalid card ${move.card.value}`}
                        → {move.targetSuit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="font-bold text-lg mb-2 text-green-800">
                Leaderboard
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border">
                  <thead>
                    <tr className="bg-green-100">
                      <th className="px-2 py-1 border">#</th>
                      <th className="px-2 py-1 border">Name</th>
                      <th className="px-2 py-1 border">Score</th>
                      <th className="px-2 py-1 border">Accuracy</th>
                      <th className="px-2 py-1 border">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, idx) => (
                      <tr
                        key={idx}
                        className={
                          entry.name === playerName.trim() &&
                          entry.score ===
                            (isPassed
                              ? Math.round(
                                  accuracy * (1000 / (totalTime / 1000))
                                )
                              : 0) &&
                          entry.time === totalTime
                            ? 'bg-yellow-100 font-bold'
                            : ''
                        }
                      >
                        <td className="px-2 py-1 border text-center">
                          {idx + 1}
                        </td>
                        <td className="px-2 py-1 border">{entry.name}</td>
                        <td className="px-2 py-1 border text-center">
                          {entry.score}
                        </td>
                        <td className="px-2 py-1 border text-center">
                          {entry.accuracy.toFixed(1)}%
                        </td>
                        <td className="px-2 py-1 border text-center">
                          {formatTime(entry.time)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Button
              onClick={startGame}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with stats */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-800">
            Card Sorting Solitaire
          </h1>
          <div className="flex gap-4 items-center">
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Avg: {formatTime(averageTime)}
            </Badge>
            <Badge variant="outline">Sorted: {totalSorted}/15</Badge>
            <Badge variant={accuracy >= 90 ? 'default' : 'destructive'}>
              Accuracy: {accuracy.toFixed(1)}%
            </Badge>
            <Button variant="outline" size="sm" onClick={startGame}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Current Card */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Card</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  {currentCard && (
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, currentCard)}
                      className={`w-24 h-32 bg-white border-2 ${
                        currentCard.isValid
                          ? 'border-gray-300'
                          : 'border-purple-400'
                      } rounded-lg flex flex-col items-center justify-center cursor-move hover:shadow-lg transition-shadow`}
                    >
                      <span
                        className={`text-3xl ${
                          currentCard.color === 'red'
                            ? 'text-red-500'
                            : currentCard.color === 'black'
                            ? 'text-black'
                            : 'text-purple-500'
                        }`}
                      >
                        {getCardSymbol(currentCard)}
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          currentCard.color === 'red'
                            ? 'text-red-500'
                            : currentCard.color === 'black'
                            ? 'text-black'
                            : 'text-purple-500'
                        }`}
                      >
                        {currentCard.isValid ? currentCard.value : 'INVALID'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Card {currentCardIndex + 1} of {deck.length}
                  </p>
                  <Button
                    onClick={nextCard}
                    disabled={currentCardIndex >= deck.length - 1}
                    className="w-full"
                  >
                    Next Card
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Suit Piles */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sort by Suit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[...suits, 'invalid'].map((suit) => (
                    <div
                      key={suit}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, suit)}
                      className={`min-h-40 border-2 border-dashed rounded-lg p-2 bg-white hover:border-gray-400 transition-colors ${
                        suit === 'invalid'
                          ? 'border-purple-300'
                          : 'border-gray-300'
                      }`}
                    >
                      <div className="text-center mb-2">
                        <span
                          className={`text-2xl ${
                            suit === 'invalid'
                              ? 'text-purple-500'
                              : suitColors[suit] === 'red'
                              ? 'text-red-500'
                              : 'text-black'
                          }`}
                        >
                          {suit === 'invalid' ? '✗' : suitSymbols[suit]}
                        </span>
                        <p className="text-xs text-gray-600 capitalize">
                          {suit === 'invalid' ? 'Invalid' : suit}
                        </p>
                      </div>

                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {suitPiles[suit].map((card, index) => (
                          <div
                            key={card.id}
                            className={`w-full h-8 border rounded flex items-center justify-center text-xs ${
                              card.isValid ? 'bg-gray-100' : 'bg-purple-100'
                            }`}
                          >
                            <span
                              className={
                                card.color === 'red'
                                  ? 'text-red-500'
                                  : card.color === 'black'
                                  ? 'text-black'
                                  : 'text-purple-500'
                              }
                            >
                              {card.isValid ? card.value : card.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="text-center mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {suitPiles[suit].length}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 text-center">
              Drag each card to its matching suit pile. Invalid cards (purple)
              go to the Invalid pile. You need 90% accuracy to pass!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
