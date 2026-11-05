import { BRAND } from './config/brand';
import { createKaneGame } from './game/init';

const parent = document.getElementById('app');
if (!parent) {
  throw new Error('#app root missing');
}

document.title = BRAND.name;
createKaneGame(parent);
