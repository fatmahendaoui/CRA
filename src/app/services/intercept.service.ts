import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap } from 'rxjs/operators';
import { from, Observable, throwError } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';

const authenticatedHeaders = (request: HttpRequest<any>, token: string | undefined): HttpRequest<any> => {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'X-Firebase-User-Token': token,
      'Content-Type': 'application/json',
    } as { [key: string]: string }
  });
}

export const bearerTokenInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(Auth);
  const router = inject(Router);

  return from(authService.currentUser?.getIdToken() || Promise.resolve(''))
    .pipe(
      switchMap((token) => {
        return next(authenticatedHeaders(req, token))
          .pipe(
            catchError((error) => {
              if (error.status === 401) {
                router.navigate(['/sign-in']);
              }

              return throwError(() => error);
            })
          )
      })
    );
}
