import './styles.css';
import { brandDocumentTitle } from './config/brand';
import { createKaneGame } from './game/init';
import { applyDocumentLanguage } from './i18n';

const parent = document.getElementById('app');
if (!parent) {
  throw new Error('#app root missing');
}

document.title = brandDocumentTitle();
applyDocumentLanguage();
createKaneGame(parent);
