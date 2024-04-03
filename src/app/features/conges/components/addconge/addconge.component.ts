import { Component, OnInit } from '@angular/core';
import { CongeService } from '../../services/conge.service';
import { differenceInDays } from 'date-fns';
import { TranslocoService } from '@ngneat/transloco';
import { handleResponseSuccessWithAlerts } from 'src/app/common/alerts.utils';
import { AngularFireStorage } from '@angular/fire/compat/storage';

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

  constructor(
    private congeService: CongeService,
    private translocoService: TranslocoService,
    private fireStorage: AngularFireStorage
  ) { }

  ngOnInit(): void {
    this.congeService
      .getUserAndDomainId()
      .then(({ user, domainId }) => {
        this.user = user;
        if (domainId !== null) {
          this.domainId = domainId;
        } else {
          console.error('ID de domaine non disponible.');
        }
      })
      .catch((error) => {
        console.error('Erreur lors de la récupération de l\'utilisateur et de l\'ID de domaine:', error);
      });
  }

  async onSubmit(): Promise<void> {
    const nombreJours: number = differenceInDays(this.dateFin, this.dateDebut) + 1; // nzid +1 bech nzid nhar lewl
    let nombreHeures: number;
    switch (this.dureeConge) {

      case "Demi journée - le matin":
      case "Demi journée - l'après midi":
        this.dateDebut = this.dateFin;
        nombreHeures = 4; // demi journe=4heures 
        break;
      case "Journée entière":
        this.dateDebut = this.dateFin;
        nombreHeures = 8; // nahr wehed = 8heures tool 
        break;
      case "Plus d'1 jour":

        nombreHeures = 8 * nombreJours;
        break;
      case "Autorisation de sortie - Début de journée":
      case "Autorisation de sortie - fin de journée":
        this.dateDebut = this.dateFin;
        nombreHeures = 4; // demi journe=4heures 
        break;

      default:

        console.error("Durée de congé invalide:", this.dureeConge);
        return;
    }
    // Définir la valeur de this.natureConge avant la condition

    const conge: any = {
      nature: this.natureConge,
      duree: this.dureeConge,
      dateDebut: this.dateDebut,
      dateFin: this.dateFin,
      commentaires: this.commentaires,
      photourl: this.user ? this.user.photoURL : null,
      displayName: this.user ? this.user.displayName : null,
      email: this.user ? this.user.email : null,
      domainId: this.domainId,
      nombreHeures: nombreHeures,
      status: 0,
    };

    try {
      const congeId = await this.congeService.addConge(conge);

      if (congeId) {
        // Vérifier si la nature du congé est 'Congé de maladie (1 jour)'
        if (this.natureConge === 'Congé de maladie (1 jour)' && this.selectedFile) {
          const path = `sertif_conge/${congeId}/${this.selectedFile.name}`;
          const uploadTask = this.fireStorage.upload(path, this.selectedFile);

          uploadTask.then(async (snapshot) => {
            const downloadURL = await snapshot.ref.getDownloadURL();
            console.log('URL de téléchargement:', downloadURL);
            await this.congeService.updateCongeWithFileURLAndCongeId(downloadURL, congeId);
          }).catch((error) => {
            console.error('Erreur lors du téléchargement du fichier:', error);
          });
        }

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
}
