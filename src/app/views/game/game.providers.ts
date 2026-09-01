import { Provider } from "@angular/core";
import { GameService } from "./api/game.service";
import { GameServiceMock } from "./infrastructure/game.service-mock";

export const gameProviders: Provider[] = [{ provide: GameService, useClass: GameServiceMock }];