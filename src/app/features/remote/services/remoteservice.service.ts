import { CongeService } from 'src/app/features/conges/services/conge.service';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { getFirestore, collection, getDocs, query, where, setDoc, doc, getDoc } from 'firebase/firestore';
import { ProfileService } from 'src/app/services/profile.service';
import { Profile } from 'src/app/models/profile.model';

@Injectable({
  providedIn: 'root'
})
export class RemoteService {
  private firestore;
  private readonly profileService = inject(ProfileService);
    private readonly http = inject(HttpClient);    
    private readonly congeService = inject(CongeService);
  
  constructor() {
    this.firestore = getFirestore();
  }

  async getAllDisplayNames(): Promise<{ name: string, photoURL: string, id: string }[]> {
    try {
      const idDomaine = await this.profileService.getIdDomaine();
      const membershipCollectionRef = collection(this.firestore, 'membership_CRA');
      const q = query(membershipCollectionRef, where('idDomaine', '==', idDomaine));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return [];
      }

      const displayNames: { name: string, photoURL: string, id: string, role: string }[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const displayName = data['displayName'];
        const photoURL = data['photoURL'];
        const uid = data['uid'];
        const UserRole = data['role']
        displayNames.push({ name: displayName, photoURL: photoURL, id: uid, role: UserRole });
      });

      return displayNames;
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  async saveToFirebase(storageKey: string, data: any): Promise<void> {
    try {
      const idDomaine = await this.profileService.getIdDomaine();
      const keysaved=`${storageKey}_${idDomaine}`
     // console.log('Saving data to Firebase:', data);
      const docRef = doc(this.firestore, 'remote', keysaved);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error('Error writing document: ', error);
      throw error;
    }
  }
  async loadAllFromFirebase(storageKey: string): Promise<any> {
    try {
      const idDomaine = await this.profileService.getIdDomaine();
      const keysaved=`${storageKey}_${idDomaine}`
      const docRef = doc(this.firestore, 'remote', keysaved);
      const docSnapshot = await getDoc(docRef);
      if (docSnapshot.exists()) {
       // console.log('Document data:', docSnapshot.data());
        return docSnapshot.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error loading document from Firestore:', error);
      throw error;
    }
  }

  async getUserRole(): Promise<string> {
    const userRole = await this.profileService.getUserRole();
    return userRole;
  }
  async sendEmailRemoteExeption(data): Promise<void>  {

         const adminUsers: Profile[] = await this.congeService.getAdminUsers();
         console.log('adminUsers',adminUsers);
         for await (const adminUser of adminUsers) {
          const adminEmailData = {
            ...data,
            emailData: adminUser.email,
            AdminName: adminUser.displayName,
  
          };
          console.log('adminEmailData',adminEmailData);
          try {
            await this.http.post<void>(
              `https://us-central1-dev-cra-390314.cloudfunctions.net/sendRemotExeptionEmail`,
              adminEmailData
            ).toPromise();
          } catch (error) {
            console.error('Error sending email to admin:', error);
          } 
        }
  /*  try {
      await this.http.post<void>(
        `https://us-central1-dev-cra-390314.cloudfunctions.net/sendCongeNotificationEmail`,
        data
      ).toPromise();
    } catch (error) {
      console.error('Error sending email to admin:', error);
    }  */}
}
