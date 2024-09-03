import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Profile, UserRole } from 'src/app/models/profile.model';
import { ProfileService } from 'src/app/services/profile.service';
import { v4 as uuidv4 } from 'uuid';
import { createUserWithEmailAndPassword, signInWithPopup, OAuthProvider, signInWithEmailAndPassword, UserCredential } from '@angular/fire/auth';
import { CollectionReference, DocumentData, Firestore, QuerySnapshot, collection, doc, getDoc, getDocs, setDoc, query, where } from '@angular/fire/firestore';

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
      if (exists) {
        this.router.navigate(['/timesheet/' + this.auth.currentUser?.uid + '/' + new Date()]);
        //this.router.navigate(['/dashbord']);
      } else {
        this.router.navigate(['create-domaine']);
      }
    } catch (error) {
      console.error('Error logging in with Microsoft:', error);
      throw error;
    }
  }
}
