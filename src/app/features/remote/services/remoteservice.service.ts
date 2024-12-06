import { inject, Injectable } from '@angular/core';
import { getFirestore, collection, getDocs, query, where, setDoc, doc, getDoc } from 'firebase/firestore';
import { ProfileService } from 'src/app/services/profile.service';

@Injectable({
  providedIn: 'root'
})
export class RemoteService {
  private firestore;
  private readonly profileService = inject(ProfileService);
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
      const docRef = doc(this.firestore, 'remote', storageKey);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error('Error writing document: ', error);
      throw error;
    }
  }
  async loadFromFirebase(storageKey: string): Promise<any> {
    try {
      const docRef = doc(this.firestore, 'remote', storageKey);
      const docSnapshot = await getDoc(docRef);
      if (docSnapshot.exists()) {
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
}
