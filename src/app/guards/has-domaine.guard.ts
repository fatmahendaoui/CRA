import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';

import { CollectionReference, DocumentData, Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';

export const HasDomaineGuard = async (): Promise<boolean> => {
  // Inject the Auth, Router, and Firestore dependencies
  const auth = inject(Auth);
  const router = inject(Router);
  const firestore = inject(Firestore);

  // Listen for changes in the authentication state
  auth.onAuthStateChanged(async (user) => {
    // Check if the user is logged in
    if (user) {
      // Create a reference to the Firestore collection
      const collectionRef: CollectionReference<DocumentData> = collection(
        firestore,
        'membership_CRA'
      );

      // Create a query to match the user's UID
      const queryRef = query(collectionRef, where('uid', '==', user.uid));

      // Retrieve the documents that match the query
      const querySnapshot = await getDocs(queryRef);

      // Get the data of the first document
      const firstDocument = querySnapshot.docs[0]?.data();

      // Check if the document exists and has an 'idDomaine' property
      if (firstDocument && firstDocument['idDomaine']) {
        // Redirect the user to the '/dashbord' route
        router.navigate(['/dashbord']);
        return true;
      } else {
        return false;
      }
    }
  });

  // Return true outside the auth.onAuthStateChanged callback
  return true;
};
