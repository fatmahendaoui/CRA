import { Injectable, inject } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, query, where } from 'firebase/firestore';
import { environment } from 'src/environments/environment';
import { getAuth, User } from 'firebase/auth';
import { DocumentSnapshot, DocumentData } from 'firebase/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { getDocs, serverTimestamp, updateDoc, } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Profile } from 'src/app/models/profile.model';
import { ProfileService } from 'src/app/services/profile.service';

@Injectable({
  providedIn: 'root'
})
export class CongeService {

  private readonly http = inject(HttpClient);
  private readonly profileService = inject(ProfileService);

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
      const congeCollectionRef = collection(this.firestore, 'conge123');
      const newConge = { ...conge, status: 0 };
      const docRef = await addDoc(congeCollectionRef, conge);
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

  /*************************** */
  async submitCongeWithEmail(data) {
    try {
      // Récupérer les administrateurs
      const adminUsers: Profile[] = await this.getAdminUsers();

      // Envoyer un email à chaque administrateur
      for await (const adminUser of adminUsers) {
        const emailData = { ...data }; // Cloner les données pour chaque admin
        emailData.emailData = adminUser.email; // Utiliser emailData au lieu de email
        emailData.AdminName = adminUser.displayName;

        console.log(emailData); // Optionnel : journalisation des données avant l'envoi

        // Appel de la fonction de Cloud pour envoyer l'email
        await this.sendEmailToAdmin(emailData);
      }
    } catch (error) {
      console.error('Error submitting congé with email:', error);
    }
  }


  async getAdminUsers(): Promise<Profile[]> {
    const adminUsers: Profile[] = [];
    const querySnapshot = await getDocs(
      query(
        collection(this.firestore, 'membership_CRA'),
        where('idDomaine', '==', this.profileService.profile.idDomaine)
      )
    );

    querySnapshot.forEach((doc) => {
      const userData = doc.data() as Profile;
      if (userData.role === 'admin' && userData.notify) {
        adminUsers.push(userData);
      }
    });

    return adminUsers;
  }

  async sendEmailToAdmin(emailData): Promise<void> {
    try {
      await this.http.post<void>(
        `https://us-central1-dev-cra-390314.cloudfunctions.net/sendCongeNotificationEmail`,
        emailData
      ).toPromise();
      console.log('Email sent successfully to admin:', emailData.emailData); // Utiliser emailData.emailData au lieu de emailData.email
    } catch (error) {
      console.error('Error sending email to admin:', error);
    }
  }


  async sendEmailToUser(emailData): Promise<void> {
    try {
      await this.http.post<void>(
        `https://us-central1-dev-cra-390314.cloudfunctions.net/sendCongeStatusEmail`,
        emailData
      ).toPromise();
      console.log('E-mail envoyé avec succès:', emailData);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
      throw error;
    }
  }

}
