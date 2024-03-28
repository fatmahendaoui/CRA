import { Component, OnInit } from '@angular/core';
import { CongeService } from '../../services/conge.service';
import { differenceInDays } from 'date-fns';

@Component({
  selector: 'app-addconge',
  templateUrl: './addconge.component.html',
  styleUrls: ['./addconge.component.css']
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
  constructor(private congeService: CongeService) { }

  ngOnInit(): void {
    const nombreJours: number = differenceInDays(this.dateFin, this.dateDebut) + 1;
    // Récupérer l'utilisateur connecté et son ID de domaine dob maychargi 
    this.congeService.getUserAndDomainId().then(({ user, domainId }) => {
      this.user = user;
      if (domainId !== null) {
        this.domainId = domainId;
      } else {
        console.error('ID de domaine non disponible.');
      }
      console.log('Utilisateur connecté:', this.user);
      console.log('ID de domaine:', this.domainId);
    }).catch(error => {
      console.error('Erreur lors de la récupération de l\'utilisateur et de l\'ID de domaine:', error);
    });
  }
  
  onSubmit(): void {
    // Calculer le nombre de jours 
    const nombreJours: number = differenceInDays(this.dateFin, this.dateDebut) + 1; // nzid +1 bech nzid nhar lewl
    let nombreHeures: number;
    switch (this.dureeConge) {
      case "Demi journée - le matin":
      case "Demi journée - l'après midi":
        nombreHeures = 4 * nombreJours; // demi journe=4heures 
        break;
      case "Journée entière":
        nombreHeures = 8 * nombreJours; // nahr wehed = 8heures tool 
        break;
      case "Plus d'1 jour":
        
        nombreHeures = 8 * nombreJours;
        break;
      default:
       
        console.error("Durée de congé invalide:", this.dureeConge);
        return; 
    }

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
      
    };
  
    
    this.congeService.addConge(conge).then(() => {
      
      this.natureConge = '';
      this.dureeConge = '';
      this.dateDebut = new Date(); // Réinitialiser avec la date actuelle
      this.dateFin = new Date(); // Réinitialiser avec la date actuelle
      this.commentaires = '';
    }).catch(error => {
      console.error('Error adding congé:', error);
    });
  }
  

  onFileSelected(event): void {
    this.selectedFile = event.target.files[0];
  }


  
}
