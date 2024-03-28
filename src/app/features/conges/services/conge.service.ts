import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { environment } from 'src/environments/environment';
import { getAuth, User } from 'firebase/auth'; 
import { DocumentSnapshot, DocumentData } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class CongeService {
  
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
  
  async addConge(conge): Promise<void> {
    try {
      const congeCollectionRef = collection(this.firestore, 'conge123');
      await addDoc(congeCollectionRef, conge);
      console.log('Congé ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du congé dans Firestore :', error);
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
}
