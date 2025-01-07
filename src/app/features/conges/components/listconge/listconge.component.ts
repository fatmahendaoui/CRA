import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { getFirestore, collection, query, getDocs, doc, updateDoc, DocumentData, where } from 'firebase/firestore';
import { DateService } from 'src/app/features/timesheet/services/date.service';
import Swal from 'sweetalert2';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { differenceInDays } from 'date-fns';
import { MatTooltip } from '@angular/material/tooltip';
import { ProfileService } from 'src/app/services/profile.service';
import { Auth } from '@angular/fire/auth';
import { CongeService } from '../../services/conge.service';
import { getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-listconge',
  templateUrl: './listconge.component.html',
  styleUrls: ['./listconge.component.scss']
})
export class ListcongeComponent<T> implements OnInit {
  conges: any[] = [];
  filteredConges: any[] = []; // Tableau pour les congés filtrés
  selectedStatus: string = 'awaiting'; // Par défaut, tous les congés sont affichés
  displayedColumns: string[] = ['photo', 'dateDebut', 'nature', 'duree', 'comment', 'status', 'actions'];
  profileImage: string | ArrayBuffer | null = null;

  public dataSource: MatTableDataSource<T>;
  @ViewChild(MatPaginator, { static: true })
  public paginator: MatPaginator;
  @Input() data: any;
  /*++++++*/

  constructor(private translocoService: TranslocoService, private profileService: ProfileService
    , private auth: Auth, private congeService: CongeService
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
    const congesCollectionRef = collection(firestore, 'conge');
    try {
      const querySnapshot = await getDocs(congesCollectionRef);
      querySnapshot.forEach(async (doc) => {
        const data = doc.data() as { [key: string]: any, status: number };

        this.getUserDomain().then(async (iddomain) => {
          if (data['domainId'] === iddomain) { // Vérifier la correspondance des domaines
            // Convertir la date de début en objet Date
            const dateDebutTimestamp = data['dateDebut'].toDate();
            const dateDebutFormatted = dateDebutTimestamp.toLocaleDateString(); // ou toLocaleString()

            // Convertir la date de fin en objet Date
            const dateFinTimestamp = data['dateFin'].toDate();
            const dateFinFormatted = dateFinTimestamp.toLocaleDateString(); // ou toLocaleString()
            const userId = data['userId'];
            const photoURL = await this.getUserPhoto(data['userId']);
            // Ajouter le congé avec les dates converties
            this.conges.push({
              id: doc.id,
              ...data,
              dateDebutFormatted: dateDebutFormatted,
              dateFinFormatted: dateFinFormatted,
              statusLabel: this.getStatusLabel(data.status),
              photoURL: photoURL
            });
            /* this.profileService.getUserPhotoURL(this.conges.uid).then(photoURL => {
               this.profileImage = photoURL;
             }).catch(error => {
               console.error('Error fetching profile photo URL:', error);
               this.profileImage = null; // Or handle the error as appropriate
             });*/
            // Copier les congés dans filteredConges pour afficher tous les congés au début
            this.filterByStatus(this.selectedStatus);
          }
        });
      });

    } catch (error) {
      console.error('Erreur lors du chargement des congés depuis Firestore:', error);
    }
  }

