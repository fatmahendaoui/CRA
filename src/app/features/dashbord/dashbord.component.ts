import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { ProjectService } from '../projects/services/projects.service';
import { ChartComponent } from 'ng-apexcharts';
import { Months } from '../timesheet/models/dates.constants';
import { DateService } from '../timesheet/services/date.service';
import { UsersService } from '../users/services/users.service';
import { Profile } from 'src/app/models/profile.model';

@Component({
  selector: 'app-dashbord',
  templateUrl: './dashbord.component.html',
  styleUrls: ['./dashbord.component.scss']
})
export class DashbordComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly DateService = inject(DateService);
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
  ngOnInit() {
    this.theDate = new Date();
    if (this.theDate) {
      this.month2 = this.theDate.getMonth();
      this.year = this.theDate.getFullYear();
    }
    this.getallProjectwithsommeNumber()
  }
  listuser: any[] = [];

  getallProjectwithsommeNumber() {
    this.data = null;
    let result: any = [];
    let totals: number[] = Array(13).fill(0); // Initialize array to store monthly totals
    let projectTotals: number[] = []; // Initialize array to store project totals

    this.projectService.fetchAllProjectswithuser().then(li => {
      this.allvalues = li;
      li.forEach(project => {

        const projectName = project.name;
        const monthlyData = Array(12).fill(0); // Initialize an array to store monthly data

        let projectTotalHours = 0; // Variable to store total hours per project

        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const monthName = this.months[monthIndex];

          if (project[`${monthName}_${this.year}`]) {
            const totalHours = project[`${monthName}_${this.year}`].reduce((sum, entry) => sum + +entry.nbHeure, 0);
            monthlyData[monthIndex] = totalHours;

            // Update the totals arrays
            totals[monthIndex] += totalHours;
            projectTotalHours += totalHours;
          }
        }

        const data = monthlyData.map((hours, index) => ({
          x: this.months[index],
          y: hours
        }));

        result.push({ name: projectName, data: data });
        if (!this.listuser.includes(project.displayName)) {
          this.listuser.push(project.displayName);
        }

        // Store project total hours
        projectTotals.push(projectTotalHours);
      });

      // Add the totals row to the end of the result array
      const totalsData = totals.map((total, index) => ({
        x: this.months[index],
        y: total
      }));

      // Add project total hours to the data matrix
      projectTotals.forEach((total, index) => {
        result[index].data.push({ x: 'Total', y: total });
      });

      // Add the totals row to the end of the result array
      result.unshift({ name: 'Total', data: totalsData });

      this.data = this.processProjects(result);
      
      let x=0;
      this.data.map(list=>{
       list.data.map(li=>{
        if(li.x =="Total"){
          x=x+li.y
        }
       })
      })      
      this.data[0].data[12].y=x;
      this.chartOptions = {
        series: this.data,
        chart: {
          height: 500,
          width: 1200,
          type: "heatmap"
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
        colors: ["transparent"],
        plotOptions: {
          heatmap: {
            colorScale: {
              ranges: []
            },
            enableShades: false,

          },
        },
        dataLabels: {
          enabled: true,
          formatter: function (val, opts) {
            if (opts.seriesIndex === 0) {
              opts.w.config.dataLabels.style.fontFamily = '20px'
              opts.w.config.dataLabels.style.fontWeight = '900'

            } else {
              opts.w.config.dataLabels.style.fontWeight = '600'
              opts.w.config.dataLabels.style.fontFamily = undefined
            }
            return val;
          },
          style: {
            colors: ["#000000"]
          },

        },
        xaxis: {
          type: "category",
          position: 'top',
          tooltip: {
            enabled: false
          }
        },
        title: {
          text: "Project By Month "+this.year
        }
      };

    })
  }

  processProjects(projects) {
    let processedProjects: any = [];
    let projectMap: any = {};

    projects.forEach(project => {
      if (!projectMap[project.name]) {
        projectMap[project.name] = { name: project.name, data: [] };
        processedProjects.push(projectMap[project.name]);
      }

      project.data.forEach(monthData => {
        let existingMonthData = projectMap[project.name].data.find(data => data.x === monthData.x);
        if (existingMonthData) {
          existingMonthData.y += monthData.y;
        } else {
          projectMap[project.name].data.push({ x: monthData.x, y: monthData.y });
        }
      });
    });

    return processedProjects;
  }
  getYear(op: boolean): void {
    const newYear = this.year + (op ? 1 : -1);
    this.updateMonthYear(this.month2, newYear);
    this.getallProjectwithsommeNumber()
  }
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
  fetchProjects() {
    this.loader = false;
    let result: any = [];
    this.dataUser = null;
    result = this.calculateHoursWorkedByMonth(this.allvalues, this.currentProject, this.year);
    this.dataUser = result;
    this.chartOptionsuser = {
      series: this.dataUser,
      chart: {
        height: 500,
        width: 1200,
        type: "heatmap"
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
      colors: ["transparent"],
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
            if (opts.seriesIndex === 0) {
              opts.w.config.dataLabels.style.fontFamily = '20px'
              opts.w.config.dataLabels.style.fontWeight = '900'

            } else {
              opts.w.config.dataLabels.style.fontWeight = '600'
              opts.w.config.dataLabels.style.fontFamily = undefined
            }
            return val;
          },
          style: {
            colors: ["#000000"]
          },
      },
      xaxis: {
        type: "category",
        position: 'top',
        tooltip: {
          enabled: false
        }
      },
      title: {
        text: "User By Month with Project "+this.currentProject+ ' in year '+this.year
      }
    };
    this.loader = true;

  }
  fetchUser() {
    this.loader = false;
    let result: any = [];
    this.dataProject = null;
    result = this.calculateHoursWorkedByMonthinuser(this.allvalues, this.currentuser, this.year);
    console.log(result);
    
    this.dataProject = result;
    this.chartOptionsproject = {
      series: this.dataProject,
      chart: {
        height: 500,
        width: 1200,
        type: "heatmap"
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
      colors: ["transparent"],
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
            if (opts.seriesIndex === 0) {
              opts.w.config.dataLabels.style.fontFamily = '20px'
              opts.w.config.dataLabels.style.fontWeight = '900'

            } else {
              opts.w.config.dataLabels.style.fontWeight = '600'
              opts.w.config.dataLabels.style.fontFamily = undefined
            }
            return val;
          },
          style: {
            colors: ["#000000"]
          },
      },
      xaxis: {
        type: "category",
        position: 'top',
        tooltip: {
          enabled: false
        }
      },
      title: {
        text: "Project By Month of "+ this.currentuser+" in year "+this.year
      }
    };
    this.loader = true;

  }
  loader: boolean;
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

        return { name, data };
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

  calculateHoursWorkedByMonthinuser(arr: any, UserName: string, year: number) {
    const result = arr
      .filter((item) => item.displayName === UserName)
      .map((item) => {
        const name = this.capitalizeFirstLetter(item.name);
        const data: any = [];
  
        // Create an object to store monthly data
        const monthData = {};
  
        // Initialize monthData with 0 for each month
        this.months2.forEach((month) => {
          monthData[month] = 0;
        });
  
        for (const key in item) {
          if (key !== "displayName" && key !== "name" && key.includes(`${year}`)) {
            const month = key.split("_")[0];
            const monthValue = item[key].reduce((sum, entry) => sum + (+entry.nbHeure), 0);
            monthData[month] = monthValue;
          }
        }
  
        // Calculate row total
        let rowTotal = 0;
        this.months2.forEach((month) => {
          const monthValue = monthData[month];
          rowTotal += monthValue;
          data.push({ x: month, y: monthValue });
        });
  
        // Add row total to the data structure
        data.push({ x: "Total", y: rowTotal });
  
        return { name, data };
      });
  
    // Calculate column totals
    const columnTotals = {};
    this.months.forEach((month) => {
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
    result.unshift({
      name: "Total",
      data: this.months.map((month) => ({ x: month, y: columnTotals[month] })),
    });
  
    return result;
  }
  
  

  capitalizeFirstLetter(inputString: string): string {
    if (inputString.length === 0) {
      return inputString; // Return the input string if it's empty
    }
    const firstLetter = inputString.charAt(0).toUpperCase();
    const restOfString = inputString.slice(1);
    return firstLetter + restOfString;
  }
}
