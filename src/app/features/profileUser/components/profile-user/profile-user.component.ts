import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from 'src/app/features/sign-in/services/auth.service';
import { DatePipe } from '@angular/common';
import * as ApexCharts from 'apexcharts';
import { ProjectService } from './../../../projects/services/projects.service';
import { ActivatedRoute } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { ProfilService } from '../../services/profile.service';
import { CongeService } from 'src/app/features/conges/services/conge.service';
import { ca } from 'date-fns/locale';
import { TranslocoService } from '@ngneat/transloco';



@Component({
  selector: 'app-profile-user',
  templateUrl: './profile-user.component.html',
  styleUrls: ['./profile-user.component.scss'],
  providers: [DatePipe]
})
export class ProfileUserComponent implements OnInit, AfterViewInit {
  @ViewChild('chart') chartElement: ElementRef;
  profileForm: FormGroup;
  profileImage: string | ArrayBuffer | null = null;
  loadingProfile: boolean = false;
  selectedDate: Date | null = null;
  typeContrat: string | null = null;
  userId: string | null = null;
  chartOptions: any;
  currentYear: number;
  chart: ApexCharts | null = null;
  projects: any[] = []; // Variable pour stocker les projets
  totalHours: { [projectId: string]: number } = {}; // To store total hours for each project
  role: string | null = null;
  IsAdmin: boolean;
  isEditing: boolean = false;
  congesUtilisateurConnecte: any[] = [];
  private readonly transloco = inject(TranslocoService);
  showPopup = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private profilService: ProfilService,
    private datePipe: DatePipe,
    private projectService: ProjectService,
    private route: ActivatedRoute, // Ajoutez cette ligne
    private fireStorage: AngularFireStorage,
    private congeService: CongeService

  ) {
    // Vérifier si l'utilisateur est un administrateur
    this.projectService.checkUserAccess().then(li => {
      this.IsAdmin = li
    })
    // Initialiser l'année actuelle
    this.currentYear = this.getCurrentYear();
    //initialiser les options du graphique
    this.chartOptions = {
      series: [
        {
          name: "My-series",
          data: [0]
        }
      ],
      chart: {
        height: 340,
        width: 650,
        type: "bar",
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            speed: 300
          }
        }
      },
      colors: ['#193F77', '#E50060'],
      title: {
        text: `Statistique des projets pour ${this.currentYear.toString()}`,
        style: {
          color: '#E50060',
          margin: '20px 0'
        }
      },

      xaxis: {
        categories: [],// Initialiser sans catégories
        labels: {
          style: {
            fontSize: '10px',
            fontFamily: 'Arial',
            fontWeight: 'bold',
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '10px',
            fontFamily: 'Arial',
            fontWeight: 'bold',
          }
        }
      }
    };
  }

  ngOnInit(): void {

    // Récupérer l'ID de l'utilisateur à partir des paramètres de la route
    this.route.paramMap.subscribe(params => {
      const userId = params.get('id');
      if (userId) {
        this.userId = userId;
        this.loadUserProfileById(userId);
      } else {
        const userId = this.authService.getCurrentUserId();
        this.userId = userId;
        this.loadUserProfileById(userId!);
      }
    });

    this.profileForm = this.fb.group({
      name: [''],
      Email: [''],
      dateOfBirth: [''],
      phone: [''],
      role: [''],
      typeContrat: [''],
      dateEmbauche: [''],
      poste: [''],
      conge: [''],
      maladie: [''],
      photoURL: [''],

    });
    this.fetchConges();
  }
  //fonction pour initialiser le graphique après la vue
  ngAfterViewInit(): void {
    this.initializeChart();
  }
  //fonction pour recuperer le role de l'utilisateur
  etUserRole(): void {
    if (!this.userId) {
      console.error('User ID is null or undefined.');
      return;
    }
    this.loadingProfile = true;
    this.profilService.getUserRole(this.userId).then(role => {
      this.role = role; // Affecter la valeur du rôle récupérée à la variable du composant
    }).catch(error => {
      console.error('Error fetching ', error);
    }).finally(() => {
      this.loadingProfile = false;
    });
  }

  //fonction pour initialiser le graphique
  initializeChart(): void {
    if (this.chartElement) {
      this.chart = new ApexCharts(this.chartElement.nativeElement, this.chartOptions);
      this.chart.render();
    } else {
      console.error('Chart element is not available.');
    }
  }

  //fonction pour mettre à jour le graphique
  renderChart(): void {
    if (this.chart) {
      this.chart.updateOptions(this.chartOptions);
    } else {
      console.error('Chart instance is not available.');
    }
  }

  //fonction pour calculer le nombre d'heures total pour chaque projet
  calculateTotalHours(projectData: any, projectId: string): number {
    const currentYear = this.currentYear; // Utiliser l'année actuelle du composant
    let totalHours = 0;
    // Iterate through each month in the current year
    for (let month = 1; month <= 12; month++) {
      const monthKey = `${this.getMonthName(month)}_${currentYear}`;
      if (projectData[monthKey]) {
        projectData[monthKey].forEach((day: any) => {
          // Ensure nbHeure is a number
          const hours = Number(day.nbHeure);
          if (!isNaN(hours)) {
            totalHours += hours;
          }
        });
      }
    }
    this.totalHours[projectId] = totalHours;

    // Update the chart with the new data
    this.updateChartData();
    return totalHours;

  }

  //fonction pour mettre à jour les données du graphique
  updateChartData(): void {
    const currentYear = this.currentYear; // Utiliser l'année actuelle du composant
    const seriesData: number[] = [];

    // Recalculer les données pour chaque projet en fonction de l'année actuelle
    this.projects.forEach(projectId => {
      seriesData.push(this.totalHours[projectId] || 0); // Ajouter les heures pour chaque projet
    });

    this.chartOptions.series = [{ name: 'Total Hours', data: seriesData }];
    this.renderChart();
  }

  //fonction pour recuperer le nom du mois
  getMonthName(monthNumber: number): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[monthNumber - 1];
  }

  //fonction pour sauvegarder le profil de l'utilisateur
  saveProfile(): void {
    const userId = this.userId; // Utiliser l'ID de l'utilisateur chargé

    if (!userId) {
      console.error('User ID is null or undefined.');
      return;
    }
    if (this.profileForm.valid && userId) {
      const profileData = {
        displayName: this.profileForm.value.name,
        email: this.profileForm.value.Email,
        dateOfBirth: this.profileForm.value.dateOfBirth,
        phoneNumber: this.profileForm.value.phone,
        contratType: this.profileForm.value.typeContrat,
        dateEmbauche: this.profileForm.value.dateEmbauche,
        poste: this.profileForm.value.poste,
        conge: this.profileForm.value.conge,
        maladie: this.profileForm.value.maladie,
        photoURL: this.profileForm.value.photoURL
      };

      this.profilService.updateUserProfile(userId, profileData).then(() => {
        this.isEditing = false;
      }).catch(error => {
        console.error('Error updating profile:', error);
      });
    }
  }

  //fonction pour insérer une image dans le profil de l'utilisateur
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    //const userId = this.authService.getCurrentUserId();

    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = async () => {
        // Upload de l'image dans Firebase Storage
        const path = `profile_images/${this.userId}/${file.name}`; // Chemin de stockage dans Firebase Storage
        const uploadTask = this.fireStorage.upload(path, file);

        try {
          await uploadTask.snapshotChanges().toPromise(); // Attendre que l'upload soit terminé
          const downloadURL = await this.fireStorage.ref(path).getDownloadURL().toPromise(); // Obtenir l'URL de téléchargement
          this.profileImage = downloadURL; // Mettre à jour l'URL de l'image de profil dans le composant
          this.profileForm.patchValue({ photoURL: downloadURL }); // Mettre à jour l'URL de l'image de profil dans le formulaire
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  }
  //fonction pour incrementer l'année
  incrementYear(): void {
    this.currentYear++;
    this.updateChartTitle();
  }
  //fonction pour décrementer l'année
  decrementYear(): void {
    this.currentYear--;
    this.updateChartTitle();
  }

  //fonction pour recuperer l'année actuelle
  getCurrentYear(): number {
    const currentYear = new Date().getFullYear();
    return currentYear;
  }

  //fonction pour mettre à jour le titre du graphique
  updateChartTitle(): void {
    if (this.chart) {
      this.chartOptions.title.text = this.currentYear.toString();
      this.chart.updateOptions(this.chartOptions);
      this.updateChartData(); // Appeler la méthode pour recalculer et mettre à jour les données du graphique
    }
  }


  //fonction pour charger le profil de l'utilisateur selon l'ID
  loadUserProfileById(userId: string): void {
    if (!userId) {
      console.error('User ID is null or undefined.');
      return;
    }
    this.loadingProfile = true;
    this.profilService.getUserProfile(userId).then(profileData => {
      if (profileData) {
        let dateEmbaucheFormatted = '';

        if (typeof profileData.dateEmbauche === 'string') {
          dateEmbaucheFormatted = this.datePipe.transform(profileData.dateEmbauche, 'dd MMMM yyyy') || '';
        }

        this.profileForm.patchValue({
          name: profileData.displayName || '',
          Email: profileData.email || '',
          dateOfBirth: profileData.dateOfBirth || null,
          phone: profileData.phoneNumber || '',
          typeContrat: profileData.contratType || '',
          dateEmbauche: profileData.dateEmbauche || null,
          poste: profileData.poste || '',
          conge: profileData.conge || '',
          maladie: profileData.maladie || '',
          photoURL: profileData.photoURL || '',
          this: profileData.role || '',
        });
        this.profileImage = profileData.photoURL || null;

        // Appel de la fonction pour récupérer le rôle de l'utilisateur
        this.profilService.getUserRole(userId).then(role => {
          this.role = role; // Affecter la valeur du rôle récupérée à la variable du composant
        }).catch(error => {
          console.error('Error fetching ', error);
        });
      }
    }).catch(error => {
      console.error('Error loading user profile:', error);
    }).finally(() => {
      this.loadingProfile = false;
    });

    // Appel de la fonction getProjects
    this.profilService.getProjects(userId).then(projectIds => {
      this.projects = projectIds; // Assigner les IDs des projets à la variable de composant
      const projectNames: string[] = []; // Temporary array to store project names

      const projectDetailsPromises = projectIds.map(projectId => {
        this.profilService.getProjectDetails(userId, projectId).then(projectData => {
          if (projectData && projectData.name) {
            projectNames.push(projectData.name); // Add project name to the array
            this.calculateTotalHours(projectData, projectId);
          }
        }).catch(error => {
          console.error(`Error fetching details for project ID`, error);
        });


      });
      Promise.all(projectDetailsPromises).then(() => {
        this.chartOptions.xaxis.categories = projectNames; // Update chart categories with project names
        this.renderChart(); // Render the chart with updated categories
      });
    }).catch(error => {
      console.error('Error fetching projects:', error);
    });
    this.getcongePaye(userId);
    this.getcongeMaladie(userId);
  }

  //fonction pour activer le mode d'édition
  enterEditMode(): void {
    this.isEditing = true;
  }

  //recuperer les conges maladie de l'utilisateur via le firestore
  getcongeMaladie(userId: string): void {
    if (!userId) {
      console.error('User ID is null or undefined.');
      return;
    }
    let remainingHours = 0; // Définir le nombre total d'heures de congé de maladie par défaut

    // Récupérer les projets associés à l'utilisateur
    this.profilService.getProjects(userId).then(projectIds => {
      const maladieProjectId = projectIds.find(projectId => projectId === 'Maladie');
      if (maladieProjectId) {
        this.profilService.getProjectDetails(userId, maladieProjectId).then(projectData => {
          if (projectData) {
            // Calculer le total des heures du congé de maladie pour ce projet
            const totalHours = this.calculateTotalHours(projectData, maladieProjectId);
            remainingHours = 64 - totalHours; // Calcul du nombre d'heures restantes

            // Convertir les heures restantes en jours et heures
            const remainingHoursText = this.profilService.convertToDaysAndHours(remainingHours);

            // Mettre à jour le champ maladie dans le formulaire
            this.profileForm.patchValue({ maladie: remainingHoursText });
          }
        }).catch(error => {
          console.error(`Error fetching details for project ID ${maladieProjectId}:`, error);
        });
      }
    }).catch(error => {
      console.error('Error fetching projects:', error);
    });
  }

  //recuperer les conges payes de l'utilisateur
  getcongePaye(userId: string): void {
    if (!userId) {
      console.error('User ID is null or undefined.');
      return;
    }

    let remainingHours = 0; // Définir le nombre total d'heures de congé de maladie par défaut

    // Récupérer les projets associés à l'utilisateur
    this.profilService.getProjects(userId).then(projectIds => {
      const vacancesProjectId = projectIds.find(projectId => projectId === 'Vacances');
      if (vacancesProjectId) {
        this.profilService.getProjectDetails(userId, vacancesProjectId).then(projectData => {
          if (projectData) {
            // Calculer le total des heures du congé de maladie pour ce projet
            const totalHours = this.calculateTotalHours(projectData, vacancesProjectId);


            remainingHours = 176 - totalHours;
            // Convertir les heures restantes en jours et heures
            const remainingHoursText = this.profilService.convertToDaysAndHours(remainingHours);
            // Mettre à jour le champ maladie dans le formulaire
            this.profileForm.patchValue({ conge: remainingHoursText });
          }
        }).catch(error => {
          console.error(`Error fetching details for project ID ${vacancesProjectId}:`, error);
        });
      }
    }).catch(error => {
      console.error('Error fetching projects:', error);
    });
  }


  async fetchConges(): Promise<void> {
    try {
      if (!this.userId) {
        console.error('User ID is null or undefined.');
        return;
      }

      const conges = await this.congeService.getAllConges(); // Récupérer tous les congés
      this.congesUtilisateurConnecte = conges
        .filter(conge => conge.userId === this.userId)
        .map(conge => ({
          ...conge,
          dateDebut: conge.dateDebut.toDate(), // Conversion du timestamp en Date
          dateFin: conge.dateFin.toDate() // Conversion du timestamp en Date
        }));

    } catch (error) {
      console.error('Error fetching congés:', error);
    }
  }

  openPopup(): void {
    this.fetchConges(); // Appeler la méthode pour récupérer les congés
    this.showPopup = true; // Activer l'affichage de la popup
  }

  closePopup(): void {
    this.showPopup = false;
  }
  getStatusLabel(status: number): string {
    switch (status) {
      case 1:
        return this.transloco.translate('features.liste_conge.approved');
      case 0:
        return this.transloco.translate('features.liste_conge.awaiting');
      case 2:
        return this.transloco.translate('features.liste_conge.rejected');
      default:
        return '';
    }
  }
  async onAnnulerConger(conge: any) {
    console.log('Annulation du congé :', conge);
    try {
      await this.congeService.anulerConger(conge);
      this.fetchConges();
    } catch (error) {
      console.error('Erreur lors de l\'annulation du congé :', error);
    }
  }

}


