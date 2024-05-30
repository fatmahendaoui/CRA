import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from 'src/app/features/sign-in/services/auth.service';
import { ProfilService } from '../../services/profile.service';
import { DatePipe } from '@angular/common';
import * as ApexCharts from 'apexcharts';

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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private profilService: ProfilService,
    private datePipe: DatePipe
  ) {
    this.currentYear = this.getCurrentYear();

    this.chartOptions = {
      series: [
        {
          name: "My-series",
          data: [10, 41, 35, 51]
        }
      ],
      chart: {
        height: 350,
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
      title: {
        text: `Statistique des projets pour ${this.currentYear.toString()}`
    },
    
      xaxis: {
        categories: [] ,// Initialiser sans catégories
      }
    };
  }

  ngOnInit(): void {
  
   
    console.log('Role:', this.role);
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

    this.userId = this.authService.getCurrentUserId();

    if (this.userId) {
      this.loadingProfile = true;
      this.profilService.getUserProfile(this.userId).then(profileData => {
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
                this.profilService.getUserRole(this.userId!).then(role => {
                    console.log('User role:', role);
                    this.role = role; // Affecter la valeur du rôle récupérée à la variable du composant
                }).catch(error => {
                    console.error('Error fetching user role:', error);
                });
            }
        }).catch(error => {
            console.error('Error loading user profile:', error);
        }).finally(() => {
            this.loadingProfile = false;
        });
      // Appel de la fonction getProjects
      this.profilService.getProjects(this.userId).then(projectIds => {
        console.log('Project IDs fetched:', projectIds); // Affichage des IDs des projets
        this.projects = projectIds; // Assigner les IDs des projets à la variable de composant

        // Mettre à jour les catégories de l'axe x
        this.chartOptions.xaxis.categories = projectIds;

        // Mettre à jour le graphique
        this.renderChart();

        projectIds.forEach(projectId => {
          this.profilService.getProjectDetails(this.userId!, projectId).then(projectData => {
            if (projectData) {
             // console.log(`Project Data for ID ${projectId}:`, projectData);
              this.calculateTotalHours(projectData, projectId);
            }
          }).catch(error => {
            console.error(`Error fetching details for project ID ${projectId}:`, error);
          });
        });
      }).catch(error => {
        console.error('Error fetching projects:', error);
      });
    }
  }

  ngAfterViewInit(): void {
    this.initializeChart();
  }
  etUserRole(): void {
    if (!this.userId) {
      console.error('User ID is null or undefined.');
      return;
    }

    this.loadingProfile = true;
    this.profilService.getUserRole(this.userId).then(role => {
      console.log('User role:', role);
      this.role = role; // Affecter la valeur du rôle récupérée à la variable du composant
    }).catch(error => {
      console.error('Error fetching user role:', error);
    }).finally(() => {
      this.loadingProfile = false;
    });
  }
  initializeChart(): void {
    if (this.chartElement) {
      this.chart = new ApexCharts(this.chartElement.nativeElement, this.chartOptions);
      this.chart.render();
    } else {
      console.error('Chart element is not available.');
    }
  }

  renderChart(): void {
    if (this.chart) {
      this.chart.updateOptions(this.chartOptions);
    } else {
      console.error('Chart instance is not available.');
    }
  }

  calculateTotalHours(projectData: any, projectId: string): void {
    const currentYear = this.currentYear; // Utiliser l'année actuelle du composant
    
    let totalHours = 0;
  
    // Iterate through each month in the current year
    for (let month = 1; month <= 12; month++) {
      const monthKey = `${this.getMonthName(month)}_${currentYear}`;
     // console.log(`Checking month: ${monthKey}`);
  
      if (projectData[monthKey]) {
        projectData[monthKey].forEach((day: any) => {
          // Ensure nbHeure is a number
          const hours = Number(day.nbHeure);
          if (!isNaN(hours)) {
          //  console.log(`Before adding: ${totalHours}`);
            totalHours += hours;
            //console.log(`Adding ${hours} hours for ${monthKey}`);
            //console.log(`After adding: ${totalHours}`);
          } else {
           // console.log(`Invalid nbHeure value for ${monthKey}: ${day.nbHeure}`);
          }
        });
      } else {
//console.log(`No data for month: ${monthKey}`);
      }
    }
  
    this.totalHours[projectId] = totalHours;
   // console.log(`Total hours for project ${projectId} in ${currentYear}: ${totalHours}`);
  
    // Update the chart with the new data
    this.updateChartData();
  }
 
  
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
  getMonthName(monthNumber: number): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[monthNumber - 1];
  }

  saveProfile(): void {
    if (!this.userId) {
      console.error('User ID is null or undefined.');
      return;
    }

    if (this.profileForm.valid) {
      const profileData = {
        displayName: this.profileForm.value.name,
        email: this.profileForm.value.Email,
        dateOfBirth: this.profileForm.value.dateOfBirth,
        phoneNumber: this.profileForm.value.phone,
        contratType: this.profileForm.value.typeContrat,
        dateEmbauche: this.profileForm.value.dateEmbauche,
        poste: this.profileForm.value.poste,
        conge: this.profileForm.value.conge,
        maladie: this.profileForm.value.maladie
      };

      this.profilService.updateUserProfile(this.userId, profileData).then(() => {
        console.log('Profile updated successfully');
      }).catch(error => {
        console.error('Error updating profile:', error);
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = e => this.profileImage = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

 

  incrementYear(): void {
    this.currentYear++;
    console.log('Year incremented. Current year:', this.currentYear);
    
    this.updateChartTitle();
    
  }
  
  decrementYear(): void {
    this.currentYear--;
    console.log('Year decremented. Current year:', this.currentYear);
    this.updateChartTitle();
  }

  getCurrentYear(): number {
    const currentYear = new Date().getFullYear();
    console.log('Current year:', currentYear); // Ajouter une console log
    return currentYear;
  }


  updateChartTitle(): void {
    if (this.chart) {
      console.log('Updating chart title for year:', this.currentYear);
      this.chartOptions.title.text = this.currentYear.toString();
      this.chart.updateOptions(this.chartOptions);
      this.updateChartData(); // Appeler la méthode pour recalculer et mettre à jour les données du graphique
    } else {
      console.log('Chart not found. Cannot update title.');
    }
  }
  
  getCongesPercentage(conge: string): string {
    const congeInHours = parseInt(conge, 10); // Supposons que `conge` est une chaîne contenant des heures
    const TOTAL_CONGE_HOURS = 176;
    if (isNaN(congeInHours)) {
      return 'N/A';
    }
    const percentage = ((congeInHours / TOTAL_CONGE_HOURS) * 100).toFixed(2);
    return `${percentage}%`;
  
  }
  
}