  async getUserPhoto(userId: string): Promise<string | null> {
    try {
      const photoURL = await this.profileService.getUserPhotoURL(userId);
      return photoURL;
    } catch (error) {
      console.error('Error fetching user photo:', error);
      return null;
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

  async validerConge(conge: any, numberOfDays: number): Promise<void> {
    const firestore = getFirestore();
    const congDocRef = doc(firestore, 'conge', conge.id);
    console.log("congee ::: ", conge);
  
    try {
      const { isConfirmed } = await Swal.fire({
        title: this.translocoService.translate('features.conge.validate_confirm'),
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: this.translocoService.translate('common.confirm'),
        cancelButtonText: this.translocoService.translate('common.cancel')
      });
  
      if (isConfirmed) {
        // Mise à jour de l'état du congé dans Firestore
        await updateDoc(congDocRef, { status: 1 });
        this.showSuccessAlert('Congé accepté');
        conge.status = 1;
        conge.statusLabel = 'Approuvé';
  
        // Envoi de l'email à l'utilisateur
        await this.sendEmailToUser(conge.id);
  
        // Mise à jour de la liste des congés filtrés
        this.filteredConges = this.filteredConges.filter(c => c.id !== conge.id);
        this.dataSource.data = this.filteredConges;
  
        // Récupération des informations de l'utilisateur
        const userId = conge.userId;
        const natureConge = conge.nature;
  
        // Définition du nom du document en fonction du type de congé
        const documentName = natureConge === 'Congé de maladie (1 jour)' ? 'Maladie' : 'Vacances';
        const projectsCollectionRef = collection(firestore, `membership_CRA/${userId}/Projects`);
        const projectsQuery = query(projectsCollectionRef);
        const projectsSnapshot = await getDocs(projectsQuery);
  
        for (const doc of projectsSnapshot.docs) {
          console.log("doc.id ::: ", doc.id, "documentName ::: ", documentName);
          if (doc.id === documentName) {
  
            // Accès aux tableaux du mois
            const tableName = conge.date;
            const nexttablename = conge.dateF;
            let tableData = doc.data()[tableName] || [];
  
            // Si le tableau n'existe pas, le créer
            if (tableData.length === 0) {
              for (let i = 1; i <= 31; i++) {
                if (!this.isWeekendDay(conge.year, this.monthToNumber(conge.month), i)) {
                  tableData.push({
                    year: conge.year,
                    month: conge.month,
                    day: i,
                    nbHeure: 0,
                    nbTotal: 0,
                    projectTotal: 0
                  });
                }
              }
            }
  
            // Traitement des heures du congé
            const { day, year, month, nombreHeures } = conge;
  
            let remainingHours = nombreHeures;
            tableData.forEach((element, index) => {
              if (element.day === day && element.month === month && element.year === year) {
                // Assigner les heures de congé pour ce jour
                element.nbHeure += Math.min(remainingHours, 8);
                remainingHours -= Math.min(remainingHours, 8);
              }
            });
  
            // Si des heures restent à affecter sur d'autres jours
            if (remainingHours > 0) {
              let nextDayIndex = tableData.findIndex(e => e.day === day + 1);
              while (remainingHours > 0 && nextDayIndex < tableData.length) {
                const availableHours = Math.min(remainingHours, 8);
                tableData[nextDayIndex].nbHeure += availableHours;
                remainingHours -= availableHours;
                nextDayIndex++;
              }
            }
  
            // Mise à jour des données du tableau dans Firestore
            await updateDoc(doc.ref, { [tableName]: tableData });
  
            // Gestion du tableau suivant (nexttablename)
            if (remainingHours > 0) {
              let nextTableData = doc.data()[nexttablename] || [];
              if (nextTableData.length === 0) {
                for (let i = 1; i <= 31; i++) {
                  if (!this.isWeekendDay(conge.year, this.monthToNumber(conge.nextMonth), i)) {
                    nextTableData.push({
                      year: conge.year,
                      month: conge.nextMonth,
                      day: i,
                      nbHeure: 0,
                      nbTotal: 0,
                      projectTotal: 0
                    });
                  }
                }
              }
              nextTableData[0].nbHeure += remainingHours;
              await updateDoc(doc.ref, { [nexttablename]: nextTableData });
            }
  
            break;
          }
        }
  
        // Mise à jour des heures de congé dans le document utilisateur
        const userDocRef = doc(firestore, `membership_CRA/${userId}`);
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          let fieldToUpdate = natureConge === 'Congé de maladie (1 jour)' ? 'maladie' : 'conge';
          let updatedHours = userData[fieldToUpdate] - conge.nombreHeures;
          updatedHours = Math.max(0, updatedHours);  // Assurer que l'heure est positive
          await updateDoc(userDocRef, { [fieldToUpdate]: updatedHours });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la validation du congé:', error);
    }
  }
  


  async refuserConge(conge: any): Promise<void> {
    const firestore = getFirestore();
    const congDocRef = doc(firestore, 'conge', conge.id);

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
          conge.status = 2;
          conge.statusLabel = 'Refusé';

          // Appel de la méthode sendEmailToUser avec l'ID du congé
          await this.sendEmailToUser(conge.id);
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

    Swal.fire({
      text: conge.commentaire,
      icon: 'warning',
      showConfirmButton: false,
    });

  }
  async sendEmailToUser(congeId: string) {
    try {
      const congeDocRef = doc(getFirestore(), 'conge', congeId);
      const congeSnapshot = await getDoc(congeDocRef);
      if (congeSnapshot.exists()) {
        const congeData = congeSnapshot.data();
        let status: string;
        let commentaire: string = ''; // Initialiser le commentaire à une chaîne vide
        if (congeData['status'] === 1) {

          status = 'accepted'; // Utiliser 'accepted' pour approuvé
        } else {
          status = 'rejected'; // Utiliser 'rejected' pour rejeté
          commentaire = congeData['commentaire'];          // Récupérer le commentaire du congé en cas de rejet
        }
        const emailData = {
          status: status,
          emailData: congeData['email'], // Supposons que l'e-mail est stocké dans un champ nommé 'email'
          nameRequest: congeData['displayName'], // Supposons que le nom du demandeur est stocké dans un champ nommé 'nomDemandeur'
          commentaire: commentaire // Passer le commentaire
        };
        await this.congeService.sendEmailToUser(emailData); // Appeler la méthode du service avec les données mises à jour
        // Affichez un message de succès ou effectuez d'autres actions nécessaires
      } else {
        console.error('Le document de congé n\'existe pas.');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
      // Gérez l'erreur de manière appropriée
    }
  }

}
