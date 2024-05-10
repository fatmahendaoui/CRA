import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CongeService } from '../../services/conge.service';
import { getFirestore, collection,query, getDocs, doc, updateDoc,DocumentData,where,getDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-detailsconge',
  templateUrl: './detailsconge.component.html',
  styleUrls: ['./detailsconge.component.css']
})
export class DetailscongeComponent implements OnInit {
  congId: string | null;
  congeDetails: any;
  selectedCongeId: string | null; // Ajoutez selectedCongeId ici
  

  constructor(private route: ActivatedRoute, private router: Router, private congeService: CongeService,private translocoService: TranslocoService,) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.congId = params.get('id');
      console.log('ID du congé récupéré :', this.congId); 

      if (this.congId) {
        this.congeService.getCongeById(this.congId).then(conge => {
          this.congeDetails = { id: this.congId, ...conge }; 
          console.log('Détails du congé récupérés :', this.congeDetails);
        }).catch(error => {
          console.error('Erreur lors de la récupération des détails du congé :', error);
        });
      }
    });
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


  async validerConge(): Promise<void> {
    // Vérifiez si les détails du congé sont définis
    if (!this.congeDetails) {
      console.error('Détails du congé non définis.');
      return;
    }
    
    const conge = this.congeDetails; // Récupérer les détails du congé
  
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


        // Appel de la méthode sendEmailToUser avec l'ID du congé
        await this.sendEmailToUser(conge.id);

        // Mettre à jour les congés filtrés pour retirer le congé approuvé
        
    
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
            const nexttablename=conge.dateF;
    
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
            
            console.log("Valeur de day :", day);
            console.log("Valeur de year :", year);
            console.log("Valeur de month :", month);
            console.log("Valeur de nombreHeures :", nombreHeures);
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
                  
            
                  if (remainingHours > 0) {
                    let remainingHoursToStore = remainingHours; // Stocker les heures restantes dans une variable
                  
                    // Entrer dans le tableau suivant (nexttableName) pour ajouter les heures restantes
                    let tableData = doc.data()[nexttablename];
                    console.log("tableData:", tableData); 
                    if (!tableData) {
                      tableData = [];
                    
                      for (let i = 1; i <= 31; i++) {
                        // Vérifiez si le jour est un jour de week-end ou un jour férié avant de l'ajouter
                        if (!this.isWeekendDay(conge.year, this.monthToNumber(conge.nextMonth), i)) {
                          tableData.push({
                            year: conge.year,
                            month: conge.nextMonth,
                            day: i,
                            nbHeure: '',
                            nbTotal: '',
                            projectTotal: ''
                          });
                        }
                      }
                    }
                    if (tableData && tableData.length > 0) {
                      if (remainingHoursToStore <= 8) {
                        // S'il reste moins de 8 heures, ajoutez-les simplement au premier index
                        console.log("Ajout de", remainingHoursToStore, "heures au premier index du tableau.");
                        tableData[0].nbHeure += remainingHoursToStore;
                        remainingHoursToStore = 0; // Aucune heure restante à stocker
                      } else {
                        // Ajouter 8 heures au premier index
                        console.log("Ajout de 8 heures au premier index du tableau.");
                        tableData[0].nbHeure += 8;
                        remainingHoursToStore -= 8; // Réduire les heures restantes
                      }
                        doc.data()[nexttablename] = tableData;
                         
                    }
                    
                  
                    // Si remainingHoursToStore est toujours supérieur à 0,
                    // cela signifie qu'il reste encore des heures à ajouter au tableau suivant
                    if (remainingHoursToStore > 0) {
                      let currentIndex = 1; // Commencer par le deuxième index du tableau
                      while (remainingHoursToStore > 0 && currentIndex < tableData.length) {
                        const availableHours = Math.min(remainingHoursToStore, 8); // Maximum de 8 heures par jour
                        tableData[currentIndex].nbHeure += availableHours;
                        remainingHoursToStore -= availableHours;
                        currentIndex++;
                      }
                      updateDoc(doc.ref, { [nexttablename]: tableData });
                      
                    }
                    

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


  async sendEmailToUser(congeId: string) {
    try {
      const congeDocRef = doc(getFirestore(), 'conge123', congeId);
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
  
  async showSuccessAlert(message: string): Promise<void> {
    await Swal.fire({
      title: this.translocoService.translate('common.success'),
      text: message,
      icon: 'success',
      confirmButtonText: this.translocoService.translate('common.close'), // Texte du bouton de confirmation

    });
  }

  async refuserConge(): Promise<void> {
    // Vérifiez si les détails du congé sont définis
    if (!this.congeDetails) {
      console.error('Détails du congé non définis.');
      return;
    }
    
    const conge = this.congeDetails; // Récupérer les détails du congé
  
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
  
          // Appel de la méthode sendEmailToUser avec l'ID du congé
          await this.sendEmailToUser(conge.id);
          // Mettre à jour les congés filtrés pour retirer le congé refusé
          
        }
      }
    } catch (error) {
      console.error('Erreur lors du refus du congé:', error);
      this.showRefuseAlert('Erreur lors du refus du congé');
    }
  }
  
  showRefuseAlert(arg0: string) {
    throw new Error('Method not implemented.');
  }
}


