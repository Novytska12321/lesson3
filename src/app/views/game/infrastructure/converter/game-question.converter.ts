import { map } from "rxjs";
import { GameAnswer } from "../../api/game-answer";
import { GameQuestion } from "../../api/game-question";
import { GameQuestionDto } from "../dto/game-questions-response.dto";
import { GameAnswerConverter } from "./game-answer.converter";

let questionIdCounter = 0
let anwerIdCounter = 0

export class GameQuestionConverter {

    static toGameQuestion(dto: GameQuestionDto): GameQuestion {
        return new GameQuestion(
            questionIdCounter++,
            dto.question,
            shuffle([GameAnswerConverter.toGameAnswer(dto.correct_answer, true), ...dto.incorrect_answers.map(answer => GameAnswerConverter.toGameAnswer(answer, false))])
        )
    }
}

function shuffle(array: any[]) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }