import { Observable } from "rxjs";
import { GameQuestion } from "./game-question";

export abstract class GameService {
    abstract getQuestion(): GameQuestion;
    abstract selectQuestion(): Observable<GameQuestion>;
    abstract updateQuestionText(text: string): void;
}
