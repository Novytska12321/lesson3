import { GameAnswer } from "../../api/game-answer";

let anwerIdCounter = 0

export class GameAnswerConverter {
    static toGameAnswer(answerText: string, isCorrect: boolean): GameAnswer {
        return new GameAnswer(
            anwerIdCounter++,
            answerText,
            isCorrect,
        );
    }
}
