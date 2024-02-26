import { inject } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import {
  Firestore,
  collection,
  where,
  query,
  getDocs,
} from '@angular/fire/firestore';
import { UserRole } from '../models/profile.model';

export const extractRole = async (user: User | null): Promise<boolean> => {
  const firestore = inject(Firestore);
  const queryResult =  await getDocs(
    query(collection(firestore, 'membership_CRA'), where('uid', '==', user?.uid))
  );  
  // Extract the role from the first document in the query result
  const currentUser = queryResult.docs.length > 0 &&
  queryResult.docs[0].data()['role'] === 'admin';

  return currentUser;
};

// Checks if the current user is an admin
export const isAdmin = async (): Promise<boolean> => {
  // Injects the 'Auth' and 'Router' dependencies
  const auth = inject(Auth);
  const router = inject(Router);

  // If there is no authenticated user, navigates to the 'not-authorized' page and returns 'false'
  if (!auth.currentUser) {
    router.navigate(['/sign-in']);
    return false;
  }

  // Extract the role of the current user using the 'extractRole' function
  const role = await extractRole(auth.currentUser);

  // If the role is not 'UserRole.Admin', navigates to the 'not-authorized' page and returns 'false'
  if (!role) {
    router.navigate(['/timesheet/'+auth.currentUser.uid+'/'+new Date()]);
    return false;
  }

  // If the user is an admin, returns 'true'
  return true;
};
