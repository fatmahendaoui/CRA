import { Injectable } from '@angular/core';
import { getFirestore, collection, getDocs, query, where, setDoc, doc, getDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class RemoteService {
  private firestore;

  constructor() {
    this.firestore = getFirestore();
  }

  async getAllDisplayNames(): Promise<{ name: string, photoURL: string }[]> {
    try {
      const membershipCollectionRef = collection(this.firestore, 'membership_CRA');
      const q = query(membershipCollectionRef, where('idDomaine', '==', '110a6215-76c0-48c6-bf68-429e28a19fbc'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return [];
      }

      const displayNames: { name: string, photoURL: string }[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const displayName = data['displayName'];
        const photoURL = data['photoURL'];
        displayNames.push({ name: displayName, photoURL: photoURL });
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
}
