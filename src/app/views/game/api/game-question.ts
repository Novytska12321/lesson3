import { GameAnswer } from "./game-answer";

export class GameQuestion {
    constructor(
        public id: number,
        public text: string,
        public answers: GameAnswer[]
    ) {}
}