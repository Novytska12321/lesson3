import { Component } from '@angular/core';
import { GameQuestion } from '../api/game-question';
import { GameAnswer } from '../api/game-answer';

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent {
  public question = new GameQuestion(
    1,
    'My first question from TS',
    [
      new GameAnswer(1, 'Answer 1', true),
      new GameAnswer(2, 'Answer 2', false),
    ]
  );
}
