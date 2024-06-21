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
  selectedFile: File;
  user: any; // variable pour stocker l'utilisateur connecté
  domainId: string; //  variable pour stocker l'ID de domaine
  periode: any[] = [null, null];
  photourl: string;
  displayNamecurent;
  status: string;
  userId: string | null;
  congeId: string | null; // Nouvelle variable de classe pour stocker l'ID du congé
  private readonly profileService = inject(ProfileService);

  fileError: boolean = false; // Variable to track file validation error

  congesParUtilisateur: any;
  leavesByUser: any;
  congesLengths: { [userId: string]: number } = {};
  leavesLengths: { [userId: string]: number } = {};

  constructor(
    private congeService: CongeService,
    private translocoService: TranslocoService,
    private fireStorage: AngularFireStorage,
    private router: Router,
  ) { }

  ngOnInit(): void {

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
    // Reset file error
    this.fileError = false;

    // Check if the leave type is "Congé de maladie" and if a file is selected
    if (this.natureConge === 'Congé de maladie (1 jour)' && !this.selectedFile) {
      this.fileError = true;
      return;
    }

    const userId = this.user ? this.user.uid : null;
    let nombreJours: number = differenceInDays(this.dateFin, this.dateDebut) + 1; // Ajouter 1 pour inclure la date de début
    let nombreHeures: number;
    // Obtenez la date et l'heure actuelles
    const currentDate = new Date();

    // Vérifier si la période contient un week-end
    let joursWeekend = 0;
    for (let i = 0; i < nombreJours; i++) {
      const currentDate = addDays(this.dateDebut, i);
      if (isSaturday(currentDate) || isSunday(currentDate)) {
        joursWeekend++;
      }
    }


    if (joursWeekend > 0) {
      nombreJours -= 2;
    }


    switch (this.dureeConge) {

      case "Demi journée - le matin":
      case "Demi journée - l'après midi":
        this.dateFin = this.dateDebut;
        nombreHeures = 4; // demi journe=4heures 
        break;
      case "Journée entière":
        this.dateFin = this.dateDebut;
        nombreHeures = 8; // nahr wehed = 8heures tool 
        break;
      case "Plus d'1 jour":

        nombreHeures = 8 * nombreJours;
        break;
      case "Début de journée":
      case "Fin de journée":
        this.dateFin = this.dateDebut;
        nombreHeures = 2; // demi journe=4heures 
        break;

      default:

        console.error("Durée de congé invalide:", this.dureeConge);
        return;
    }
    // Définir la valeur de this.natureConge avant la condition
    let photourl = await this.profileService.getUserPhotoURL(userId);

    const conge: any = {
      nature: this.natureConge,
      duree: this.dureeConge,
      dateDebut: this.dateDebut,
      dateFin: this.dateFin,
      commentaires: this.commentaires,
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
      const congeId = await this.congeService.addConge(conge);
      if (congeId) {
        this.congeId = congeId;

        // Vérifier si la nature du congé est 'Congé de maladie (1 jour)'
        if (this.natureConge === 'Congé de maladie (1 jour)' && this.selectedFile) {
          const path = `sertif_conge/${congeId}/${this.selectedFile.name}`;
          const uploadTask = this.fireStorage.upload(path, this.selectedFile);

          uploadTask.then(async (snapshot) => {
            const downloadURL = await snapshot.ref.getDownloadURL();
            await this.congeService.updateCongeWithFileURLAndCongeId(downloadURL, congeId);
            conge.url_certif = downloadURL;

          }).catch((error) => {
            console.error('Erreur lors du téléchargement du fichier:', error);
          });
        }
        let data = {
          nameRequest: this.user.displayName,
          uid: this.user.uid,
          nature: this.natureConge,
          duree: this.dureeConge,
          dateDebut: this.dateDebut,
          dateFin: this.dateFin,
          commentaires: this.commentaires,
          congeId: this.congeId
        };
        await this.congeService.submitCongeWithEmail(data);
        // Réinitialiser les champs du formulaire après l'ajout du congé
        this.natureConge = '';
        this.dureeConge = '';
        this.dateDebut = new Date();
        this.dateFin = new Date();
        this.commentaires = '';

        // Afficher une alerte ou un message de succès
        handleResponseSuccessWithAlerts(
          this.translocoService.translate('features.projects.dialog.success.title'),
          '',
          this.translocoService.translate('common.close'),
          () => { }
        );
      } else {
        console.error('Erreur lors de l\'ajout du congé.');
      }
    } catch (error) {
      console.error('Error adding congé:', error);
    }
  }

  async onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  async fetchAndStoreFilteredConges(): Promise<void> {
    const firestore = getFirestore();
    const congesCollectionRef = collection(firestore, 'conge');
    const currentYear = new Date().getFullYear();
    // Tableau pour stocker les congés filtrés
    const congesFiltres: DocumentData[] = [];
    try {
      const q = query(congesCollectionRef,
        where('status', '==', 1),
        where('year', '==', currentYear), // Ajout de la condition pour l'année actuelle
        where('nature', '==', 'Congé de maladie (1 jour)') // Ajout de la condition pour la nature du congé
      );

      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        congesFiltres.push(data); // Ajouter le congé filtré au tableau des congés filtrés
      });


      // Créer un objet pour stocker les congés de chaque utilisateur
      const congesParUtilisateur: { [userId: string]: DocumentData[] } = {};

      // Parcourir les congés filtrés
      congesFiltres.forEach(conge => {
        const userId = conge['userId']; // Supposons que l'ID de l'utilisateur est stocké dans un champ 'userId'

        // Vérifier si l'utilisateur a déjà des congés dans l'objet congesParUtilisateur
        if (!congesParUtilisateur[userId]) {
          // Si l'utilisateur n'a pas encore de congés, initialiser un tableau vide
          congesParUtilisateur[userId] = [];
        }

        // Ajouter le congé à l'objet congesParUtilisateur sous la clé correspondant à l'ID de l'utilisateur
        congesParUtilisateur[userId].push(conge);

      });


      for (const userId in congesParUtilisateur) {
        if (Object.prototype.hasOwnProperty.call(congesParUtilisateur, userId)) {
          const congesLength = congesParUtilisateur[userId].length;
          this.congesLengths[userId] = congesLength;
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
}




