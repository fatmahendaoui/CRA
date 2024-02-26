import { HttpClient } from '@angular/common/http';
import {
  TRANSLOCO_LOADER,
  Translation,
  TranslocoLoader,
  TRANSLOCO_CONFIG,
  translocoConfig
} from '@ngneat/transloco';
import { inject, Injectable, isDevMode } from '@angular/core';

export const availableLangs = ['en', 'fr'];

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}

export const provideTransloco = () => [
  {
    provide: TRANSLOCO_CONFIG,
    useValue: translocoConfig({
      availableLangs,
      defaultLang: localStorage.getItem('current_language') ?? 'en',
      reRenderOnLangChange: true,
      prodMode: !isDevMode(),
    })
  },
  { provide: TRANSLOCO_LOADER, useClass: TranslocoHttpLoader }
];