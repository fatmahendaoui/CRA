import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { NgZone, OnDestroy, OnInit } from "@angular/core";
import { format } from 'date-fns';


export const Authentification = (): Promise<boolean> => {
  const auth = inject(Auth);
  const router = inject(Router);
  const ngZone = inject(NgZone);
  const today: string = format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX");


  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe(); // Unsubscribe from the listener after the first invocation

      if (user) {
        const pathname = window.location.pathname;
        if (pathname == '/sign-in') {
          router.navigateByUrl(`/timesheet/${auth.currentUser?.uid}/${encodeURIComponent(today)}`);

        } else {
          if (pathname.length < 2) {
            router.navigateByUrl(`/timesheet/${auth.currentUser?.uid}/${encodeURIComponent(today)}`);
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
