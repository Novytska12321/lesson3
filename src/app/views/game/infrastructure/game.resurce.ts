import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, pipe } from "rxjs";
import { map } from "rxjs/operators";
import { GameService } from "../api/game.service";
import { GameQuestion } from "../api/game-question";
import { GameAnswer } from "../api/game-answer";
import { GameQuestionsResponseDto } from "./dto/game-questions-response.dto";
import { GameQuestionConverter } from "./converter/game-question.converter";

const OPENTDB_BASE_URL = 'https://opentdb.com/api.php'

@Injectable()
export class GameResource implements GameService {
    private httpClient = inject(HttpClient);

    private question = new GameQuestion(
        1,
        'My first question from TS',
        [
            new GameAnswer(1, 'Answer 1', true),
            new GameAnswer(2, 'Answer 2', false),
        ]
    );

    getQuestion() {
        return { ...this.question };
    }

    selectQuestion(): Observable<GameQuestion> {
        return this.httpClient.get<GameQuestionsResponseDto>(`${OPENTDB_BASE_URL}?amount=5`).pipe(
            map(response => GameQuestionConverter.toGameQuestion(response.results[0]))
        );
    }

    updateQuestionText(): void { }
}
