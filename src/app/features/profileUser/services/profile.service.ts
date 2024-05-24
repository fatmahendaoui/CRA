import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class ProfilService {
  private readonly firestore: Firestore;

  constructor(firestore: Firestore) {
    this.firestore = firestore;
  }

  async getUserProfile(id: string): Promise<{
    displayName: string,
    email: string,
    poste: string,
    dateOfBirth: string,
    dateEmbauche: Date | null,
    contratType: string | null,
    phoneNumber: string | null
  } | null> {
    try {
      console.log('Fetching user profile for ID:', id);
      const docRef = doc(this.firestore, 'membership_CRA', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Convertir le champ dateEmbauche s'il est présent
        let dateEmbauche: Date | null = null;
        if (data['dateEmbauche'] instanceof Timestamp) {
          dateEmbauche = data['dateEmbauche'].toDate();
        }

        console.log('User profile data:', data);
        return {
          displayName: data['displayName'],
          email: data['email'],
          dateEmbauche: dateEmbauche,
          contratType: data['contratType'],
          phoneNumber: data['phoneNumber'],
          poste: data['poste'],
          dateOfBirth: data['dateOfBirth'],
        };
      } else {
        console.log("No such document!");
        return null;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async updateUserProfile(id: string, data: any): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'membership_CRA', id);
      await setDoc(docRef, data, { merge: true });
      console.log('Document successfully written!');
    } catch (error) {
      console.error('Error writing document:', error);
      throw error;
    }
  }
}
