import { Injectable, inject } from '@angular/core';
import { Observable, catchError, from, map } from 'rxjs';
import { ProfileService } from '../../../services/profile.service';
import { Profile } from 'src/app/models/profile.model';

import {
  DocumentData,
  collection,
  deleteDoc,
  getDocs,
  updateDoc,
  where,
  setDoc, doc, query, QuerySnapshot, CollectionReference, getDoc
} from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';

import { Auth, UserCredential, createUserWithEmailAndPassword, sendEmailVerification } from '@angular/fire/auth';
import { environment } from 'src/environments/environment';
import { ProjectService } from '../../projects/services/projects.service';
import { deleteApp, initializeApp } from '@angular/fire/app';
import { getAuth } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
@Injectable()
export class UsersService {
  private readonly profileService = inject(ProfileService);
  private readonly firestore = inject(Firestore);
  private readonly projectService = inject(ProjectService);

  authApp = initializeApp(
    environment.firebaseConfig
    , 'authApp');
  vardetachedAuth = getAuth(this.authApp);
  usersCollection: string;

  public fetchAllUsers(): Observable<any[]> {
    return from(
      getDocs(
        query(
          collection(this.firestore, 'membership_CRA'),
          where('idDomaine', '==', this.profileService.profile.idDomaine)
        )
      )
    ).pipe(
      map((querySnapshot: QuerySnapshot<DocumentData>) => {
        const users: Profile[] = [];
        querySnapshot.forEach((doc) => {
          users.push(doc.data() as Profile); // Type assertion here
        });
        return users;
      }),
      catchError((error) => {
        console.error(error);
        throw error;
      })
    );
  }
  private readonly http = inject(HttpClient);
  async  getAllUsersForProject(newproject: string, iduser: string): Promise<boolean>  {
    if (newproject.trim() === "") {
    console.log('champ vide');
    return false;
  }

  const projectData = {
    'name': newproject,
    'projectTotal': 0,
  };

  const domaineRef = collection(
    this.firestore,
    'membership_CRA',
    iduser,
    'Projects'
  ) as CollectionReference<DocumentData>;

  // Check if the project exists before adding it to Firestore.
  const projectDocRef = doc(domaineRef, newproject);
  const projectDoc = await getDoc(projectDocRef);

  if (projectDoc.exists()) {
    console.log('Project already exists:', newproject);
    return true;
  }
  return false;
}
  // Function to update the user role in Firestore
  updateUserRole(userId: string, updatedUser: Profile): Observable<void> {
    // Assuming the 'membership_CRA' collection contains documents with document IDs equal to the user IDs
    const usersCollection = collection(this.firestore, 'membership_CRA');
    const userDocRef = doc(usersCollection, userId);

    // Create an object with the updated user data (only including the 'role' property in this example)
    const userUpdate = {
      role: updatedUser.role,
    };

    // Perform the update using the updateDoc function and convert the Promise to an Observable
    return from(updateDoc(userDocRef, userUpdate));
  }

  // Function to delete a user from Firestore
  deleteUser(userId: string): Observable<void> {
    // Assuming the 'membership_CRA' collection contains documents with document IDs equal to the user IDs
    const usersCollection = collection(this.firestore, 'membership_CRA');
    const userDocRef = doc(usersCollection, userId);

    // Perform the deletion using the deleteDoc function and convert the Promise to an Observable
    return from(deleteDoc(userDocRef));
  }

  async sendInvitation(user: any): Promise<void> {
    try {
      const password = 'valid-password'; // Replace with a valid password

      // Create a new user without signing them in
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.vardetachedAuth,
        user.email,
        password
      );

      // Get the new user's record
      const userRecord = userCredential.user;

      // Store the user's information in the 'membership_CRA' collection
      const emailParts = user.email.split('@');
      const nameFromEmail = emailParts[0];

      await setDoc(doc(this.firestore, 'membership_CRA', userRecord.uid), {
        role: user.role,
        created_on: new Date().toISOString().substring(0, 10) + 'T00:00:00.000Z',
        idDomaine: this.profileService.profile.idDomaine,
        uid: userRecord.uid,
        photoURL: userRecord.photoURL || '',
        displayName: userRecord.displayName || nameFromEmail,
        email: user.email || '',
      });
      this.projectService.addNewProject("Disponible","Disponible", userRecord.uid);
      this.projectService.addNewProject("Vacances","Vacances", userRecord.uid);
      this.projectService.addNewProject("Maladie","Maladie", userRecord.uid);
      
      // Send email verification to the newly registered user
      await this.http.post("https://us-central1-prodvalbridge.cloudfunctions.net/add_user_cra", {
        displayname: userRecord.displayName || nameFromEmail,
        email: user.email,
      }).subscribe(res => {
        console.log(res);
      })

      // At this point, a new user has been invited, their information is stored, and email verification has been sent.
      // The authentication state of the current user remains unchanged.
    } catch (error: any) {
      // Handle errors
      console.error('Error inviting user:', error);
      // Reject the promise with the error object, including the code
      throw error;
    } finally {
      // Clean up resources
      if (this.authApp) {
        await deleteApp(this.authApp); // Delete the Firebase app
      }
    }
  }
}
