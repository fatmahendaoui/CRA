import { AuthService } from 'src/app/features/sign-in/services/auth.service';
import { Component, OnInit, inject } from '@angular/core';
import { CongeService } from '../../services/conge.service';
import { differenceInDays, addDays, isSaturday, isSunday, add } from 'date-fns';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { handleResponseSuccessWithAlerts } from 'src/app/common/alerts.utils';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { getFirestore, collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { ProfileService } from 'src/app/services/profile.service';



@Component({
  selector: 'app-addconge',
  templateUrl: './addconge.component.html',
  styleUrls: ['./addconge.component.scss'],
})


export class AddcongeComponent implements OnInit {
  natureConge: string;
  dureeConge: string;
  dateDebut: Date = new Date(); // Initialisation date lyom
  dateFin: Date = new Date();
  commentaires: string;
  selectedFile: File | null = null; 
  user: any; // variable pour stocker l'utilisateur connecté
  domainId: string; //  variable pour stocker l'ID de domaine
  periode: any[] = [null, null];
  photourl: string;
  displayNamecurent;
  status: string;
  userId: string | null;
  congeId: string | null; // Nouvelle variable de classe pour stocker l'ID du congé
  private readonly profileService = inject(ProfileService);
  private readonly auth = inject(AuthService);
  fileError: boolean = false; // Variable to track file validation error

  congesParUtilisateur: any;
  leavesByUser: any;
  congesLengths: { [userId: string]: number } = {};
  leavesLengths: { [userId: string]: number } = {};
  isSubmitting: boolean = false;
  constructor(
    private congeService: CongeService,
    private translocoService: TranslocoService,
    private fireStorage: AngularFireStorage,
    private router: Router,
  ) { }
  isSickLeaveEligible: boolean = false; // Déclarer la propriété
  alertVisible: boolean = false; 
  alertMessage: string = '';
  async ngOnInit(): Promise<void> {
    this.isSickLeaveEligible = await this.isEligibleForMoreSickLeave();
    this.fetchAndStoreFilteredConges();
    this.fetchAndStoreFilteredLeaves();
    this.congeService
      .getUserAndDomainId()
      .then(({ user, domainId }) => {
        this.user = user;
        if (domainId !== null) {
          this.domainId = domainId;
        } else {
          console.error('ID de domaine non disponible.');
        }
        this.userId = user ? user.uid : null;
      })
      .catch((error) => {
        console.error('Erreur lors de la récupération de l\'utilisateur et de l\'ID de domaine:', error);
      });
      
     }

  async onSubmit(): Promise<void> {
    this.fileError = false;
  
    if (this.natureConge === 'Congé de maladie (1 jour)' && !this.selectedFile) {
      this.fileError = true;
      return; 
    }
  
    if (this.isSubmitting) {
      return; // Prevent multiple submissions
    }
  
    this.isSubmitting = true; // Disable the button
    const userId = this.user ? this.user.uid : null;
    let nombreJours: number = differenceInDays(this.dateFin, this.dateDebut) + 1;
    let nombreHeures: number;
    const nombreCongesMaladie = await this.getNombreCongesMaladie(userId);
    console.log(`Total Congé de maladie days for user: ${nombreCongesMaladie}`);
    const currentDate = new Date();
    let joursWeekend = 0;
  
    // Exclude weekends from leave duration
    for (let i = 0; i < nombreJours; i++) {
      const currentDate = addDays(this.dateDebut, i);
      if (isSaturday(currentDate) || isSunday(currentDate)) {
        joursWeekend++;
      }
    }
  
    if (joursWeekend > 0) {
      nombreJours -= joursWeekend;
    }
  
    // Calculate total hours based on leave duration type
    switch (this.dureeConge) {
      case "Demi journée - le matin":
      case "Demi journée - l'après midi":
        this.dateFin = this.dateDebut;
        nombreHeures = 4;
        break;
      case "Journée entière":
        this.dateFin = this.dateDebut;
        nombreHeures = 8;
        break;
      case "Plus d'1 jour":
        nombreHeures = 8 * nombreJours;
        break;
      case "Début de journée":
      case "Fin de journée":
        this.dateFin = this.dateDebut;
        nombreHeures = 2;
        break;
      default:
        console.error("Durée de congé invalide:", this.dureeConge);
        return;
    }
  console.log("nature de conge .....",this.natureConge);
    // Check if the leave type is "Congé de maladie"
    if (this.natureConge === "Congé de maladie (1 jour)") {
      const totalLeaves = nombreCongesMaladie + nombreJours;
      if (totalLeaves > 8) {
        this.alertVisible = true; // Afficher l'alerte.
        this.alertMessage = `Vous avez dépassé la limite de 8 jours pour le Congé de maladie ! Vous avez actuellement ${nombreCongesMaladie} jours.`;
        this.isSubmitting = false; // Re-enable the button
        return; // Exit the function
      }
    }
  
    let photourl = await this.profileService.getUserPhotoURL(userId);
  
    const conge: any = {
      nature: this.natureConge,
      duree: this.dureeConge,
      dateDebut: this.dateDebut,
      dateFin: this.dateFin,
      commentaires: this.commentaires || '',
      photourl: photourl,
      displayName: this.user ? this.user.displayName : null,
      email: this.user ? this.user.email : null,
      domainId: this.domainId,
      nombreHeures: nombreHeures,
      userId: userId,
      status: 0,
      dateEnvoi: currentDate.toISOString().split('T')[0],
      heureEnvoi: currentDate.toLocaleTimeString(),
    };
  
    try {
      // Étape 1 : Enregistrer rapidement le congé dans Firestore
      const congeId = await this.congeService.addConge(conge);
      if (congeId) {
        this.congeId = congeId;
        if (this.natureConge === 'Congé de maladie (1 jour)' && this.selectedFile) {
          try {
            const path = `sertif_conge/${congeId}/${this.selectedFile.name}`;
            const uploadTask = this.fireStorage.upload(path, this.selectedFile);
      
            const snapshot = await uploadTask;
            const downloadURL = await snapshot.ref.getDownloadURL();
      
            await this.congeService.updateCongeWithFileURLAndCongeId(downloadURL, congeId);
            conge.url_certif = downloadURL;
          } catch (error) {
            console.error('Erreur lors du téléchargement du fichier:', error);
          }
      
        }
      // Traiter les tâches secondaires de manière asynchrone
      this.processAdditionalTasks(conge, congeId);
        // Afficher immédiatement la confirmation
        handleResponseSuccessWithAlerts(
          this.translocoService.translate('features.projects.dialog.success.title'),
          '',
          this.translocoService.translate('common.close'),
          () => {}
        );
  

        // Réinitialiser les champs du formulaire après l'ajout du congé
        this.natureConge = '';
        this.dureeConge = '';
        this.dateDebut = new Date();
        this.dateFin = new Date();
        this.commentaires = '';
  
    
      } else {
        console.error('Erreur lors de l\'ajout du congé.');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du congé:', error);
    }
    finally {
      this.isSubmitting = false; // Réactiver le bouton après la fin du traitement
      this.alertVisible = false;
    }
  }
  
  private async processAdditionalTasks(conge: any, congeId: string): Promise<void> {
    
    // Envoi d'email
    try {
      let data = {
        nameRequest: this.user.displayName,
        uid: this.user.uid,
        nature: this.natureConge,
        duree: this.dureeConge,
        dateDebut: this.dateDebut,
        dateFin: this.dateFin,
        commentaires: this.commentaires || '',
        congeId: congeId
      };
  
      await this.congeService.submitCongeWithEmail(data);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
    }
  }
  async onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  async fetchAndStoreFilteredConges(): Promise<void> {
    const firestore = getFirestore();
    const congesCollectionRef = collection(firestore, 'conge');
    const currentYear = new Date().getFullYear();
    const nombreCongesMaladie = await this.getNombreCongesMaladie(this.user.uid);
console.log(`Total Congé de maladie days for user: ${nombreCongesMaladie}`);
    // Tableau pour stocker les congés filtrés
    const congesFiltres: DocumentData[] = [];
    try {
      const q = query(congesCollectionRef,
        where('status', '==', 1),
        where('year', '==', currentYear), 
        where('nature', '==', 'Congé de maladie (1 jour)')
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        congesFiltres.push(data); 
      });

      // Créer un objet pour stocker les congés de chaque utilisateur
      const congesParUtilisateur: { [userId: string]: DocumentData[] } = {};

      // Parcourir les congés filtrés
      congesFiltres.forEach(conge => {
        const userId = conge['userId']; 
         console.log("userId firbase ",userId);
        if (!congesParUtilisateur[userId]) {
          console.log("userId firbase ");
          console.log("conge :: ",conge);
          congesParUtilisateur[userId] = [];
        }
        congesParUtilisateur[userId].push(conge);
      });
      console.log(congesParUtilisateur)
      console.log("userId firbase ",this.user.uid);
      for (const userId in congesParUtilisateur) {
        console.log("userId firbase ",congesParUtilisateur);
        if (Object.prototype.hasOwnProperty.call(congesParUtilisateur, userId) && userId==this.user.uid) {
          // Calculate the total number of hours from the user's leave records
          const totalHours = congesParUtilisateur[userId].reduce((acc, conge) => acc + conge['nombreHeures'], 0);
          const congesLengths = totalHours / 8;
          this.congesLengths[userId] = congesLengths;
          console.log('Nombre de congés pour l\'utilisateur', userId, ':', congesLengths, "tttttt", congesParUtilisateur[userId]);
        }
      }
     
    } catch (error) {
      console.error('Erreur lors du chargement et du stockage des congés filtrés depuis Firestore:', error);
    }
  }


  async fetchAndStoreFilteredLeaves(): Promise<void> {
    const firestore = getFirestore();
    const leavesCollectionRef = collection(firestore, 'conge');
    const currentYear = new Date().getFullYear();
    const currentMonth: string = new Date().toLocaleString('en-US', { month: 'long' });
    const capitalizedMonth: string = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);



    // Tableau pour stocker les congés filtrés
    const leavesFiltered: DocumentData[] = [];

    try {
      const q = query(leavesCollectionRef,

        where('nombreHeures', '==', 2),
        where('status', '==', 1),
        where('month', '==', capitalizedMonth),
      );

      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        leavesFiltered.push(data);
      });

      // Créer un objet pour stocker les congés de chaque utilisateur
      const leavesByUser: { [userId: string]: DocumentData[] } = {};

      // Parcourir les congés filtrés
      leavesFiltered.forEach(leave => {
        const userId = leave['userId'];

        if (!leavesByUser[userId]) {
          leavesByUser[userId] = [];
        }

        leavesByUser[userId].push(leave);
      });

      for (const userId in leavesByUser) {
        if (Object.prototype.hasOwnProperty.call(leavesByUser, userId)) {
          const leavesLength = leavesByUser[userId].length;
          this.leavesLengths[userId] = leavesLength; // Assurez-vous que leavesLengths est correctement défini dans votre classe
        }
      }

    } catch (error) {
      console.error('Erreur lors du chargement et du stockage des congés filtrés depuis Firestore:', error);
    }
  }

  // Method to calculate and return the number of "Congé de maladie" (sick leave) days for the current user
