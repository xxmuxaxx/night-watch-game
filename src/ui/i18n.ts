// Перевод для компонентов: язык берётся из настроек, при его смене компонент перерисовывается.
import { i18n, type I18n } from '@/i18n';
import { useSettings } from './settings';

export function useI18n(): I18n {
  const [settings] = useSettings();
  return i18n(settings.language);
}
