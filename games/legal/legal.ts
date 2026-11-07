import { applyDocumentLanguage, t } from '../../src/i18n';
import { legalChrome, privacyCopy, termsCopy } from './legalCopy';

function setText(id: string, value: string): void {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function setPoints(points: string[]): void {
  const list = document.getElementById('legal-points');
  if (!list) return;
  const items = [...list.querySelectorAll('li')];
  for (let index = 0; index < points.length; index += 1) {
    const item = items[index];
    const text = points[index];
    if (item && text) item.textContent = text;
  }
}

applyDocumentLanguage();
const chrome = legalChrome();
setText('hub-back', chrome.games);
setText('legal-play', chrome.play);
setText('legal-privacy', chrome.privacy);

if (document.body.dataset.page === 'terms') {
  const copy = termsCopy();
  document.title = `KANE · ${t('menu.terms')}`;
  document.getElementById('terms-meta')?.setAttribute('content', copy.meta);
  setText('legal-title', copy.title);
  setText('legal-note', copy.note);
  setPoints(copy.points);
} else {
  const copy = privacyCopy();
  document.title = `KANE · ${t('menu.privacy')}`;
  document.getElementById('privacy-meta')?.setAttribute('content', copy.meta);
  setText('legal-title', copy.title);
  setText('legal-note', copy.note);
  setText('legal-body', copy.body);
  setPoints(copy.points);
}
