import { Provider } from "@angular/core";
import { GameService } from "./api/game.service";
import { GameServiceMock } from "./infrastructure/game.service-mock";
import { GameResource } from "./infrastructure/game.resurce";

export const gameProviders: Provider[] = [{ provide: GameService, useClass: GameResource }];