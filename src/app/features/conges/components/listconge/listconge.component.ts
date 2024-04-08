import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

import Swal from 'sweetalert2';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { differenceInDays } from 'date-fns';
import { MatTooltip } from '@angular/material/tooltip';
import { ProfileService } from 'src/app/services/profile.service';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-listconge',
  templateUrl: './listconge.component.html',
  styleUrls: ['./listconge.component.scss']
})
export class ListcongeComponent<T> implements OnInit {
  conges: any[] = [];
  /*++++++++*/


  filteredConges: any[] = []; // Tableau pour les congés filtrés
  selectedStatus: string = 'awaiting'; // Par défaut, tous les congés sont affichés
  displayedColumns: string[] = ['photo', 'dateDebut', 'nature', 'duree', 'comment', 'status', 'actions'];
  public dataSource: MatTableDataSource<T>;
  @ViewChild(MatPaginator, { static: true })
  public paginator: MatPaginator;
  @Input() data: any;
  /*++++++*/

  constructor(private translocoService: TranslocoService, private profileService: ProfileService
    , private auth: Auth
  ) {
  }

  ngOnInit(): void {
    this.loadConges();
    this.dataSource = new MatTableDataSource(this.data ?? []);
    this.dataSource.paginator = this.paginator; // Configuration du paginator
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchText = filter.trim().toLowerCase();
      return Object.values(data).some(value =>
        typeof value === 'string' && value.toLowerCase().includes(searchText)
      );
    };
  }


  async loadConges(): Promise<void> {
    const firestore = getFirestore();
    const congesCollectionRef = collection(firestore, 'conge123');

    try {
      const querySnapshot = await getDocs(congesCollectionRef);
      querySnapshot.forEach(async (doc) => {
        const data = doc.data() as { [key: string]: any, status: number };
        this.getUserDomain().then(iddomain => {
          if (data['domainId'] === iddomain) { // Vérifier la correspondance des domaines
            this.conges.push({ id: doc.id, ...data, statusLabel: this.getStatusLabel(data.status) });
            // Copiez les congés dans filteredConges pour afficher tous les congés au début
            this.filterByStatus(this.selectedStatus);
          }
        });
      });



      console.log('Liste des congés:', this.conges);
    } catch (error) {
      console.error('Erreur lors du chargement des congés depuis Firestore:', error);
    }
  }

  async getUserDomain(): Promise<string | null> {
    return new Promise<string | null>((resolve, reject) => {
      const user = this.auth.currentUser;
      if (user) {
        this.profileService.getIdDomaine().then(domainId => {
          resolve(domainId);
        }).catch(error => {
          reject(error);
        });
      } else {
        reject('Aucun utilisateur connecté.');
      }
    });
  }


  getStatusLabel(status: number): string {
    switch (status) {
      case 0:
        return 'En attente';
      case 1:
        return 'Approuvé';
      case 2:
        return 'Refusé';
      default:
        return '';
    }
  }

  
  // Méthode de filtrage des congés en fonction de l'état sélectionné
  filterByStatus(status: string): void {
    if (status === 'all') {
      this.filteredConges = [...this.conges];
    } else {
      this.filteredConges = this.conges.filter(conge => conge.status === this.getStatusValue(status));
    }
    this.dataSource.data = this.filteredConges;
  }

  getStatusValue(status: string): number {
    switch (status) {
      case 'awaiting':
        return 0;
      case 'approved':
        return 1;
      case 'rejected':
        return 2;
      default:
        return -1;
    }
  }
 

  async validerConge(conge: any): Promise<void> {
    const firestore = getFirestore();
    const congDocRef = doc(firestore, 'conge123', conge.id);

    try {
      await updateDoc(congDocRef, { status: 1 });
      console.log('Congé validé avec succès.');
      this.showSuccessAlert('Congé accepté');
      conge.status = 1;
      conge.statusLabel = 'Approuvé';

      // Mettre à jour les congés filtrés pour retirer le congé approuvé
      this.filteredConges = this.filteredConges.filter(c => c.id !== conge.id);
      this.dataSource.data = this.filteredConges;

    } catch (error) {
      console.error('Erreur lors de la validation du congé:', error);
    }
  }


  async refuserConge(conge: any): Promise<void> {
    const firestore = getFirestore();
    const congDocRef = doc(firestore, 'conge123', conge.id);

    try {
      const { value: commentaire } = await Swal.fire({
        title: 'Ajouter un commentaire',
        input: 'textarea',
        inputPlaceholder: 'Ajouter un commentaire ',
        showCancelButton: true,
        confirmButtonText: 'Ok',
        cancelButtonText: 'Annuler'
      });

      // Vérifier si un commentaire a été saisi
      if (commentaire == '' || commentaire) {
        const { isConfirmed } = await Swal.fire({
          title: 'Êtes-vous sûr de vouloir refuser ce congé ?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Ok',
          cancelButtonText: 'Annuler'
        });

        // Mettre à jour le statut du congé seulement si l'utilisateur confirme
        if (isConfirmed) {
          await updateDoc(congDocRef, { status: 2, commentaire: commentaire });
          console.log('Congé refusé avec succès.');
          conge.status = 2;
          conge.statusLabel = 'Refusé';

          // Mettre à jour les congés filtrés pour retirer le congé refusé
          this.filteredConges = this.filteredConges.filter(c => c.id !== conge.id);
          this.dataSource.data = this.filteredConges;
        }
      }
    } catch (error) {
      console.error('Erreur lors du refus du congé:', error);
      this.showRefuseAlert('Erreur lors du refus du congé');
    }
  }


  async showSuccessAlert(message: string): Promise<void> {
    await Swal.fire('Succès', message, 'success');
  }

  async showRefuseAlert(message: string): Promise<void> {
    await Swal.fire('Erreur', message, 'error');
  }

  
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  // Méthode pour formater la durée du congé
  formatDuree(conge: any): string {
    if (conge.duree === "Demi journée - le matin" || conge.duree === "Demi journée - l'après midi" || conge.duree === "Début de journée" || conge.duree === "Fin de journée") {
      return "1/2 ";
    } else {
      const difference = differenceInDays(conge.dateFin.toDate(), conge.dateDebut.toDate()) + 1;
      return `${difference} `;
    }
  }
  // methode pour telcharge certif 
  openFile(url: string): void {
    window.open(url, '_blank');
  }
  Congerefuser(conge: any) {
    // Utiliser SweetAlert2 pour afficher le commentaire
    Swal.fire({
      title: 'Commentaires',
      text: conge.commentaire,
      icon: 'info',
      confirmButtonText: 'Fermer'
    });
  }
}
