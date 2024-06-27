import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../features/sign-in/services/auth.service';
import { Firestore, collection, where, query, getDocs } from '@angular/fire/firestore';
import { Auth, User } from '@angular/fire/auth';
import { ProfileService } from '../services/profile.service';

export const TimesheetGuard = async (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> => {
  const authService = inject(AuthService);
  const firestore = inject(Firestore);
  const auth = inject(Auth);
  const router = inject(Router);
  const profileService = inject(ProfileService);

  const userId = authService.getCurrentUserId(); // Get current user's ID from the auth service
  const role = await extractRole(auth.currentUser, firestore, profileService);

  const urlUserId = next.params['uid']; // Get uid from the route parameters
  // console.log('CurrentUser', userId, 'UrlUser', urlUserId);

  const urlUserProfile = await fetchUserProfile(urlUserId, firestore);

  if (role === 'admin' || userId === urlUserId) {
    //console.log('Authorized', userId);
    return true; // The user can access the page
  } else {
    // Redirect to the timesheet page of the current user
    router.navigate(['/timesheet/' + userId + '/' + new Date()]);
    return false;
  }
}

const extractRole = async (user: User | null, firestore: Firestore, profileService: ProfileService): Promise<string | null> => {
  // Wait for the profile to be fetched
  await profileService.fetchProfile(user);

  // Now you can safely access profileService.profile
  const queryResult = await getDocs(
    query(collection(firestore, 'membership_CRA'),
      where('idDomaine', '==', profileService.profile.idDomaine), // Ensure profileService.profile is not undefined here
      where('uid', '==', user?.uid))
  );
  //console.log('idDomaine : ', profileService.profile.idDomaine);
  // Extract the role from the first document in the query result
  const currentUserRole = queryResult.docs.length > 0 ? queryResult.docs[0].data()['role'] : null;

  return currentUserRole;
};

const fetchUserProfile = async (uid: string, firestore: Firestore): Promise<any | null> => {
  const queryResult = await getDocs(
    query(collection(firestore, 'profiles'),
      where('uid', '==', uid))
  );

  return queryResult.docs.length > 0 ? queryResult.docs[0].data() : null;
};
