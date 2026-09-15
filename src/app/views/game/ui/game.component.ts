import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { GameService } from '../api/game.service';
import { gameProviders } from '../game.providers';
import { GameQuestion } from '../api/game-question';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-game',
  imports: [],
  providers: [...gameProviders],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent implements OnInit {
  private gameService = inject(GameService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  // public question = this.gameService.getQuestion();
  public question!: GameQuestion;
  public question$ = this.gameService.selectQuestion();

  ngOnInit(): void {
    this.question$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(question => {
        console.log(question);
        this.question = question;
        this.changeDetectorRef.detectChanges();
      })
  }
}
