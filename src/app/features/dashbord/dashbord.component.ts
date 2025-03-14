import * as XLSX from 'xlsx'; // Pour l'export en CSV
import { saveAs } from 'file-saver'; // Pour sauvegarder les fichiers
import html2canvas from 'html2canvas'; // Pour capturer le contenu HTML en PNG
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { ProjectService } from '../projects/services/projects.service';
import { ChartComponent } from 'ng-apexcharts';
import { Months } from '../timesheet/models/dates.constants';
import { DateService } from '../timesheet/services/date.service';
import { UsersService } from '../users/services/users.service';
import { Profile } from 'src/app/models/profile.model';
import { TranslocoService } from '@ngneat/transloco';
import { CssSelector } from '@angular/compiler';
import { group, style } from '@angular/animations';
import { ProfileService } from 'src/app/services/profile.service';
import { Brand, Group, Marque, Media, Product } from '../projects/models/Project.model';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { DateAdapter } from '@angular/material/core';
import { user } from '@angular/fire/auth';

@Component({
  selector: 'app-dashbord',
  templateUrl: './dashbord.component.html',
  styleUrls: ['./dashbord.component.scss']
})
export class DashbordComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly transloco = inject(TranslocoService);
  private readonly profileService = inject(ProfileService);
  //private readonly DateService = inject(DateService);

  //@ViewChild("chart") chart: ChartComponent;

  data: any;
  /*public chartOptions: any;
  public chartOptionsuser: any;
  public chartOptionsproject: any;*/
  currentProject; currentuser;
  dataUser: any;
  dataProject: any;
  users: Profile[]
  allvalues;
  months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December', 'Total'];
  months2 = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  nameMonth: string;
  month2: number;
  year: number;
  theDate: Date;
  searchUser: string = '';
  filteredUsers: string[] = [];
  projectFilter: string = '';
  loader: boolean;
  groups: Group[] = [];
  brands: Brand[] = [];
  products: Product[] = [];
  marques: Marque[] = [];
  medias: Media[] = [];
  selectedGroup: string = '';
  selectedBrand: string = '';
  selectedProduct: string = '';
  selectedMarque: string = '';
  selectedMedia: string = '';
  showFilters: boolean = false;
  allProjects: any[] = [];
  filteredData: any[] = [];
  startDate: Date | null = null;
  endDate: Date | null = null;
  startMonthIndex = 0;
  endMonthIndex = 13;
  group: { id: string; name: string }[] = [];
  brand: { id: string; name: string }[] = [];
  product: { id: string; name: string }[] = [];
  marque: { id: string; name: string }[] = [];
  media: { id: string; name: string }[] = [];
 groupss: { id: string; name: string }[] = [];
