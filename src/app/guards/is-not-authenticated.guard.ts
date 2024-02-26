import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';

export const isNotAuthenticated = (): Observable<boolean> | boolean => {
  const auth = inject(Auth);


  if (!auth?.currentUser) {
    return true;
  }


  return false;
}
