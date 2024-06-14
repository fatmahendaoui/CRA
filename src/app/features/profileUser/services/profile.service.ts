import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, getDocs, collection } from '@angular/fire/firestore';
import { Timestamp } from '@angular/fire/firestore';
import { format } from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class ProfilService {
  private readonly firestore: Firestore;
  private currentProfileId: string | null = null;

  constructor(firestore: Firestore) {
    this.firestore = firestore;
  }

  // Fonction pour convertir les heures en jours et heures
  public convertToDaysAndHours(hours: number): string {
    const days = Math.floor(hours / 8);
    const remainingHours = hours % 8;

    return `${days} jours et ${remainingHours} heures`;
  }

  // Fonction pour convertir une Timestamp en Date
  private convertToDate(timestamp: Timestamp | null): Date | null {
    if (!timestamp) {
      return null;
    }
    return timestamp.toDate();
  }

  async getUserProfile(id: string): Promise<{
    displayName: string,
    email: string,
    poste: string,
    dateOfBirth: Date | null,
    dateEmbauche: Date | null,
    contratType: string | null,
    phoneNumber: string | null,
    conge: string | null,
    maladie: string | null,
    photoURL: string | null,
    role: string | null,


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
          dateEmbauche = this.convertToDate(data['dateEmbauche']);
        }

        // Convertir le champ dateOfBirth s'il est présent
        let dateOfBirth: Date | null = null;
        if (data['dateOfBirth'] instanceof Timestamp) {
          dateOfBirth = this.convertToDate(data['dateOfBirth']);
        }

        console.log('User profile data:', data);

        // Convertir les champs conge et maladie en jours et heures
        const conge = data['conge'] ? this.convertToDaysAndHours(data['conge']) : null;
        const maladie = data['maladie'] ? this.convertToDaysAndHours(data['maladie']) : null;

        return {
          displayName: data['displayName'],
          email: data['email'],
          dateEmbauche: dateEmbauche,
          contratType: data['contratType'],
          phoneNumber: data['phoneNumber'],
          poste: data['poste'],
          dateOfBirth: dateOfBirth,
          conge: conge,
          maladie: maladie,
          photoURL: data['photoURL'] || null,
          role: data['role'], // Ensure photoURL is included
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

  async getProjects(id: string): Promise<string[]> {
    try {
      const docRef = doc(this.firestore, 'membership_CRA', id);
      const projectsCollectionRef = collection(docRef, 'Projects');
      const querySnapshot = await getDocs(projectsCollectionRef);

      if (querySnapshot.empty) {
        console.log('No projects found.');
        return [];
      }

      // Récupérer les IDs des documents
      const projectIds = querySnapshot.docs.map(doc => doc.id);
      //console.log('Project IDs:', projectIds); // Affichage des IDs des documents
      return projectIds;
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  }

  async getProjectDetails(userId: string, projectId: string): Promise<any> {
    try {
      const docRef = doc(this.firestore, 'membership_CRA', userId, 'Projects', projectId);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        console.log(`No details found for project ID: ${projectId}`);
        return null;
      }

      const projectData = docSnapshot.data();

      return projectData;
    } catch (error) {
      console.error(`Error getting details for project ID ${projectId}:`, error);
      throw error;
    }
  }

  ///////
  async getUserRole(id: string): Promise<string | null> {
    try {
      console.log('Fetching user role for ID:', id);
      const docRef = doc(this.firestore, 'membership_CRA', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const role = data['role']; // Récupérer la valeur du champ "role"
        console.log('User role:', role);
        return role;
      } else {
        console.log("No such document!");
        return null;
      }
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  // Méthode pour définir l'ID du profil ouvert
  setCurrentProfileId(profileId: string): void {
    this.currentProfileId = profileId;
  }

  // Méthode pour obtenir l'ID du profil ouvert
  getCurrentProfileId(): string | null {
    console.log('Current profile ID:', this.currentProfileId);

    return this.currentProfileId;
  }
  ////
  calculateTotalHours(projectData: any): number {
    let totalHours = 0;

    for (const month in projectData) {
      if (projectData.hasOwnProperty(month)) {
        const days = projectData[month];
        days.forEach((day: any) => {
          const hours = Number(day.nbHeure);
          if (!isNaN(hours)) {
            totalHours += hours;
          }
        });
      }
    }

    return totalHours;
  }

}