brandss: { id: string; name: string }[] = [];
productss: { id: string; name: string }[] = [];
marquess: { id: string; name: string }[] = [];
mediass: { id: string; name: string }[] = [];
  // Dans votre composant
  showAllRows: boolean = true;

  shouldDisplayRow(project: any): boolean {
    // Si showAllRows est true, afficher toutes les lignes
    if (this.showAllRows) {
      return true;
    }
    // Sinon, filtrer les lignes avec 0h ou 0%
    return project.data.some(entry => entry.y !== 0 && entry.percentage !== '0%');
  }
  // Fonction pour formater les heures
  formatHours(value: number): string {
    if (value == 0) {
      return '0h';
    }

    // Vérifier si la valeur est un entier ou a une partie décimale
    if (value % 1 === 0) {
      // Si c'est un entier, retourner sans décimales
      return value + 'h';
    } else {
      // Si c'est un nombre décimal, retourner avec 2 décimales
      return value.toFixed(2) + 'h';
    }
  }
  // In your component's TypeScript file
  getUniqueMonths(dataProject: any[]): string[] {
    const uniqueMonths = new Set<string>();

    // Iterate through each entry in dataProject
    dataProject.forEach(entry => {
      // Iterate through each data point in the entry's data array
      entry.data.forEach(dataPoint => {
        // Add the month (x value) to the Set
        if (dataPoint.x !== 'Total') {
          uniqueMonths.add(dataPoint.x);
        }
      });
    });

    // Convert the Set to an array and return it
    return Array.from(uniqueMonths);
  }
  ngOnInit() {
    this.loadGroups(this.allvalues);
    this.filteredUsers = this.listuser;
    this.theDate = new Date();
    if (this.theDate) {
      this.month2 = this.theDate.getMonth();
      this.year = this.theDate.getFullYear();

    }
    this.listuser = [];
    // Assurez-vous que filteredUsers est également initialisé avec la liste complète des utilisateurs
    this.filteredUsers = this.listuser;
    this.getAllProjectsForAllUsers()
    //this.getallProjectwithsommeNumber();
  }
  listuser: any[] = [];
  // Date range picker
  onDateRangeChange(event: any): void {
    // Méthode appelée lorsque les dates changent
    this.startDate = event.value?.start || null;
    this.endDate = event.value?.end || null;
  }
  // Apply date range filter
  onApplyDateRange(): void {
    // Check if both start and end dates are selected
    if (this.startDate && this.endDate) {
      // Convert the selected start and end dates to a format suitable for comparison (e.g., timestamp)
      const startMonthIndex = this.startDate.getMonth();
      const endMonthIndex = this.endDate.getMonth();
      const startYear = this.startDate.getFullYear();
      const endYear = this.endDate.getFullYear();

      console.log('Start Timestamp:', startMonthIndex);
      console.log('End Timestamp:', endMonthIndex);
      console.log('Start Year:', startYear);
      console.log('End Year:', endYear);
      // Call your method to filter or fetch the projects based on the selected date range
      this.getAllProjectsForAllUserFiltDate(startMonthIndex, endMonthIndex, startYear, endYear);
      this.fetchUser(startMonthIndex, endMonthIndex, startYear, endYear);
    } else {
      console.log('Please select both start and end dates.');
    }
  }
  // Cancel date range filter
  onCancelDateRange(): void {
    this.getAllProjectsForAllUsers();
    this.fetchUser(this.startMonthIndex, this.endMonthIndex, this.year, this.year);
    // Méthode appelée lorsque les dates changent
    this.startDate = null;
    this.endDate = null;

  }

  // Filter the list of users based on the search query
  filterUsers() {
    // Filter the list of users based on the search query
    this.filteredUsers = this.listuser.filter(user =>
      user.toLowerCase().includes(this.searchUser.toLowerCase())
    );
    console.log("testttt :", this.filteredUsers)
  }
  //filter the list of projects based on the search query
  get filteredProjects(): any[] {
    return this.data.filter(project =>
      project.name.toLowerCase().includes(this.projectFilter.toLowerCase())
    );
  }

  // Fetch all projects for all users
  getAllProjectsForAllUsers() {
    this.data = null;
    let result: { name: string; data: { x: string; y: number }[] }[] = [];
    let projectUserMap: { [uniqueProjectKey: string]: { [userName: string]: number } } = {};
    let allProjects: Set<string> = new Set();
    let allUsers: Set<string> = new Set();

    this.projectService.fetchAllProjectswithuser().then((projects) => {
      this.allvalues = projects;
      // Construire la map projet-utilisateur en différenciant les projets par leur nom et ID
      projects.forEach((project) => {
        const userName = project.displayName;
        const projectName = project.name;
        const projectId = project.id;

        // Ajouter chaque utilisateur et projet unique
        allUsers.add(userName);
        const uniqueProjectKey = `${projectName} (${projectId})`;
        allProjects.add(uniqueProjectKey);

        if (!this.listuser.includes(userName)) {
          this.listuser.push(userName);
        }

        if (!projectUserMap[uniqueProjectKey]) {
          projectUserMap[uniqueProjectKey] = {};
        }

        let totalHoursForUser = 0;

        // Calculer les heures totales de l'utilisateur pour le projet
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const monthName = this.months[monthIndex];

          if (project[`${monthName}_${this.year}`]) {
            const totalHours = project[`${monthName}_${this.year}`].reduce((sum, entry) => sum + +entry.nbHeure, 0);
            totalHoursForUser += totalHours;
          }
        }

        // Ajouter les heures pour ce projet et cet utilisateur
        projectUserMap[uniqueProjectKey][userName] =
          (projectUserMap[uniqueProjectKey][userName] || 0) + totalHoursForUser;
      });

      // Créer la structure de données pour les projets
      Array.from(allProjects).forEach((uniqueProjectKey) => {
        const [projectName, projectId] = uniqueProjectKey.split(' (');
        const cleanProjectId = projectId.replace(')', '');

        let projectData: { name: string; data: { x: string; y: number }[] } = {
          name: uniqueProjectKey,
          data: [],
        };
        let projectTotalHours = 0;

        // Ajouter les données de chaque utilisateur pour chaque projet
        Array.from(allUsers).forEach((userName) => {
          const hours = projectUserMap[uniqueProjectKey]?.[userName] || 0;
          projectTotalHours += hours;
          projectData.data.push({ x: userName, y: hours });
        });

        // Ajouter la colonne "Total" pour les projets
        projectData.data.push({ x: "Total", y: projectTotalHours });

        result.push(projectData);
      });

      // Ajouter une ligne "Total" pour les utilisateurs
      let totalPerUser = Array.from(allUsers).map((userName) => {
        return result.reduce((sum, projectData) => {
          const userData = projectData.data.find((item) => item.x === userName);
          return sum + (userData ? userData.y : 0);
        }, 0);
      });

      result.unshift({
        name: "Total",
        data: Array.from(allUsers)
          .map((userName, index) => ({
            x: userName,
            y: totalPerUser[index],
          }))
          .concat({
            x: "Total",
            y: totalPerUser.reduce((sum, val) => sum + val, 0),
          }),
      });

      this.data = this.processProjects(result);

      // Calculate dynamic dimensions based on data size
      const baseWidth = 1250;
      const baseHeight = 800;
      const additionalWidthPerUser = 50;
      const additionalHeightPerProject = 30;

      const calculatedWidth = Math.max(
        baseWidth,
        allUsers.size * additionalWidthPerUser
      );
      const calculatedHeight = Math.max(
        baseHeight,
        allProjects.size * additionalHeightPerProject
      );

      // Configurer les options du graphique
      /*this.chartOptions = {
        series: this.data,
        chart: {
          height:  calculatedHeight,
          width: calculatedWidth,
          type: "heatmap",
          background: "#FFFFFF",
        },
        tooltip: {
          enabled: true,
          shared: false,
          intersect: false,
          x: {
            show: true,
            format: "dd.MM.yyyy hh:mm:ss",
          },
        },
        stroke: {
          width: 0,
        },
        colors: ["#FFFFFF", "#fec1db"],
        plotOptions: {
          heatmap: {
            colorScale: {
              ranges: [],
            },
            enableShades: false,
          },
        },
        dataLabels: {
          enabled: true,
          formatter: function (val, { seriesIndex, dataPointIndex, w }) {
                // Vérifier si c'est la ligne ou la colonne "Total"
                const isTotal = val === "Total" || seriesIndex === 0 || dataPointIndex === w.config.series[0].data.length - 1;
                // Appliquer le style en gras si c'est "Total", sinon le style normal
                w.config.dataLabels.style.fontWeight = isTotal ? 'bold' : 'normal';
                // Appliquer le style de la police uniquement pour la ligne ou la colonne "Total"
                w.config.dataLabels.style.fontFamily = isTotal ? '60px' : undefined;
            const data = w.config.series[seriesIndex].data[dataPointIndex];
            return `${val} h (${data.percentage}%)`;
          },
          style: {
            colors: ["#193F77"],
          },
        },
        xaxis: {
          type: "category",
          position: "top",
          tooltip: {
            enabled: false,
          },
          labels: {
            show: true,
            floating: true,
            style: {
              colors: "#193F77",
              fontSize: "12px",
              fontFamily: "Arial",
              fontWeight: "bold",
            },
          },
        },
        title: {
          text: this.transloco.translate("features.projects.projectByUser") + " " + this.year,
          style: {
            color: "#E50060",
            margin: "20px 0",
          },
        },
      };*/

    });
  }

  // Fetch all projects for all users selon la date
  getAllProjectsForAllUserFiltDate(startMonthIndex: number, endMonthIndex: number, startYear: number, endYear: number) {
    this.data = null;
    let result: { name: string; data: { x: string; y: number }[] }[] = [];
    let projectUserMap: { [uniqueProjectKey: string]: { [userName: string]: number } } = {};
    let allProjects: Set<string> = new Set();
    let allUsers: Set<string> = new Set();

    this.projectService.fetchAllProjectswithuser().then((projects) => {
      this.allvalues = projects;

      // Construct the project-user map
      projects.forEach((project) => {
        const userName = project.displayName;
        const projectName = project.name;
        const projectId = project.id;

        allUsers.add(userName);
        const uniqueProjectKey = `${projectName} (${projectId})`;
        allProjects.add(uniqueProjectKey);

        if (!this.listuser.includes(userName)) {
          this.listuser.push(userName);
        }

        if (!projectUserMap[uniqueProjectKey]) {
          projectUserMap[uniqueProjectKey] = {};
        }

        let totalHoursForUser = 0;

        // Loop through the months and years based on the selected range
        for (let year = startYear; year <= endYear; year++) {
          const startMonth = (year === startYear) ? startMonthIndex : 0;
          const endMonth = (year === endYear) ? endMonthIndex : 11;

          for (let monthIndex = startMonth; monthIndex <= endMonth; monthIndex++) {
            const monthName = this.months[monthIndex];

            // Ensure the project has data for the current month and year
            const projectData = project[`${monthName}_${year}`];
            if (projectData) {
              // Instead of using reduce for every entry, sum the hours here
              const totalHours = projectData.reduce((sum, entry) => sum + +entry.nbHeure, 0);
              totalHoursForUser += totalHours;
            }
          }
        }

        // Store the calculated total hours for the user in the project-user map
        projectUserMap[uniqueProjectKey][userName] =
          (projectUserMap[uniqueProjectKey][userName] || 0) + totalHoursForUser;
      });

      // Prepare the final chart data
      Array.from(allProjects).forEach((uniqueProjectKey) => {
        const [projectName, projectId] = uniqueProjectKey.split(' (');
        const cleanProjectId = projectId.replace(')', '');

        let projectData: { name: string; data: { x: string; y: number }[] } = {
          name: uniqueProjectKey,
          data: [],
        };
        let projectTotalHours = 0;

        Array.from(allUsers).forEach((userName) => {
          const hours = projectUserMap[uniqueProjectKey]?.[userName] || 0;
          projectTotalHours += hours;
          projectData.data.push({ x: userName, y: hours });
        });

        projectData.data.push({ x: "Total", y: projectTotalHours });

        result.push(projectData);
      });

      // Calculate total per user across all projects
      let totalPerUser = Array.from(allUsers).map((userName) => {
        return result.reduce((sum, projectData) => {
          const userData = projectData.data.find((item) => item.x === userName);
          return sum + (userData ? userData.y : 0);
        }, 0);
      });

      result.unshift({
        name: "Total",
        data: Array.from(allUsers)
          .map((userName, index) => ({
            x: userName,
            y: totalPerUser[index],
          }))
          .concat({
            x: "Total",
            y: totalPerUser.reduce((sum, val) => sum + val, 0),
          }),
      });

      // Process and merge project data by summing duplicate entries
      this.data = this.processProjects(result);

      // Update chart options with the processed data
     // this.chartOptions.series = this.data;

    });
  }

  // Process and merge project data by summing duplicate entries
  processProjects(projects) {
    let processedProjects: any = [];
    let projectMap: any = {};

    projects.forEach(project => {
      // Check if the projectName already exists in the map
      if (!projectMap[project.name]) {
        const projectName = project.name.split('(')[0].trim();
        projectMap[projectName] = { name: projectName, data: [] };
        processedProjects.push(projectMap[projectName]);
      }

      // Exclude specific categories (Disponible, Maladie, Congé) from total and percentages
      let filteredData = project.data;

      let totalHoursForProject = filteredData.reduce((sum, entry) => sum + entry.y, 0);

      filteredData.forEach(monthData => {
        const projectName = project.name.split('(')[0].trim();
        let existingMonthData = projectMap[projectName].data.find(data => data.x === monthData.x);
        if (existingMonthData) {
          existingMonthData.y += monthData.y;
        } else {
          const percentage = totalHoursForProject > 0 ? (monthData.y / totalHoursForProject) * 100 : 0;

          // Format percentage to show decimals only if needed
          const formattedPercentage = Number.isInteger(percentage) ? percentage.toString() : percentage.toFixed(2);

          projectMap[projectName].data.push({
            x: monthData.x,
            y: monthData.y,
            percentage: formattedPercentage,
          });
        }
      });
    });

    return processedProjects;
  }

  // Get the month and year for the previous or next month
  getYear(op: boolean): void {
    const newYear = this.year + (op ? 1 : -1);
    this.updateMonthYear(this.month2, newYear);
    this.getAllProjectsForAllUsers()
    this.fetchUser(this.startMonthIndex, this.endMonthIndex, this.year, this.year);
  }

  // Get the month and year for the previous or next month
  private updateMonthYear(newMonth: number, newYear: number): void {

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    this.month2 = newMonth;
    this.year = newYear;

    this.nameMonth = Months[this.month2];
  }
  // Fetch projects for the selected month
  fetchProjects() {
    this.loader = false;
    let result: any = [];
    this.dataUser = null;

    result = this.calculateHoursWorkedByMonth(this.allvalues, this.currentProject, this.year);
    this.dataUser = result;

    /* this.chartOptionsuser = {
       series: this.dataUser,
       chart: {
         height: 550,
         width: 1200,
         type: "heatmap",
         background: '#FFFFFF'
       }, markers: {
         colors: ['#F44336', '#E91E63', '#9C27B0']
       },
       tooltip: {
         enabled: false,
         shared: false,
         intersect: false,
         x: {
           show: false,
           format: "dd.MM.yyyy hh:mm:ss"
         }
       },
       stroke: {
         width: 0
       },
       colors: ["#FFFFFF", "#fec1db",],
       plotOptions: {
         heatmap: {
           colorScale: {
             ranges: []
           },
           enableShades: false
         }
       },
       dataLabels: {
         enabled: true,
         formatter: function (val, opts) {
           const isTotal = val === "Total" || opts.seriesIndex === 0 || opts.dataPointIndex === opts.w.config.series[0].data.length - 1;
 
           opts.w.config.dataLabels.style.fontWeight = isTotal ? 'bold' : 'normal';
 
           // Appliquer le style de la police uniquement pour la ligne ou la colonne "Total"
           opts.w.config.dataLabels.style.fontFamily = isTotal ? '20px' : undefined;
           if (isTotal && opts.seriesIndex !== 0) {
             return `${val.toString().replace('.', ',')} h`;
           }
           return val.toString().replace('.', ',');
         },
         style: {
           colors: ["#193F77"]
         },
       },
       xaxis: {
         type: "category",
         position: 'top',
         tooltip: {
           enabled: false
         },
         labels: {
           show: true,
           floating: true,
           style: {
             colors: '#193F77',
             fontSize: '12px',
             fontFamily: 'Arial',
             fontWeight: 'bold',
           
           }
         }
       },
       title: {
         text: this.transloco.translate('features.projects.userByMonthWithProject') + ' ' + this.currentProject + ' in year ' + this.year
         , style: {
           color: '#E50060',
           margin: '20px 0', // Add margin top and bottom
 
         }
       }
     };*/
    this.loader = true;

  }
  // Fetch users for the selected month
  fetchUser(startMonthIndex: number, endMonthIndex: number, startYear: number, endYear: number) {
    this.loader = false;
    let result: any = [];
    this.dataProject = null;
    result = this.calculateHoursWorkedByMonthinuser(this.allvalues, this.currentuser, this.year, startMonthIndex, endMonthIndex, startYear, endYear);
    console.log("this.allvalues", result)
    this.dataProject = result;
  //this.selectListe(result)
//this.loadGroups(result);

    // Calculate dynamic dimensions based on data size
    const baseHeight = 500;
    const additionalHeightPerProject = 30;
    const calculatedHeight = Math.max(
      baseHeight,
      result.length * additionalHeightPerProject
    );
    console.log("data::::::", this.dataProject)

    /*this.chartOptionsproject = {
      series: this.dataProject,
      chart: {
        height: calculatedHeight,
        width: 1200,
        type: "heatmap",
        background: '#FFFFFF'

      },
      tooltip: {
        enabled: false,
        shared: false,
        intersect: false,
        x: {
          show: false,
          format: "dd.MM.yyyy hh:mm:ss"
        }
      },
      stroke: {
        width: 0
      },
      colors: ["#FFFFFF", "#fec1db",],
      plotOptions: {
        heatmap: {
          colorScale: {
            ranges: []
          },
          enableShades: false
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val, opts) {
      
          // Vérifier si c'est la ligne ou la colonne "Total"
          const isTotal = val === "Total" || opts.seriesIndex === 0 || opts.dataPointIndex === opts.w.config.series[0].data.length - 1;
          // Appliquer le style en gras si c'est "Total", sinon le style normal
          opts.w.config.dataLabels.style.fontWeight = isTotal ? 'bold' : 'normal';

          // Appliquer le style de la police uniquement pour la ligne ou la colonne "Total"
          opts.w.config.dataLabels.style.fontFamily = isTotal ? '60px' : undefined;

          const data = opts.w.config.series[opts.seriesIndex].data[opts.dataPointIndex];
          const percentage = data.percentage || "0";
          return `${val} h (${percentage}%)`;
        },
        style: {
          colors: ["#193F77"]
        },
      },
      xaxis: {
        type: "category",
        position: 'top',
        tooltip: {
          enabled: false
        },
        labels: {
          show: true,
          floating: true,
          style: {
            colors: '#193F77',
            fontSize: '12px',
            fontFamily: 'Arial',
            fontWeight: 'bold',
          }
        }
      },
      title: {
        text: this.transloco.translate('features.projects.projectByMonthOf') + ' ' + this.currentuser + ' ' + this.transloco.translate('features.projects.in_year') + ' ' + this.year
        , style: {
          color: '#E50060',
          margin: '20px 0'
        }
      }
    };*/
    this.loader = true;
  }

  // Calculate hours worked by month for a specific project
  calculateHoursWorkedByMonth(arr, projectName, year) {
    const result = arr
      .filter((item) => item.name === projectName)
      .map((item) => {
        const name = this.capitalizeFirstLetter(item.displayName);
        const data: any = [];
        const monthData = {};
        let rowTotal = 0; // Total hours worked in a row (per month)

        this.months2.forEach((month) => {
          monthData[month] = 0;
        });

        for (const key in item) {
          if (key !== "displayName" && key !== "name" && key.includes(`${year}`)) {
            const month = key.split("_")[0];
            const monthValue = item[key].reduce((sum, entry) => sum + (+entry.nbHeure), 0);
            monthData[month] = monthValue;
            rowTotal += monthValue; // Add monthValue to rowTotal
          }
        }

        this.months2.forEach((month) => {
          data.push({ x: month, y: monthData[month] });
        });

        // Add row total to the data
        data.push({ x: 'Total', y: rowTotal });

        return { name, data, groupeId: item.groupId, brandId: item.brandId, productId: item.productId, marqueId: item.marqueId, mediaId: item.mediaId };
      });

    // Calculate column totals (total hours worked per project)
    const columnTotals = {};
    result.forEach((project) => {
      project.data.forEach((month) => {
        columnTotals[month.x] = (columnTotals[month.x] || 0) + month.y;
      });
    });

    // Add column totals to the result
    const months = Object.keys(columnTotals);
    const columnTotalData = months.map((month) => ({ x: month, y: columnTotals[month] }));
    result.unshift({ name: 'Total', data: columnTotalData });
    //this.loadGroups()
    return result;
  }
  ///
  private getMonthsInRange(
    startMonth: number,
    startYear: number,
    endMonth: number,
    endYear: number
  ): Array<{ monthName: string, monthIndex: number, year: number }> {
    const months: { monthName: string; monthIndex: number; year: number }[] = [];
    let currentYear = startYear;
    let currentMonth = startMonth;

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      months.push({
        monthName: this.months2[currentMonth],
        monthIndex: currentMonth,
        year: currentYear
      });
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }
    return months;
  }

  // Calculate hours worked by month for a specific user
  calculateHoursWorkedByMonthinuser(
    arr: any,
    UserName: string,
    year: number,
    startMonthIndex: number,
    endMonthIndex: number,
    startYear: number,
    endYear: number,
  ) {
    const monthsInRange = this.getMonthsInRange(startMonthIndex, startYear, endMonthIndex, endYear);
    const result = arr
      .filter((item) => item.displayName === UserName)
      .map((item) => {
        const name = this.capitalizeFirstLetter(item.name);
        const data: any = [];
        const monthData: Record<string, number> = {};

        // Initialize monthData with 0 for each month in range
        monthsInRange.forEach(month => monthData[`${month.monthName}_${month.year}`] = 0);
        monthData["Total"] = 0;

        // Process each key in the item
        for (const key in item) {
          if (key !== "displayName" && key !== "name") {
            const [monthStr, yearStr] = key.split('_');
            const keyYear = parseInt(yearStr, 10);
            const keyMonth = this.months2.indexOf(monthStr);

            // Check if the key is within the date range
            if (keyYear < startYear || keyYear > endYear) continue;
            if (keyYear === startYear && keyMonth < startMonthIndex) continue;
            if (keyYear === endYear && keyMonth > endMonthIndex) continue;

            const monthEntry = monthsInRange.find(m =>
              m.monthName === monthStr && m.year === keyYear
            );
            if (monthEntry) {
              const monthValue = item[key].reduce((sum, entry) => {
                const nbHeure = parseFloat(entry.nbHeure.toString().replace(/,/g, '.')) || 0;
                return sum + nbHeure;
              }, 0);
              monthData[`${monthStr}_${keyYear}`] += monthValue;
            }
          }
        }

        // Calculate Total
        monthData["Total"] = monthsInRange.reduce((sum, month) => sum + monthData[`${month.monthName}_${month.year}`], 0);

        // Populate data array
        monthsInRange.forEach(month => {
          data.push({ x: `${month.monthName}_${month.year}`, y: monthData[`${month.monthName}_${month.year}`] });
        });
        data.push({ x: "Total", y: monthData["Total"] });

        return {
          name,
          data,
          groupeId: item.groupId,
          groupeName: item.groupName,
          brandId: item.brandId,
          brandName: item.brandName,
          productId: item.productId,
          productName: item.productName,
          marqueId: item.marqueId,
          marqueName: item.marqueName,
          mediaId: item.mediaId,
          mediaName: item.mediaName,
        };
      });

    // Calculate column totals
    const columnTotals: Record<string, number> = {};
    monthsInRange.forEach(month => {
      const monthKey = `${month.monthName}_${month.year}`;
      columnTotals[monthKey] = 0;
    });
    columnTotals["Total"] = 0;

    result.forEach((user) => {
      user.data.forEach((item) => {
        columnTotals[item.x] += item.y;
      });
    });

    // Add column totals to the result
    const totalData = monthsInRange.map(month => ({
      x: `${month.monthName}_${month.year}`,
      y: columnTotals[`${month.monthName}_${month.year}`]
    }));
    totalData.push({ x: "Total", y: columnTotals["Total"] });

    result.unshift({
      name: "Total",
      data: totalData
    });

    // Calculate percentage contributions
    result.forEach((user) => {
      user.data.forEach((item) => {
        const total = columnTotals[item.x] || 0;
        if (total > 0) {
          const percentage = (item.y / total) * 100;
          // Format percentage to show decimals only if needed
          item.percentage = Number.isInteger(percentage)
            ? percentage.toString()
            : percentage.toFixed(2).replace('.', ',');
        } else {
          item.percentage = "0"; // Avoid division by zero
        }
      });
    });

this.loadGroups(result)
    return result;
  }

  // Capitalize the first letter of a string
  capitalizeFirstLetter(inputString: string): string {
    if (inputString.length === 0) {
      return inputString; // Return the input string if it's empty
    }
    const firstLetter = inputString.charAt(0).toUpperCase();
    const restOfString = inputString.slice(1);
    return firstLetter + restOfString;
  }
  // Fetch groups by domain Id
  async loadGroups(result) {
      const domainId = this.profileService.profile.idDomaine;
      this.groups = await this.projectService.getGroupsByDomain(domainId);
      this.groupss = this.groups.map(group => ({ id: group.id, name: group.name }));
    const allGroupsFromTable = await this.projectService.getGroupsByDomain(domainId);
console.log("allGroupsFromTable",allGroupsFromTable)
console.log("this.groups",this.groups)
console.log("ferste groupsss",this.groupss)
      // 2. Extraire les groupes des projets existants
      console.log("result",result)
  const groupsFromProjects = result
  ?.map(project => ({
    id: project.groupeId,
    name: project.groupeName
  }))
  // Filtrer les doublons
  .filter((group, index, self) => 
    self.findIndex(g => g.id === group.id) === index
  ) || [];
console.log("groupsFromProjects",groupsFromProjects)
// 3. Filtrer pour garder uniquement les groupes existants dans les deux sources
this.groupss = allGroupsFromTable
  .filter(tableGroup => {
    if (!tableGroup?.id) return false; // Skip invalid entries
        
    return groupsFromProjects.some(projectGroup => {
      if (!projectGroup?.id) return false;
      
      const isMatch = projectGroup.id.trim().toLowerCase() === 
                     tableGroup.id.trim().toLowerCase();
      
      console.log(
        `Match: ${isMatch} | Project: ${projectGroup.id} | Table: ${tableGroup.id}`
      );
      return isMatch;
    });
  })
  .map(g => ({ id: g.id, name: g.name }));
console.log("this.groupss",this.groupss)

}

  // Fetch brands by group
  async onGroupSelected() {
    this.selectedBrand = '';
    this.selectedProduct = '';
    this.selectedMarque = '';
    this.selectedMedia = '';
  
    if (this.selectedGroup) {
      // 1. Get brands from brand table for the selected group
      const allBrandsFromTable = await this.projectService.getBrandsByGroup(this.selectedGroup);
      this.brands= allBrandsFromTable;
      // 2. Get brands from user's projects in this group
      const brandsFromProjects = this.dataProject
        ?.filter(project => project.groupeId === this.selectedGroup)
        ?.map(project => ({
          id: project.brandId,
          name: project.brandName
        })) || [];
  
      // 3. Filter brands to only those existing in both table and projects
      this.brandss = allBrandsFromTable
        .filter(tableBrand => 
          brandsFromProjects.some(projectBrand => projectBrand.id === tableBrand.id)
        )
        .map(brand => ({ id: brand.id, name: brand.name }));
    } else {
      this.brandss = [];
    }
    
    this.productss = [];
    this.marquess = [];
    this.mediass = [];
  }
  // Fetch brands by group
  async onBrandSelected() {
    this.selectedProduct = '';
    this.selectedMarque = '';
    this.selectedMedia = '';
  
    if (this.selectedGroup && this.selectedBrand) {
      // 1. Get products from product table
      const allProductsFromTable = await this.projectService.getProductsByBrand(
        this.selectedGroup, 
        this.selectedBrand
      );
  this.products = allProductsFromTable;
      // 2. Get products from user's projects
      const productsFromProjects = this.dataProject
        ?.filter(project => 
          project.groupeId === this.selectedGroup &&
          project.brandId === this.selectedBrand
        )
        ?.map(project => ({
          id: project.productId,
          name: project.productName
        })) || [];
  
      // 3. Filter products
      this.productss = allProductsFromTable
        .filter(tableProduct =>
          productsFromProjects.some(projectProduct => projectProduct.id === tableProduct.id)
        )
        .map(product => ({ id: product.id, name: product.name }));
    } else {
      this.productss = [];
    }
  
    this.marquess = [];
    this.mediass = [];
  }
  // Fetch marques by product
  async onProductSelected() {
    this.selectedMarque = '';
    this.selectedMedia = '';
    
    if (this.selectedGroup && this.selectedBrand && this.selectedProduct) {
      this.marques = await this.projectService.getMarquesByProduct(this.selectedGroup, this.selectedBrand, this.selectedProduct);
      this.marquess = this.marques.map(marque => ({ id: marque.id, name: marque.name }));
    } else {
      this.marquess = [];
    }
    this.mediass = [];
  }
  // Fetch media by marque or all media if "All" is selected
  async onMarqueSelected() {    
    if (this.selectedGroup && this.selectedBrand && this.selectedProduct ) {
      this.medias = await this.projectService.getMediaByMarque(this.selectedGroup, this.selectedBrand, this.selectedProduct, this.selectedMarque);
      this.mediass = this.medias.map(media => ({ id: media.id, name: media.name }));
    } else {
      this.mediass = [];
    }
  }

  // Apply filters
  applyFilters() {
    // Reset the filtered result array
    let filteredProjects = this.allvalues;

    // Filter projects based on selected group
    if (this.selectedGroup) {
      filteredProjects = filteredProjects.filter(project => project.groupId === this.selectedGroup);
    }

    // Filter projects based on selected brand
    if (this.selectedBrand) {
      filteredProjects = filteredProjects.filter(project => project.brandId === this.selectedBrand);
    }

    // Filter projects based on selected product
    if (this.selectedProduct) {
      filteredProjects = filteredProjects.filter(project => project.productId === this.selectedProduct);
    }

    // Filter projects based on selected marque
    if (this.selectedMarque) {
      filteredProjects = filteredProjects.filter(project => project.marqueId === this.selectedMarque);
    }

    // Filter projects based on selected media
    if (this.selectedMedia && this.selectedMedia !== 'All') {
      filteredProjects = filteredProjects.filter(project => project.mediaId === this.selectedMedia);
    }

    // Now, update the data and refresh the chart
    this.data = null;
    let result: { name: string; data: { x: string; y: number }[] }[] = [];
    let projectUserMap: { [uniqueProjectKey: string]: { [userName: string]: number } } = {};
    let allProjects: Set<string> = new Set();
    let allUsers: Set<string> = new Set();

    filteredProjects.forEach((project) => {
      const userName = project.displayName;
      const projectName = project.name;
      const projectId = project.id;

      allUsers.add(userName);
      const uniqueProjectKey = `${projectName} (${projectId})`;
      allProjects.add(uniqueProjectKey);

      if (!this.listuser.includes(userName)) {
        this.listuser.push(userName);
      }

      if (!projectUserMap[uniqueProjectKey]) {
        projectUserMap[uniqueProjectKey] = {};
      }

      let totalHoursForUser = 0;

      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const monthName = this.months[monthIndex];

        if (project[`${monthName}_${this.year}`]) {
          const totalHours = project[`${monthName}_${this.year}`].reduce((sum, entry) => sum + +entry.nbHeure, 0);
          totalHoursForUser += totalHours;
        }
      }

      projectUserMap[uniqueProjectKey][userName] =
        (projectUserMap[uniqueProjectKey][userName] || 0) + totalHoursForUser;
    });

    Array.from(allProjects).forEach((uniqueProjectKey) => {
      const [projectName, projectId] = uniqueProjectKey.split(' (');
      const cleanProjectId = projectId.replace(')', '');

      let projectData: { name: string; data: { x: string; y: number }[] } = {
        name: uniqueProjectKey,
        data: [],
      };
      let projectTotalHours = 0;

      Array.from(allUsers).forEach((userName) => {
        const hours = projectUserMap[uniqueProjectKey]?.[userName] || 0;
        projectTotalHours += hours;
        projectData.data.push({ x: userName, y: hours });
      });

      projectData.data.push({ x: "Total", y: projectTotalHours });

      result.push(projectData);
    });

    let totalPerUser = Array.from(allUsers).map((userName) => {
      return result.reduce((sum, projectData) => {
        const userData = projectData.data.find((item) => item.x === userName);
        return sum + (userData ? userData.y : 0);
      }, 0);
    });

    result.unshift({
      name: "Total",
      data: Array.from(allUsers)
        .map((userName, index) => ({
          x: userName,
          y: totalPerUser[index],
        }))
        .concat({
          x: "Total",
          y: totalPerUser.reduce((sum, val) => sum + val, 0),
        }),
    });

    this.data = this.processProjects(result);

    // Update the chart options
    /*this.chartOptions = {
      series: this.data,
      chart: {
        height: 800,
        width: 1250,
        type: "heatmap",
        background: "#FFFFFF",
      },
      tooltip: {
        enabled: true,
        shared: false,
        intersect: false,
        x: {
          show: true,
          format: "dd.MM.yyyy hh:mm:ss",
        },
      },
      stroke: {
        width: 0,
      },
      colors: ["#FFFFFF", "#fec1db"],
      plotOptions: {
        heatmap: {
          colorScale: {
            ranges: [],
          },
          enableShades: false,
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val, { seriesIndex, dataPointIndex, w }) {
          // Vérifier si c'est la ligne ou la colonne "Total"
          const isTotal = val === "Total" || seriesIndex === 0 || dataPointIndex === w.config.series[0].data.length - 1;
          // Appliquer le style en gras si c'est "Total", sinon le style normal
          w.config.dataLabels.style.fontWeight = isTotal ? 'bold' : 'normal';

          // Appliquer le style de la police uniquement pour la ligne ou la colonne "Total"
          w.config.dataLabels.style.fontFamily = isTotal ? '60px' : undefined;
          const data = w.config.series[seriesIndex].data[dataPointIndex];
          return `${val} h (${data.percentage}%)`;
        },
        style: {
          colors: ["#193F77"],
        },
      },
      xaxis: {
        type: "category",
        position: "top",
        tooltip: {
          enabled: false,
        },
        labels: {
          show: true,
          floating: true,
          style: {
            colors: "#193F77",
            fontSize: "12px",
            fontFamily: "Arial",
            fontWeight: "bold",
          },
        },
      },
      title: {
        text: this.transloco.translate("features.projects.projectByUser") + " " + this.year,
        style: {
          color: "#E50060",
          margin: "20px 0",
        },
      },
    };*/

  }

  // Reset all filters
  resetFilters() {
    this.selectedGroup = '';
    this.selectedBrand = '';
    this.selectedProduct = '';
    this.selectedMarque = '';
    this.selectedMedia = '';
    this.getAllProjectsForAllUsers()
  }

  // Autocomplete user search
  onUserSelected(event: MatAutocompleteSelectedEvent): void {
    this.currentuser = event.option.value;
    console.log("this.currentuser", event.option.id)
    // Reset all filters
  this.selectedGroup = '';
  this.selectedBrand = '';
  this.selectedProduct = '';
  this.selectedMarque = '';
  this.selectedMedia = '';
    this.fetchUser(this.startMonthIndex, this.endMonthIndex, this.year, this.year);
    this.onApplyDateRange();
  }

  selectListe(data: any[]) {
    // Extract unique groups from the user's projects
    const uniqueList = (items: any[], idKey: string, nameKey: string) => 
      items
        .map((item) => ({
          id: item[idKey] || '',
          name: item[nameKey] || ''
        }))
        .filter((item) => item.id && item.name)
        .reduce<{ id: string; name: string }[]>(
          (unique, item) => unique.some(e => e.id === item.id) ? unique : [...unique, item], 
          []
        );
  
    // Populate filters based on user's projects
    this.group = uniqueList(data, 'groupeId', 'groupeName');
    this.brand = uniqueList(data, 'brandId', 'brandName');
    this.product = uniqueList(data, 'productId', 'productName');
    this.marque = uniqueList(data, 'marqueId', 'marqueName');
    this.media = uniqueList(data, 'mediaId', 'mediaName');
  }

  applyFilterss() {
    this.loader = false;
    // Start with the user's projects
    let filteredProjects = this.allvalues.filter(
      project => project.displayName === this.currentuser
    );
  
    // Apply hierarchical filters
    if (this.selectedGroup) {
      filteredProjects = filteredProjects.filter(
        project => project.groupId === this.selectedGroup
      );
    }
    if (this.selectedBrand) {
      filteredProjects = filteredProjects.filter(
        project => project.brandId === this.selectedBrand
      );
    }
    if (this.selectedProduct) {
      filteredProjects = filteredProjects.filter(
        project => project.productId === this.selectedProduct
      );
    }
    if (this.selectedMarque) {
      filteredProjects = filteredProjects.filter(
        project => project.marqueId === this.selectedMarque
      );
    }
    if (this.selectedMedia && this.selectedMedia !== 'All') {
  filteredProjects = filteredProjects.filter(project => project.mediaId === this.selectedMedia);
    }
  
    // Update the chart data
    this.dataProject = this.calculateHoursWorkedByMonthinuser(
      filteredProjects,
      this.currentuser,
      this.year,
      this.startMonthIndex,
      this.endMonthIndex,
      this.year,
      this.year
    );
    //this.updateChartOptions();
    this.loader = true;
  }
