import { Routes } from '@angular/router';
import { HomeComponent } from './views/home/home.component';
import { GameComponent } from './views/game/ui/game.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'game', component: GameComponent },
];
