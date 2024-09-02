import { Injectable, inject } from '@angular/core';
import { Observable, catchError, from, map } from 'rxjs';
import { ProfileService } from '../../../services/profile.service';
import { Profile, UserRole } from 'src/app/models/profile.model';

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
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { id } from 'date-fns/locale';
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
  async getAllUsersForProject(newproject: string, iduser: string): Promise<boolean> {
    if (newproject.trim() === "") {
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
      notify: false // Ajouter cette ligne pour initialiser la propriété notify
    };
    // If the updated role is 'user', remove the 'notify' field from the user's data
    if (updatedUser.role === 'user') {
      userUpdate.notify = false;
    }
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

  async sendInvitation(user: any, managerId: string): Promise<void> {
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

      const userData: any = {
        role: user.role,
        created_on: new Date().toISOString().substring(0, 10) + 'T00:00:00.000Z',
        idDomaine: this.profileService.profile.idDomaine,
        uid: userRecord.uid,
        photoURL: userRecord.photoURL || '',
        displayName: userRecord.displayName || nameFromEmail,
        email: user.email || '',
        dateEmbauche: user.dateEmbauche,
        contractType: user.contractType
      };

      if (this.profileService.profile.role === UserRole.Admin) {
        userData.notify = true;
      }

      await setDoc(doc(this.firestore, 'membership_CRA', userRecord.uid), userData);

      this.projectService.addNewProject("Disponible", "Disponible", userRecord.uid, managerId, []);
      this.projectService.addNewProject("Vacances", "Vacances", userRecord.uid, managerId, []);
      this.projectService.addNewProject("Maladie", "Maladie", userRecord.uid, managerId, []);

      // Send email verification to the newly registered user
      await this.http.post<void>("https://us-central1-dev-cra-390314.cloudfunctions.net/add_user_cra", {
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
      /* if (this.authApp) {
         await deleteApp(this.authApp); // Delete the Firebase app
       }*/
    }
  }

  // Fonction pour gérer le changement d'état de la switch
  async onToggleAdmin(element: Profile, event: MatSlideToggleChange): Promise<void> {
    try {
      // Récupérer le uid de l'utilisateur
      const userId = element.uid;

      // Vérifier si l'utilisateur est un administrateur
      if (element.role === 'admin') {
        // Mettre à jour la valeur de notify en fonction de l'état du MatSlideToggle
        const userDocRef = doc(this.firestore, 'membership_CRA', userId);
        const newData = { notify: event.checked };

        // Effectuer la mise à jour dans Firestore
        await updateDoc(userDocRef, newData);
      } else {
        // Si l'utilisateur n'est pas un administrateur, ne rien faire
        console.warn('User is not an admin');
      }
    } catch (error) {
      // Gérer les erreurs
      console.error('Error updating notify:', error);
      throw error;
    }
  }
  // Function to get the managed users' emails
  /* async groupUserManager(iduser: string): Promise<void> {
     console.log('iduser ::::', iduser);
 
     // Get the user by ID
     const user = await this.projectService.getuserbyid(iduser);
     console.log('projectRef ::::', user);
 
     // Step 1: Get all users in the "membership_CRA" collection
     const querySnapshot = await getDocs(query(collection(this.firestore, 'membership_CRA')));
 
     // Step 2: Iterate over each user
     const projectsSnapshot = await getDocs(
       collection(this.firestore, 'membership_CRA', iduser, 'Projects')
     );
 
     // Use a for...of loop to handle async/await
     for (const projectDoc of projectsSnapshot.docs) {
       const projectData = projectDoc.data();
       const managerId = projectData?.['managerId'];
       console.log('Manager ID:', managerId); // Log the manager ID
       console.log('Project Data for User:', user.uid, projectData); // Log each project data
 
       const users = projectData['users'];
       console.log('users', users);
 
       const emails: string[] = [];
 
       // Iterate over the user IDs and fetch their data
       for (const userId of users) {
         const user = await this.projectService.getuserbyid(userId);
         console.log('userbyid', user);
         const email = user.email;
         console.log('email 0', email);
         emails.push(email);
       }
 
       // You can now use the list of emails or return it
       console.log('Emails of managed users:', emails);
       return emails;
     }
   }
 */
  /*
    async groupUserManager(iduser: string): Promise<string[]> {
      console.log('iduser ::::', iduser);
  
      // Get the user by ID
      const user = await this.projectService.getuserbyid(iduser);
      console.log('projectRef ::::', user);
  
      // Step 1: Get all users in the "membership_CRA" collection
      const querySnapshot = await getDocs(query(collection(this.firestore, 'membership_CRA')));
  
      // Step 2: Iterate over each user
      const projectsSnapshot = await getDocs(
        collection(this.firestore, 'membership_CRA', iduser, 'Projects')
      );
  
      const emails: string[] = []; // Initialize the array to hold emails
  
      // Use a for...of loop to handle async/await
      for (const projectDoc of projectsSnapshot.docs) {
        const projectData = projectDoc.data();
        const managerId = projectData?.['managerId'];
        console.log('Manager ID:', managerId); // Log the manager ID
        console.log('Project Data for User:', user.uid, projectData); // Log each project data
  
        const users = projectData['users'];
        console.log('users', users);
  
        // Iterate over the user IDs and fetch their data
        for (const userId of users) {
          const user = await this.projectService.getuserbyid(userId);
          console.log('userbyid', user);
          const email = user.email;
          console.log('email 0', email);
          emails.push(email);
        }
      }
  
      // Return the list of emails
      console.log('Emails of managed users:', emails);
      return emails;
    }
  */
  /*
   async groupUserManager(iduser: string): Promise<string[]> {
     try {
       // console.log('iduser ::::', iduser);
 
       // Get the user by ID
      // const user = await this.projectService.getuserbyid(iduser);
       // console.log('projectRef ::::', user);
 
       // Step 1: Get all users in the "membership_CRA" collection
       //const querySnapshot = await getDocs(query(collection(this.firestore, 'membership_CRA')));
       //console.log('querySnapshot', querySnapshot)
 
       // Step 1: Get all projects for the user
       const projectsSnapshot = await getDocs(
         collection(this.firestore, 'membership_CRA', iduser, 'Projects')
       );
 
       const emails: string[] = []; // Initialize the array to hold emails
 
       // Use a for...of loop to handle async/await
       for (const projectDoc of projectsSnapshot.docs) {
         const projectData = projectDoc.data();
         const users: string[] = projectData['users'] || []; // Ensure users is an array
 
         console.log('Project Data for User:', iduser, projectData);
         console.log('Users:', users);
 
         // Retrieve user emails for each user ID
         for (const userId of users) {
           try {
             const user = await this.projectService.getuserbyid(userId);
             if (user && user.email) {
               console.log('User Email:', user.email);
               emails.push(user.email);
             } else {
               console.warn('No email found for user ID:', userId);
             }
           } catch (error) {
             console.error('Error fetching user by ID:', userId, error);
           }
         }
       }
 
       // Remove duplicate emails if needed
       const uniqueEmails = Array.from(new Set(emails));
 
       console.log('Unique Emails of managed users:', uniqueEmails);
       return uniqueEmails;
     } catch (error) {
       console.error('Error in groupUserManager:', error);
       throw error; // Re-throw the error to handle it in the calling method
     }
   }
 */
  async groupUserManager(iduser: string): Promise<string[]> {
    try {
      console.log('iduser ::::', iduser);

      // Get the user's projects
      const projectsSnapshot = await getDocs(
        collection(this.firestore, 'membership_CRA', iduser, 'Projects')
      );

      // Extract user IDs from projects
      const userIds: string[] = [];
      projectsSnapshot.forEach(projectDoc => {
        const projectData = projectDoc.data();
        const users: string[] = projectData['users'] || [];
        userIds.push(...users);
      });

      // Remove duplicate user IDs
      const uniqueUserIds = Array.from(new Set(userIds));

      // Fetch user profiles in parallel
      const userPromises = uniqueUserIds.map(userId =>
        this.projectService.getuserbyid(userId).then(user => user?.email || '')
      );
      const emails = await Promise.all(userPromises);

      // Remove duplicate emails and filter out empty strings
      const uniqueEmails = Array.from(new Set(emails.filter(email => email !== '')));

      console.log('Unique Emails of managed users:', uniqueEmails);
      return uniqueEmails;
    } catch (error) {
      console.error('Error in groupUserManager:', error);
      throw error;
    }
  }
  public groupUserManagerObserv(iduser: string): Observable<string[]> {
    return from(this.groupUserManager(iduser));
  }

}


