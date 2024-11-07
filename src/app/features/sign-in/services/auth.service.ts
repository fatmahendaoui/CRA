import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Profile, UserRole } from 'src/app/models/profile.model';
import { ProfileService } from 'src/app/services/profile.service';
import { v4 as uuidv4 } from 'uuid';
import { createUserWithEmailAndPassword, signInWithPopup, OAuthProvider, signInWithEmailAndPassword, UserCredential } from '@angular/fire/auth';
import { CollectionReference, DocumentData, Firestore, QuerySnapshot, collection, doc, getDoc, getDocs, setDoc, query, where, updateDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);
  private readonly firestore = inject(Firestore);
  public async CheckUserExist(uid: string): Promise<boolean> {
    const queryResult = await this.profileService.checkAdmin(uid);
    const isAdmin = queryResult.docs.length > 0;

    if (isAdmin) {
      //this.router.navigate(['/dashbord']);
      this.router.navigate(['/timesheet/' + this.auth.currentUser?.uid + '/' + new Date()]);

      return true;
    } else {
      this.router.navigate(['/create-domaine']);
      return false;
    }
  }

  async createDomaine(domaineName: string): Promise<{ profile: Profile | null; exists: boolean }> {
    try {
      const user = this.auth.currentUser!;
      const createdOn = new Date().toISOString().substring(0, 10) + 'T00:00:00.000Z';
      const domaineId = uuidv4();

      const domaineQuery: QuerySnapshot<DocumentData> = await getDocs(
        query(collection(this.firestore, 'domaine_CRA') as CollectionReference<DocumentData>, where('domaineName', '==', domaineName))
      );

      if (!domaineQuery.empty) {
        return { profile: null, exists: true };
      }

      await setDoc(doc(this.firestore, 'domaine_CRA', domaineId), {
        domaineId,
        user_id: user.uid,
        domaineName,
        status: false,
      });

      const profile: Profile = {
        role: UserRole.Admin,
        created_on: createdOn,
        idDomaine: domaineId,
        uid: user.uid,
        last_connected: user.metadata.lastSignInTime ?? '',
        photoURL: user.photoURL ?? '',
        displayName: user.displayName ?? '',
        email: user.email ?? '',
        notify: false
      };

      await setDoc(doc(this.firestore, 'membership_CRA', user.uid), profile);

      await this.addNewProject("Disponible", user.uid);
      await this.addNewProject("Vacances", user.uid);
      await this.addNewProject("Maladie", user.uid);
      this.router.navigate(['/timesheet/' + this.auth.currentUser?.uid + '/' + new Date()]);

      // this.router.navigate(['/dashbord']);

      return { profile, exists: false };
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  async addNewProject(newproject: string, iduser: string): Promise<void> {
    if (newproject.trim() === "") {
      return;
    }

    const projectData = {
      'name': newproject,
      'projectTotal': 0,
    };
    const domaineRef =
      collection(
        this.firestore,
        'membership_CRA',
        iduser, 'Projects'
      ) as CollectionReference<DocumentData>

    try {
      await setDoc(doc(domaineRef, newproject), projectData);
    } catch (error) {
      console.error('Error adding project to Firestore:', error);
    }
  }

  async getDomainName(domaineId: string): Promise<string | null> {
    try {
      const docRef = doc(this.firestore, 'domaine_CRA', domaineId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return data['domaineName'];
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting domain name:', error);
      throw error;
    }
  }

  getCurrentUserId(): string | null {
    const user = this.auth.currentUser;
    return user ? user.uid : null;
  }

  async signUpWithEmail(email: string, password: string): Promise<void> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      console.log('User signed up:', user);

      const domaineName = "Nom par défaut";
      const { profile, exists } = await this.createDomaine(domaineName);

      if (exists) {
        //this.router.navigate(['/dashbord']);
        this.router.navigate(['/timesheet/' + this.auth.currentUser?.uid + '/' + new Date()]);

      } else {
        this.router.navigate(['create-domaine']);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async loginWithEmail(email: string, password: string): Promise<void> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      console.log('User logged in:', user);

      const exists = await this.CheckUserExist(user.uid);
      if (exists) {

        this.router.navigate(['/timesheet/' + this.auth.currentUser?.uid + '/' + new Date()]);

        //this.router.navigate(['/dashbord']);
      } else {
        this.router.navigate(['create-domaine']);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }
  async loginWithMicrosoft(): Promise<void> {
    try {
      const provider = new OAuthProvider('microsoft.com');
      const userCredential = await signInWithPopup(this.auth, provider);
      const user = userCredential.user;
      console.log('User logged in with Microsoft:', user);

      const exists = await this.CheckUserExist(user.uid);
      if(user.email?.endsWith('@ealan-agency.com')){
        if (exists) { 
          this.router.navigate(['/timesheet/' + this.auth.currentUser?.uid + '/' + new Date()]);
        } else {
         this.createUser(user)
  this.router.navigate(['/timesheet/' + this.auth.currentUser?.uid + '/' + new Date()]);
}
      }else{
        if (exists) { 
          this.router.navigate(['/timesheet/' + this.auth.currentUser?.uid + '/' + new Date()]);
        } else {
  
          this.router.navigate(['create-domaine']);
        }
      }
    } catch (error) {
      console.error('Error logging in with Microsoft:', error);
      throw error;
    }
  }
  //creation user automatique 
async createUser(user){
  const emailParts = user.email.split('@');
  const nameFromEmail = emailParts[0];
  const userData: any = {
    role: 'user',
    created_on: new Date().toISOString().substring(0, 10) + 'T00:00:00.000Z',
    idDomaine: "4a32e48b-1798-4e87-90a3-35038ab33ba6",  
   uid: user.uid,
    photoURL: user.photoURL || '',
    displayName: user.displayName || nameFromEmail,
    email: user.email || '',
    dateEmbauche: user.dateEmbauche|| '',
    contractType: user.contractType|| '',
};

await setDoc(doc(this.firestore, 'membership_CRA', user.uid), userData);

this.addNewProject("Disponible",  user.uid, );
this.addNewProject("Vacances", user.uid);
this.addNewProject("Maladie", user.uid);

}
/*
async addNewProject(idproject: string, newprojects: string, iduser: string, managerId: string, users: string[]): Promise<void> {
  const usersList: Profile[] = [];
  if (idproject.trim() === "") {
    console.log('champ vide');
    return;
  }
  console.log('userssssssssss:', users);
  const usersWithManager = [...users, managerId];

  const projectData = {
    'name': newprojects,
    'projectTotal': 0,
    managerId: managerId, // Store the manager's user ID
    users: usersWithManager // Add the users' IDs to the project data
  };
  console.log('Project data: testtetetettetette', projectData);
  /*
  const domaineRef =
    collection(
      this.firestore,
      'membership_CRA',
      iduser, 'Projects'
    ) as CollectionReference<DocumentData>
*//*
  const projectDocRef = doc(this.firestore, 'membership_CRA', iduser, 'Projects', newprojects);

  // Update the manager's role to 'manager'
  const querySnapshot = await getDocs(
    query(
      collection(this.firestore, 'membership_CRA'),
      where('idDomaine', '==', this.profileService.profile.idDomaine)
    )
  );

  querySnapshot.forEach((doc) => {
    usersList.push(doc.data() as Profile);
  });
  for await (const user of usersList) {
    console.log('User 111111111', user);
    console.log('Manager ID 111111111 ', managerId);
    if (user.uid === managerId) {
      console.log('Manager found:', user);
      this.updateUserRoleManager(user.uid, UserRole.Manager, projectData.users);
      //user.role = UserRole.Manager;
    }
  }
  try {
    // Update the manager's role to 'manager'

    /* await setDoc(doc(domaineRef, idproject), projectData);
     console.log('Project added to Firestore:', idproject);*/
    // Si l'utilisateur est également le manager, mettre à jour son rôle
    /*return setDoc(projectDocRef, projectData);


  } catch (error) {
    console.error('Error adding project to Firestore:', error);
  }
}
updateUserRoleManager(userId: string, role, users: string[]): Observable<void> {
  // Assuming the 'membership_CRA' collection contains documents with document IDs equal to the user IDs
  const usersCollection = collection(this.firestore, 'membership_CRA');
  const userDocRef = doc(usersCollection, userId);
  // Create an object with the updated user data (only including the 'role' property in this example)
  const userUpdate = {
    role: role,
    notify: true,
  };
  // Perform the update using the updateDoc function and convert the Promise to an Observable
  return from(updateDoc(userDocRef, userUpdate));
}*/
}
