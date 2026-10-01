// The stage list. Pure data: the game, the tools and the JSON exporter read this.
import docks from './docks.js';
import skyway from './city-day.js';
import neon from './city-night.js';
import warehouse from './warehouse.js';
import { BONUS } from './bonus.js';

export const STAGES = [docks, skyway, neon, warehouse];
export { BONUS };
export const bonusFor = (stage) => BONUS[stage.id] || null;
