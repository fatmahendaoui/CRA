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

  @ViewChild("chart") chart: ChartComponent;

  data: any;
  public chartOptions: any;
  public chartOptionsuser: any;
  public chartOptionsproject: any;
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
startMonthIndex=0;
endMonthIndex=13;
  ngOnInit() {
    this.loadGroups();
   
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
      console.log('Start Date:', this.startDate);
      console.log('End Date:', this.endDate);
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
      this.fetchUser(startMonthIndex, endMonthIndex);
    } else {
      console.log('Please select both start and end dates.');
    }
  }
  // Cancel date range filter
  onCancelDateRange(): void {
      this.getAllProjectsForAllUsers();
      this.fetchUser(this.startMonthIndex, this.endMonthIndex);
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
    console.log("testttt :",this.filteredUsers)
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

    // Configurer les options du graphique
    this.chartOptions = {
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
    };
    
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
    this.chartOptions.series = this.data;

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
    let filteredData = project.data

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
    this.fetchUser(this.startMonthIndex, this.endMonthIndex)
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
 
    this.chartOptionsuser = {
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
          /* if (opts.seriesIndex === 0) {
             opts.w.config.dataLabels.style.fontFamily = '20px'
             opts.w.config.dataLabels.style.fontWeight = '900'
 
           } else {
             opts.w.config.dataLabels.style.fontWeight = '600'
             opts.w.config.dataLabels.style.fontFamily = undefined
           }*/
          // Vérifier si c'est la ligne ou la colonne "Total"
          const isTotal = val === "Total" || opts.seriesIndex === 0 || opts.dataPointIndex === opts.w.config.series[0].data.length - 1;

          // Appliquer le style en gras si c'est "Total", sinon le style normal
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
    };
    this.loader = true;

  }
  // Fetch users for the selected month
  fetchUser(startMonthIndex: number, endMonthIndex: number) {
    this.loader = false;
    let result: any = [];
    this.dataProject = null;
    result = this.calculateHoursWorkedByMonthinuser(this.allvalues, this.currentuser, this.year,startMonthIndex, endMonthIndex);
    console.log("this.allvalues",result)
    this.dataProject = result;
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
          /* if (opts.seriesIndex === 0) {
             opts.w.config.dataLabels.style.fontFamily = '20px'
             opts.w.config.dataLabels.style.fontWeight = '900'
 
           } else {
             opts.w.config.dataLabels.style.fontWeight = '600'
             opts.w.config.dataLabels.style.fontFamily = undefined
           }*/
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
    };
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

        return { name, data,groupeId: item.groupId,brandId: item.brandId,productId: item.productId,marqueId: item.marqueId,mediaId: item.mediaId };
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

    return result;
  }

// Calculate hours worked by month for a specific user
calculateHoursWorkedByMonthinuser(
  arr: any,
  UserName: string,
  year: number,
  startMonthIndex: number,
  endMonthIndex: number
) {
  const result = arr
    .filter((item) => item.displayName === UserName)
    .map((item) => {
      const name = this.capitalizeFirstLetter(item.name);
      const data: any = [];
      const monthData: Record<string, number> = {};

      // Initialize monthData with 0 for each month within the range and include "Total"
      this.months2.slice(startMonthIndex, endMonthIndex + 1).forEach((month) => {
        monthData[month] = 0;
      });
      monthData["Total"] = 0;

      // Process the user's data and calculate hours for each month
      for (const key in item) {
        if (key !== "displayName" && key !== "name" && key.includes(`${year}`)) {
          const month = key.split("_")[0];
          if (monthData.hasOwnProperty(month)) {
            const monthValue = item[key].reduce((sum, entry) => sum + (+entry.nbHeure), 0);
            monthData[month] += monthValue;
          }
        }
      }

      // Calculate row total and add to monthData
      monthData["Total"] = Object.keys(monthData)
        .filter((key) => key !== "Total")
        .reduce((sum, month) => sum + monthData[month], 0);

      // Populate data array with monthData values
      Object.keys(monthData).forEach((month) => {
        data.push({ x: month, y: monthData[month] });
      });

      return {
        name,
        data,
        groupeId: item.groupId,
        brandId: item.brandId,
        productId: item.productId,
        marqueId: item.marqueId,
        mediaId: item.mediaId
      };
    });

  // Calculate column totals
  const columnTotals: Record<string, number> = {};
  this.months2.slice(startMonthIndex, endMonthIndex + 1).concat("Total").forEach((month) => {
    let columnTotal = 0;
    result.forEach((user) => {
      const userData = user.data.find((item) => item.x === month);
      if (userData) {
        columnTotal += userData.y;
      }
    });
    columnTotals[month] = columnTotal;
  });

  // Add column totals to the result
  const totalData = this.months2
    .slice(startMonthIndex, endMonthIndex + 1)
    .concat("Total")
    .map((month) => ({ x: month, y: columnTotals[month] }));
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
      item.percentage = Number.isInteger(percentage) ? percentage.toString() : percentage.toFixed(2);
    } else {
      item.percentage = "0"; // Avoid division by zero
    }
  });
});


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
  async loadGroups() {
    const domainId = this.profileService.profile.idDomaine; // Replace with the actual ID you need
    this.groups = await this.projectService.getGroupsByDomain(domainId);
  }
// Fetch brands by group
  async onGroupSelected() {
    if (this.selectedGroup) {
      this.brands = await this.projectService.getBrandsByGroup(this.selectedGroup);

    }
  }
// Fetch brands by group
  async onBrandSelected() {
    if (this.selectedGroup && this.selectedBrand) {
      this.products = await this.projectService.getProductsByBrand(this.selectedGroup, this.selectedBrand);

    }
  }
  // Fetch marques by product
  async onProductSelected() {
    if (this.selectedGroup && this.selectedBrand && this.selectedProduct) {
      this.marques = await this.projectService.getMarquesByProduct(this.selectedGroup, this.selectedBrand, this.selectedProduct);

    }
  }
// Fetch media by marque or all media if "All" is selected
async onMarqueSelected() {
  if (this.selectedGroup && this.selectedBrand && this.selectedProduct) {
      // Fetch media for the selected marque
      this.medias = await this.projectService.getMediaByMarque(this.selectedGroup, this.selectedBrand, this.selectedProduct, this.selectedMarque);
    
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
  this.chartOptions = {
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
  };
  
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
    this.fetchUser(this.startMonthIndex, this.endMonthIndex);
    this. onApplyDateRange();
}
applyFilterss() {
  this.loader = false;
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
console.log("filteredProjects",filteredProjects)
console.log("this.currentuser",this.currentuser)
  // Update the displayed data
  this.dataProject = this.calculateHoursWorkedByMonthinuser(filteredProjects, this.currentuser, this.year,this.startMonthIndex, this.endMonthIndex);

  this.updateChartOptions();
  this.loader = true;
}

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
}

resetFilterss() {
  this.selectedGroup = '';
  this.selectedBrand = '';
  this.selectedProduct = '';
  this.selectedMarque = '';
  this.selectedMedia = '';
  this.fetchUser(this.startMonthIndex, this.endMonthIndex);  
  this.applyFilters();
}

}
