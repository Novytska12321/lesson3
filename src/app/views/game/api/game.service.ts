import { GameQuestion } from "./game-question";

export abstract class GameService {
    abstract getQuestion(): GameQuestion;
    abstract updateQuestionText(text: string): void;
}
