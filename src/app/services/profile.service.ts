import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  where,
  query,
  getDocs,
  doc,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Profile } from '../models/profile.model';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  public profile: Profile;
  public async fetchProfile(user): Promise<Profile> {
    const queryResult = await this.checkAdmin(user?.uid);
    const userData = await this.getUser(user);

    // Check if no documents were found in 'membership_BQDS' collection and no user document was found in 'users' subcollection
    if (queryResult!.docs.length === 0 && !userData?.data()) {
      // If no documents found, navigate to the sign-in page
      this.router.navigate(['/sign-in']);
    } else if (queryResult!.docs.length > 0) {
      // Use the user document from 'membership_BQDS' collection as the profile
      this.profile = queryResult.docs[0].data() as Profile;
    } else {
      // Use the user document from 'users' subcollection as the profile
      this.profile = userData?.data() as Profile;
    }

    return this.profile;
  }

  public async checkDomain() {
    // Extract the domain name from the current user's email
    const domaineName = this.auth
      .currentUser!.email?.substring(
        this.auth.currentUser!.email.indexOf('@') + 1
      )
      .split('.')[0];

    // Query the 'domaine_BQDS' collection to get documents where 'domaineName' matches the extracted domain name
    const qr = await getDocs(
      query(
        collection(this.firestore, 'domaine_CRA'),
        where('domaineName', '==', domaineName)
      )
    );
    return qr;
  }

  public async checkUserSubCollection(uid) {
    const qr = await this.checkDomain();
      if(qr.docs.length > 0){
          // Get the first matching domain document
    const domaineDoc = qr.docs[0];
    const domainRef = doc(this.firestore, 'domaine_CRA', domaineDoc.id);

    // Query the 'users' subcollection to check if the user exists
    const subcollectionSnapshot = await getDocs(collection(domainRef, 'users'));

    const userDocs = subcollectionSnapshot.docs;

    // Check if any documents were found in the subcollection 'users' where 'id' matches the given 'uid'
    const userExists = userDocs.some((userDoc) => userDoc.data()['id'] === uid);
    return userExists;
      }else{
        return false ;
      }
  }

  public async checkAdmin(uid) {
    // Query the 'membership_BQDS' collection to get documents where 'uid' matches the given 'uid'
    const queryResult = await getDocs(
      query(collection(this.firestore, 'membership_CRA'), where('uid', '==', uid))
    );
    return queryResult;
  }

  public async getUser(user) {
    const qr = await this.checkDomain();
   if(qr.docs.length > 0){
     // Get the first matching domain document
     const domaineDoc = qr.docs[0];

     // Create a reference to the 'users' subcollection within the domain document
     const domainRef = doc(this.firestore, 'domaine_CRA', domaineDoc.id);
     const subcollectionSnapshot = await getDocs(collection(domainRef, 'users'));
     const userDocs = subcollectionSnapshot.docs;

     // Find the user document that matches the user's UID
     const userData = userDocs.find(
       (userDoc) => userDoc.data()['id'] === user?.uid
     );
     return userData;
   }
  }

  async getUserRole(){
    const queryResult = await getDocs(
      query(collection(this.firestore, 'membership_CRA'), where('uid', '==', this.auth.currentUser?.uid))
    );

    // Extract the role from the first document in the query result
    const currentUser = queryResult.docs[0].data();

    return currentUser['role'];
  }
}