async getNombreCongesMaladie(userId: string): Promise<number> {
  const firestore = getFirestore();
  const congesCollectionRef = collection(firestore, 'conge');
  
  try {
    // Query to get all "Congé de maladie (1 jour)" for the current year and the user
    const currentYear = new Date().getFullYear();
    const q = query(
      congesCollectionRef,
      where('status', '==', 1), // Assuming status 1 indicates a valid leave
      where('nature', '==', 'Congé de maladie (1 jour)'), // Filter by sick leave type
      where('year', '==', currentYear),
      where('userId', '==', userId) // Filter by the current user's ID
    );
    
    const querySnapshot = await getDocs(q);
    let totalCongesMaladie = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalCongesMaladie += data['nombreHeures'] / 8; // Assuming each day is counted as 8 hours
    });
    
    return totalCongesMaladie;
  } catch (error) {
    console.error('Erreur lors du calcul du nombre de congés de maladie:', error);
    return 0; // Return 0 in case of error
  }
}

// Method to check if the current user is eligible for more sick leave
async isEligibleForMoreSickLeave(): Promise<boolean> {
  try {
    const currentUserId = await this.auth.getCurrentUserId(); // Get the current user's ID
    console.log("currentUserId", currentUserId);

    // Check if currentUserId is null
    if (!currentUserId) {
      console.error('Error: currentUserId is null');
      return false; // Default to not eligible if user ID is null
    }

    // Get the total number of sick leave days
    const totalSickLeaveDays = await this.getNombreCongesMaladie(currentUserId);

    // Check if the user has fewer than 8 sick leave days
    if (totalSickLeaveDays >= 8) {
      return false; // Not eligible
    } else {
      return true; // Eligible
    }
  } catch (error) {
    console.error('Error checking sick leave eligibility:', error);
    return false; // Default to not eligible in case of error
  }
}

}




