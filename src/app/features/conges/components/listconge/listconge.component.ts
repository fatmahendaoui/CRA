import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { getFirestore, collection,query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { DateService } from 'src/app/features/timesheet/services/date.service';
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
                    // Convertir la date de début en objet Date
                    const dateDebutTimestamp = data['dateDebut'].toDate();
                    const dateDebutFormatted = dateDebutTimestamp.toLocaleDateString(); // ou toLocaleString()

                    // Convertir la date de fin en objet Date
                    const dateFinTimestamp = data['dateFin'].toDate();
                    const dateFinFormatted = dateFinTimestamp.toLocaleDateString(); // ou toLocaleString()

                    // Ajouter le congé avec les dates converties
                    this.conges.push({
                        id: doc.id,
                        ...data,
                        dateDebutFormatted: dateDebutFormatted,
                        dateFinFormatted: dateFinFormatted,
                        statusLabel: this.getStatusLabel(data.status)
                    });

                    // Copier les congés dans filteredConges pour afficher tous les congés au début
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
  private isWeekendDay(year: number, month: number, day: number): boolean {
    const dayOfWeek = new Date(year, month, day).getDay();
    return dayOfWeek === 0 /* Sunday */ || dayOfWeek === 6 /* Saturday */;
  }
  monthToNumber(month: string): number {
    const monthMap: { [key: string]: number } = {
      January: 0,
      February: 1,
      March: 2,
      April: 3,
      May: 4,
      June: 5,
      July: 6,
      August: 7,
      September: 8,
      October: 9,
      November: 10,
      December: 11,
    };

    return monthMap[month];
  }
 

  async validerConge(conge: any,numberOfDays: number): Promise<void> {
    const firestore = getFirestore();
    const congDocRef = doc(firestore, 'conge123', conge.id);

    try {
      const { isConfirmed } = await Swal.fire({
        title: this.translocoService.translate('features.conge.validate_confirm'),
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: this.translocoService.translate('common.confirm'),
        cancelButtonText: this.translocoService.translate('common.cancel')
      });
    
      if (isConfirmed) {
        await updateDoc(congDocRef, { status: 1 });
        console.log('Congé validé avec succès.');
        this.showSuccessAlert('Congé accepté');
        conge.status = 1;
        conge.statusLabel = 'Approuvé';
    
        // Mettre à jour les congés filtrés pour retirer le congé approuvé
        this.filteredConges = this.filteredConges.filter(c => c.id !== conge.id);
        this.dataSource.data = this.filteredConges;
    
        // Récupérer l'identifiant de l'utilisateur à partir des détails du congé
        const userId = conge.userId;
        const natureConge = conge.nature;
    
        console.log('Valeur de conge.nature juste avant la condition :', natureConge);
    
        // Accéder à la collection de projets avec le chemin approprié incluant l'identifiant de l'utilisateur
        const documentName = natureConge === 'Congé de maladie (1 jour)' ? 'Maladie' : 'Vacances';
        const projectsCollectionRef = collection(firestore, `membership_CRA/${userId}/Projects`);
        const projectsQuery = query(projectsCollectionRef);
    
        const projectsSnapshot = await getDocs(projectsQuery);
        console.log(`Contenu de la collection de projets :`);
        //documentName : Le mois (April_2024 par example )
    
        for (const doc of projectsSnapshot.docs) {
          if (doc.id === documentName) {
            console.log(`Document "${documentName}" trouvé:`, doc.data());
    
            // champ date f conge yekhou mois_year
            const tableName = conge.date;
    
            // Accéder au tableau correspondant dans le document
            let tableData = doc.data()[tableName];
            console.log(`Contenu du tableau "${tableName}":`, tableData);
    
            // Si le tableau n'existe pas, le créer
            if (!tableData) {
              tableData = [];
    
              for (let i = 1; i <= 31; i++) {
                // Vérifiez si le jour est un jour de week-end ou un jour férié avant de l'ajouter
                if (!this.isWeekendDay(conge.year, this.monthToNumber(conge.month), i)) {
                  tableData.push({
                   
                    year: conge.year,
                    month: conge.month,
                    day: i,
                    nbHeure: '',
                    nbTotal: '',
                    projectTotal: ''
                  });
                }
              }
            }
    
            // Extraire les champs day, year, month et nombreHeures du congé
            const { day, year, month, nombreHeures } = conge;
    
            // Parcourir les éléments du tableau correspondant
            tableData.forEach((element, index) => {
              // Vérifier si les champs day, month et year correspondent
              if (element.day === day && element.month === month && element.year === year) {
                // Stocker la valeur de nombreHeures dans le champ nbheure de l'indice correspondant
                if (nombreHeures <= 8) {
                  tableData[index].nbHeure = nombreHeures;
                } else {
                  // Mettre 8 heures pour ce jour
                  tableData[index].nbHeure = 8;
                  // Déclarer remainingHours comme une variable modifiable
                  let remainingHours = nombreHeures - 8;
                  // Trouver le jour suivant dans le tableau et ajouter les heures restantes
                  let nextDayIndex = index + 1;
                  while (remainingHours > 0 && nextDayIndex < tableData.length) {
                    const availableHours = Math.min(remainingHours, 8); // Maximum de 8 heures par jour
                    tableData[nextDayIndex].nbHeure += availableHours;
                    remainingHours -= availableHours;
                    nextDayIndex++;
                  }
                }
              }
            });
    
            console.log(`Tableau "${tableName}" mis à jour:`, tableData);
    
            // Mettre à jour le document avec les nouvelles données
            await updateDoc(doc.ref, { [tableName]: tableData });
    
            console.log(`Document "${documentName}" mis à jour avec succès.`);
            break; // Sortir de la boucle une fois le document trouvé
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la validation du congé:', error);
    }
  }    



  async refuserConge(conge: any): Promise<void> {
    const firestore = getFirestore();
    const congDocRef = doc(firestore, 'conge123', conge.id);

    try {
      const { value: commentaire } = await Swal.fire({
        title: this.translocoService.translate('features.conge.enter_comment'),
        input: 'textarea',
        inputPlaceholder: 'Ajouter un commentaire ',
        showCancelButton: true,
        confirmButtonText: this.translocoService.translate('common.confirm'),
        cancelButtonText: this.translocoService.translate('common.cancel')
      });

      // Vérifier si un commentaire a été saisi
      if (commentaire == '' || commentaire) {
        const { isConfirmed } = await Swal.fire({
          title: this.translocoService.translate('features.conge.reject_confirm'),
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: this.translocoService.translate('common.confirm'),
          cancelButtonText: this.translocoService.translate('common.cancel')
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
    await Swal.fire({
      title: this.translocoService.translate('common.success'),
      text: message,
      icon: 'success',
      confirmButtonText: this.translocoService.translate('common.close'), // Texte du bouton de confirmation

    });
  }

  async showRefuseAlert(message: string): Promise<void> {
    await Swal.fire({
      title: this.translocoService.translate('common.error'),
      text: message,
      icon: 'error',
      confirmButtonText: this.translocoService.translate('common.close'), // Texte du bouton de confirmation

    });
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
  async Congerefuser(conge: any) {
    // Utiliser SweetAlert2 pour afficher le commentaire
    Swal.fire({
      text: conge.commentaire,
      icon: 'warning',
      showConfirmButton: false,
    });

  }
}
