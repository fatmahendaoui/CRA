import { Injectable, inject } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, query, where } from 'firebase/firestore';
import { environment } from 'src/environments/environment';
import { getAuth, User } from 'firebase/auth';
import { DocumentSnapshot, DocumentData } from 'firebase/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { serverTimestamp, updateDoc, Timestamp } from '@angular/fire/firestore';

import { getDocs, } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Profile } from 'src/app/models/profile.model';
import { ProfileService } from 'src/app/services/profile.service';

@Injectable({
  providedIn: 'root'
})
export class CongeService {
  getCongesByUser(userId: string) {
    throw new Error('Method not implemented.');
  }

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

  async addConge(conge) {
    try {
      // Ajout des champs year, month et day à partir de la date de début du congé
      const dateDebut = new Date(conge.dateDebut);
      const year = dateDebut.getFullYear();
      const month = dateDebut.toLocaleString('en-US', { month: 'long' });
      const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1); // Met la première lettre en majuscule
      const day = dateDebut.getDate();

      // Ajout des champs yearF, monthF et dayF à partir de la date de fin du congé
      const dateFin = new Date(conge.dateFin);
      const nextMonth = dateFin.toLocaleString('en-US', { month: 'long' });

      const yearF = dateFin.getFullYear();
      const monthF = dateFin.toLocaleString('en-US', { month: 'long' });
      const monthCapitalizedF = monthF.charAt(0).toUpperCase() + monthF.slice(1); // Met la première lettre en majuscule
      const dayF = dateFin.getDate();

      // Crée le champ date au format "Month_Year" pour la date de début
      const dateFormatted = `${monthCapitalized}_${year}`;

      // Crée le champ dateF au format "Month_Year" pour la date de fin
      const dateFormattedF = `${monthCapitalizedF}_${yearF}`;


      // Création d'un nouvel objet congé avec les champs year, month, day, date et dateF ajoutés
      const newConge = {
        ...conge,
        status: 0,
        year,
        month: monthCapitalized,
        day,
        date: dateFormatted,
        dateF: dateFormattedF,
        nextMonth
        // Ajout du champ dateF
      };

      const congeCollectionRef = collection(this.firestore, 'conge');
      const docRef = await addDoc(congeCollectionRef, newConge);
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
      const congeDocRef = doc(this.firestore, 'conge', congeId);
      await updateDoc(congeDocRef, { url_sertif: downloadURL });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'URL de téléchargement au document Congé :', error);
    }
  }

  /*************************** */
  async submitCongeWithEmail(emailData): Promise<void> {
    try {
      // Récupérer les administrateurs
      const adminUsers: Profile[] = await this.getAdminUsers();

      // Envoyer un email à chaque administrateur
      for await (const adminUser of adminUsers) {
        const normalizeDate = (date) => {
          const normalizedDate = new Date(date);
          normalizedDate.setHours(0, 0, 0, 0); // Set time to midnight
          return normalizedDate;
        };

        // const today = normalizeDate(new Date());
        const dateDebut = normalizeDate(new Date(emailData.dateDebut));
        const dateFin = new Date(emailData.dateFin);

        /*if (dateDebut.getTime() !== today.getTime()) {
          dateDebut.setDate(dateDebut.getDate() + 1);
          dateFin.setDate(dateFin.getDate() + 1);
        }*/
        const adminEmailData = {
          ...emailData,
          dateDebut: dateDebut.toDateString(),
          dateFin: dateFin.toDateString(),
          emailData: adminUser.email,
          AdminName: adminUser.displayName,

        }; // Cloner les données pour chaque admin
        await this.sendEmailToAdmin(adminEmailData);
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
      if ((userData.role === 'admin'&& userData.notify)|| userData.uid===this.profileService.profile.managerDirect) {
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
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
      throw error;
    }
  }
  async getCongeById(congId: string): Promise<any> {
    try {
      const congeDocRef = doc(this.firestore, 'conge', congId);
      const congeDocSnapshot: DocumentSnapshot<DocumentData> = await getDoc(congeDocRef);
      if (congeDocSnapshot.exists()) {
        return congeDocSnapshot.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du congé :', error);
      throw error;
    }
  }
  async getApprovedConges(): Promise<any[]> {
    try {
      const congeCollectionRef = collection(this.firestore, 'conge');
      const q = query(congeCollectionRef, where('status', '==', 1));
      const querySnapshot = await getDocs(q);
      const approvedConges: any[] = [];
      querySnapshot.forEach((doc) => {
        approvedConges.push(doc.data());
      });
      return approvedConges;
    } catch (error) {
      console.error('Erreur lors de la récupération des congés approuvés :', error);
      return [];
    }
  }
  blockConge(congeId: string): void {
    const donnePrject = collection(this.firestore, 'conge');

  }
  async getAllConges(): Promise<any[]> {
    try {
      const congeCollectionRef = collection(this.firestore, 'conge');
      const querySnapshot = await getDocs(congeCollectionRef);
      const allConges: any[] = [];
      querySnapshot.forEach((doc) => {
        allConges.push(doc.data());
      });
      return allConges;
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les congés :', error);
      return [];
    }
  }

  async loadConges(): Promise<void> {
    try {
      const conges = await this.getAllConges();
    } catch (error) {
      console.error('Erreur lors du chargement des congés :', error);
    }
  }
}

