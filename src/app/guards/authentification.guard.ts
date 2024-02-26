import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { NgZone, OnDestroy, OnInit } from "@angular/core";


export const Authentification = (): Promise<boolean> => {
  const auth = inject(Auth);
  const router = inject(Router);
  const ngZone = inject(NgZone);

  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe(); // Unsubscribe from the listener after the first invocation

      if (user) {
        const pathname = window.location.pathname;
        if (pathname == '/sign-in') {
          router.navigateByUrl('/dashbord');

        } else {
          if (pathname.length < 2) {
            router.navigateByUrl('/dashbord');
          } else {
            router.navigateByUrl(pathname, {
              onSameUrlNavigation: 'reload',
              replaceUrl: true,
            });
          }
        }


        resolve(false);
      } else {
        resolve(true);
      }
    });
  });

};
