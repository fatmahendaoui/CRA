import { enableProdMode, importProvidersFrom } from '@angular/core';
import { environment } from './environments/environment';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bearerTokenInterceptor } from './app/services/intercept.service';
import { provideTransloco } from './app/services/translation.service';
import { TranslocoModule } from '@ngneat/transloco';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideTransloco(),
    importProvidersFrom(TranslocoModule),
    // Firebase App provider
    importProvidersFrom(provideFirebaseApp(() => initializeApp(environment.firebaseConfig))),


    // Firebase Auth provider
    importProvidersFrom(provideAuth(() => getAuth())),
    // Firebase Firestore provider
    importProvidersFrom(provideFirestore(() => getFirestore())),
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        bearerTokenInterceptor,
      ]),
    ),
  ],
})
  .catch(err => console.error(err));