/*
  updateChartOptions() {
  console.log("this.dataProject",this.dataProject)
    this.chartOptionsproject = {
      series: this.dataProject,
      chart: {
        height: 500,
        width: 1200,
        type: "heatmap",
        background: '#FFFFFF'
      },
      tooltip: {
        enabled: false,
        shared: false,
        intersect: false,
        x: {
          show: false,
          format: "dd.MM.yyyy hh:mm:ss"
        }
      },
      stroke: {
        width: 0
      },
      colors: ["#FFFFFF", "#fec1db",],
      plotOptions: {
        heatmap: {
          colorScale: {
            ranges: []
          },
          enableShades: false
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val, opts) {
          const isTotal = val === "Total" || opts.seriesIndex === 0 || opts.dataPointIndex === opts.w.config.series[0].data.length - 1;
          opts.w.config.dataLabels.style.fontWeight = isTotal ? 'bold' : 'normal';
          opts.w.config.dataLabels.style.fontFamily = isTotal ? '20px' : undefined;
          if (isTotal && opts.seriesIndex !== 0) {
            return `${val.toString().replace('.', ',')} h (${opts.dataPointIndex}%)`;
          }
          return val.toString().replace('.', ',');
        },
        style: {
          colors: ["#193F77"]
        },
      },
      xaxis: {
        type: "category",
        position: 'top',
        tooltip: {
          enabled: false
        },
        labels: {
          show: true,
          floating: true,
          style: {
            colors: '#193F77',
            fontSize: '12px',
            fontFamily: 'Arial',
            fontWeight: 'bold',
          }
        }
      },
      title: {
        text: this.transloco.translate('features.projects.projectByMonthOf') + ' ' + this.currentuser + ' ' + this.transloco.translate('features.projects.in_year') + ' ' + this.year,
        style: {
          color: '#E50060',
          margin: '20px 0'
        }
      }
    };
  }*/

  resetFilterss() {
    this.selectedGroup = '';
    this.selectedBrand = '';
    this.selectedProduct = '';
    this.selectedMarque = '';
    this.selectedMedia = '';
    
    // Reset filter options to initial state
    this.loadGroups(this.allvalues); // Re-fetch groups
    this.brandss = [];
    this.productss = [];
    this.marquess = [];
    this.mediass = [];
    
    // Refresh data without filters
    this.fetchUser(this.startMonthIndex, this.endMonthIndex, this.year, this.year);
  }
  exportTable(format: string) {
    switch (format) {
      case 'csv':
        this.exportTableToCSV();
        break;
      case 'svg':
        this.exportTableToSVG();
        break;
      case 'png':
        this.exportTableToPNG();
        break;
      default:
        console.error('Unsupported format');
    }
  }

  exportTableToCSV() {
    const table = document.getElementById('exportTable');
    if (!table) return;

    const rows = table.querySelectorAll('tr');
    const data: string[][] = [];

    // Add title
    const title = document.querySelector('.table-title')?.textContent?.trim();
    if (title) {
      data.push([title]);
      data.push([]); // Empty row after title
    }

    rows.forEach(row => {
      const rowData: string[] = [];
      const cells = row.querySelectorAll('th, td');

      cells.forEach(cell => {
        let cellText = '';

        // Extract hour and percentage if present
        const hourElem = cell.querySelector('.hour');
        const percentElem = cell.querySelector('.percent, .percent-total');

        if (hourElem && percentElem) {
          const hourText = hourElem.textContent?.trim() || '';
          const percentText = percentElem.textContent?.trim() || '';
          cellText = `${hourText} ${percentText}`.trim();
        } else {
          cellText = cell.textContent?.trim() || '';
        }

        rowData.push(cellText);
      });

      data.push(rowData);
    });

    // Create CSV content
    const csvContent = data.map(row =>
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'table.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportTableToPNG() {
    const tableContainer = document.querySelector('.table-container') as HTMLElement;
    const title = document.querySelector('.table-title') as HTMLElement;

    if (!tableContainer || !title) return;

    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.width = tableContainer.scrollWidth + 'px'; // Use scrollWidth to include hidden content
    document.body.appendChild(container);

    // Clone title and table
    const clonedTitle = title.cloneNode(true) as HTMLElement;
    const clonedTable = tableContainer.cloneNode(true) as HTMLElement;

    // Apply styles to ensure proper rendering
    clonedTable.style.width = '100%';
    clonedTable.style.margin = '0';
    clonedTitle.style.margin = '0 0 20px 0'; // Adjust as needed

    container.appendChild(clonedTitle);
    container.appendChild(clonedTable);

    // Use html2canvas with options to improve rendering
    html2canvas(container, { scale: 2, scrollX: -window.scrollX, scrollY: -window.scrollY }).then(canvas => {
      canvas.toBlob(blob => {
        if (blob) {
          saveAs(blob, 'table.png');
        }
        document.body.removeChild(container);
      });
    });
  }

  exportTableToSVG() {
    const tableContainer = document.querySelector('.table-container') as HTMLElement;
    const title = document.querySelector('.table-title') as HTMLElement;

    if (!tableContainer || !title) return;

    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.width = tableContainer.scrollWidth + 'px'; // Use scrollWidth to include hidden content
    document.body.appendChild(container);

    // Clone title and table
    const clonedTitle = title.cloneNode(true) as HTMLElement;
    const clonedTable = tableContainer.cloneNode(true) as HTMLElement;

    clonedTable.style.width = '100%';
    clonedTable.style.margin = '0';
    clonedTitle.style.margin = '0 0 20px 0';

    container.appendChild(clonedTitle);
    container.appendChild(clonedTable);

    // Render to canvas and embed in SVG
    html2canvas(container, { scale: 2, scrollX: -window.scrollX, scrollY: -window.scrollY }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
          <image href="${imgData}" width="${canvas.width}" height="${canvas.height}"/>
        </svg>
      `;
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      saveAs(svgBlob, 'table.svg');
      document.body.removeChild(container);
    });
  }
}