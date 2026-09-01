import { Component, inject } from '@angular/core';
import { GameQuestion } from '../api/game-question';
import { GameAnswer } from '../api/game-answer';
import { GameServiceMock } from '../infrastructure/game.service-mock';
import { GameService } from '../api/game.service';
import { gameProviders } from '../game.providers';

@Component({
  selector: 'app-game',
  imports: [],
  providers: [...gameProviders],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent {
  private gameService = inject(GameService);

  constructor() {
  }

  public question = this.gameService.getQuestion();
}
