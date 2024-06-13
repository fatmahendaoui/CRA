import { Injectable } from '@angular/core';
import { getFirestore, collection, getDocs, QuerySnapshot, QueryDocumentSnapshot, query, where } from 'firebase/firestore';

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
      const querySnapshot: QuerySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('No documents found in collection.');
        return [];
      }

      const displayNames: { name: string, photoURL: string }[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        const displayName = data['displayName']; // Replace 'displayName' with the actual field you want to retrieve
        const photoURL = data['photoURL']; // Replace 'photoURL' with the actual field you want to retrieve
        displayNames.push({ name: displayName, photoURL: photoURL });
      });

      return displayNames;
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }
}
