import { GameAnswer } from "../api/game-answer";
import { GameQuestion } from "../api/game-question";
import { GameService } from "../api/game.service";

export class GameServiceMock implements GameService {
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

    updateQuestionText(text: string) {
        this.question.text = text;
    }
}