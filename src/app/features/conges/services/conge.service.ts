import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { environment } from 'src/environments/environment';
import { getAuth, User } from 'firebase/auth';
import { DocumentSnapshot, DocumentData } from 'firebase/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { serverTimestamp, updateDoc,Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class CongeService {
  getConges() {
    throw new Error('Method not implemented.');
  }
  private firestore;
  private currentUser: User | null;
  private authInitialized: boolean = false;

  constructor() {
    const app = initializeApp(environment.firebaseConfig);
    this.firestore = getFirestore(app);
    this.currentUser = null;
    this.initializeAuthListener();
  }

  private initializeAuthListener(): void {
    const auth = getAuth();
    auth.onAuthStateChanged(user => {
      this.currentUser = user;
      this.authInitialized = true; // Indique que l'initialisation est terminée
    });
  }

  async addConge(conge): Promise<string | undefined> {
    try {
      // Ajout des champs year, month et day à partir de la date de début du congé
      const dateDebut: Date = new Date(conge.dateDebut);
      const year: number = dateDebut.getFullYear();
      const month: string = dateDebut.toLocaleString('en-US', { month: 'long' });
      const monthCapitalized: string = month.charAt(0).toUpperCase() + month.slice(1); // Met la première lettre en majuscule
      const day: number = dateDebut.getDate();
  
      // Crée le champ date au format "Month_Year"
      const dateFormatted: string = `${monthCapitalized}_${year}`;
  
      console.log('Year:', year);
      console.log('Month:', monthCapitalized);
      console.log('Day:', day);
      console.log('Date Formatted:', dateFormatted);
      
      // Création d'un nouvel objet congé avec les champs year, month, day et date ajoutés
      const newConge = { ...conge, status: 0, year, month: monthCapitalized, day, date: dateFormatted };
  
      const congeCollectionRef = collection(this.firestore, 'conge123');
      const docRef = await addDoc(congeCollectionRef, newConge);
      console.log('Congé ajouté avec succès, ID:', docRef.id);
      return docRef.id; // Retourne l'ID du document ajouté
    } catch (error) {
      console.error('Erreur lors de l\'ajout du congé dans Firestore :', error);
      return undefined;
    }
  }
  


  //hazit lid domain m table membership

  async getUserAndDomainId(): Promise<{ user: User | null, domainId: string | null }> {
    return new Promise<{ user: User | null, domainId: string | null }>(async (resolve, reject) => {
      if (!this.authInitialized) {
        // stana l'initialisation de l'authentification tkamel
        setTimeout(() => {
          this.getUserAndDomainId().then(resolve).catch(reject);
        }, 100); // Attendre 100 millisecondes avant de réessayer
        return;
      }

      if (this.currentUser) {
        try {
          const userDocRef = doc(this.firestore, 'membership_CRA', this.currentUser.uid);
          const userDocSnapshot: DocumentSnapshot<DocumentData> = await getDoc(userDocRef);
          if (userDocSnapshot.exists()) {
            const domainId = userDocSnapshot.data()['idDomaine'];
            resolve({ user: this.currentUser, domainId: domainId });
          } else {
            reject('Utilisateur non trouvé dans la collection membership_CRA');
          }
        } catch (error) {
          reject('Erreur lors de la récupération de l\'ID de domaine : ' + error);
        }
      } else {
        reject('Aucun utilisateur connecté.');
      }
    });
  }

  async updateCongeWithFileURLAndCongeId(downloadURL: string, congeId: string): Promise<void> {
    try {
      const congeDocRef = doc(this.firestore, 'conge123', congeId);
      await updateDoc(congeDocRef, { url_sertif: downloadURL });
      console.log('URL de téléchargement ajoutée au document Congé.');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'URL de téléchargement au document Congé :', error);
    }
  }
}
