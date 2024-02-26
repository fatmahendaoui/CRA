import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';

export const isAuthenticated = (): Observable<boolean> | boolean => {
  // Inject the Auth and Router services
  const auth = inject(Auth); // Your authentication service
  const router = inject(Router); // Angular Router service

  if (auth.currentUser) {
    // User is authenticated
    return true; // Return true to indicate that the user can access the current route
  }

  // User is not logged in, so redirect to the login page
  router.navigate(['/sign-in']);

  return false; // Return false to indicate that the user cannot access the current route
}
