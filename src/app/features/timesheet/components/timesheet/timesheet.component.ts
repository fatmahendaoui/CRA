import { Component, OnInit, Input, inject } from '@angular/core';
import { DaysOfWeek, Months } from '../../models/dates.constants';
import { DateService } from '../../services/date.service';
import { TimesheetItem } from '../../models/TimesheetItem.model';
import { ProjectService } from '../../../projects/services/projects.service';
import { Auth, User } from '@angular/fire/auth';
import { UsersService } from '../../../users/services/users.service';
import { displayAlertwarning, handleResponseSuccessWithAlerts } from 'src/app/common/alerts.utils';
import { ActivatedRoute, Params } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { Day_offService } from 'src/app/features/day_offs/services/day_off.service';

@Component({
  selector: 'app-timesheet',
  templateUrl: './timesheet.component.html',
  styleUrls: ['./timesheet.component.scss']
})
export class TimesheetComponent implements OnInit {

  projectName: string = '';
  nbHeure: number = 0;
  nextMonth: number;
  numberDayNextMonth: number;
  timesheet: TimesheetItem[] = [];
  resultTimesheet: TimesheetItem[] = [];
  totalHoursPerDay: number[] = [];
  private readonly route = inject(ActivatedRoute);
  tabProject: any[] = [];
  projects: any = [];
  allprojects: any[] = [];

  days: string[] = DaysOfWeek; // Use DaysOfWeek from constants
  month: string[] = Months; // Use Months from constants

  theDate: Date;
  nameMonth: string;
  nameDay: string;
  month2: number;
  year: number;
  myMonth: number;
  numberOfDay: number;
  isWeekend: boolean = false;
  totalHours: number[] = []; // Initialize an array to store total hours for each day
  private readonly usersService = inject(UsersService);
  private readonly day_offService = inject(Day_offService);
  private readonly transloco = inject(TranslocoService);
  private readonly auth = inject(Auth);
  users: User[]
  currentUser;
  description: string | null = '';
  status: string | null;
  IsAdmin: boolean;
  displayNamecurent;
  constructor(
    private dateService: DateService,
    private projectService: ProjectService,
  ) {
    this.route.params.subscribe((params: Params) => {
      this.currentUser = params['uid'];
      this.theDate = new Date(params['date']);
      if (this.theDate) {
        this.nameMonth = this.month[this.theDate.getMonth()];
        this.nameDay = this.days[this.theDate.getDay()];
        this.month2 = this.theDate.getMonth();
        this.year = this.theDate.getFullYear();
        this.myMonth = this.theDate.getMonth() + 1;
      }
      this.fetchProjects()
      this.projectService.checkUserAccess().then(li => {
        this.IsAdmin = li
      })
      this.auth.onAuthStateChanged((user) => {
        if (user) {
          this.displayNamecurent = user.displayName;
        }
      });
    });
    this.fetchAll()
  }
  public fetchAll(): void {
    this.usersService.fetchAllUsers().subscribe(users => {
      this.users = users;
    })

  }


  ngOnInit(): void {
    this.getTimesheet();
  }

  getMonth(op: boolean): void {
    const newMonth = op ? this.month2 + 1 : this.month2 - 1;
    let newYear = this.year;

    if (newMonth > 11) {
      newYear++;
    } else if (newMonth < 0) {
      newYear--;
    }

    const wrappedMonth = (newMonth + 12) % 12;

    this.updateMonthYear(wrappedMonth, newYear);
    this.filterprojects();
  }

  getYear(op: boolean): void {
    const newYear = this.year + (op ? 1 : -1);
    this.updateMonthYear(this.month2, newYear);
    this.filterprojects();
  }
  async Save() {
    try {
      this.tabProject.forEach((project) => {
        this.projectService.updateProjectsMonth(project.id, this.currentUser, project.days);
      });
      if (!this.IsAdmin) {
        handleResponseSuccessWithAlerts(
          this.transloco.translate('features.projects.dialog.success.title'),
          '',
          this.transloco.translate('common.close'),
          () => { }
        );
      } else {
        handleResponseSuccessWithAlerts(
          this.transloco.translate('features.projects.dialog.success.title'),
          this.transloco.translate(''),
          this.transloco.translate('common.close'),
          () => { }
        );
      }
      this.fetchProjects()
    } catch (error) {
      console.error('Error adding project via ProjectService:', error);
    }
  }
  transfertdate(x) {
    let result
    const parts = x.split('_');
    if (parts.length === 2) {
      const month = this.getMonthIndex(parts[0]);
      const year = parseInt(parts[1], 10);

      if (!isNaN(month) && !isNaN(year)) {
        // Create a new Date object for the specified month and year
        result = new Date(year, month, 1);
      }
    }
    return result;
  }
  getMonthIndex(monthName: string): number {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.indexOf(monthName);
  }
  async Savewithemail() {
    try {
      this.tabProject.forEach((project) => {
        this.projectService.updateProjectsMonth(project.id, this.currentUser, project.days);
      });
      console.log(this.nameMonth + '_' + this.year);

      let data = {
        "nameRequest": this.displayNamecurent,
        "uid": this.currentUser,
        "date": new Date(this.transfertdate(this.nameMonth + '_' + this.year)),
        "month": this.nameMonth,
        "year": this.year
      }
      this.projectService.sendNotificationToAdmin(data);
      handleResponseSuccessWithAlerts(
        this.transloco.translate('features.projects.dialog.success.title'),
        this.transloco.translate('features.projects.dialog.success.message'),
        this.transloco.translate('common.close'),
        () => { }

      );
      this.status = 'Submitted';
      this.changeStatus();
      this.fetchProjects()
    } catch (error) {
      console.error('Error adding project via ProjectService:', error);
    }
  }
  async sendmail(Type) {
    let user;
    user = await this.projectService.getuserbyid(this.currentUser);
    if (user) {
      let data = {
        "nameRequest": user.displayName,
        "AdminName": this.displayNamecurent,
        'email': user.email,
        "uid": this.currentUser,
        "type": Type,
        "date": new Date(this.transfertdate(this.nameMonth + '_' + this.year)),
        "month": this.nameMonth,
        "year": this.year
      }

      this.projectService.sendNotificationToUser(data).then(li => {
        console.log("done");

      })
      handleResponseSuccessWithAlerts(
        this.transloco.translate('features.projects.dialog.success.title'),
        this.transloco.translate('features.projects.dialog.success.message'),
        this.transloco.translate('common.close'),
        () => { }

      );
    }
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
    this.numberDayNextMonth = this.dateService.getDaysInMonth(this.month2 + 1, this.year);

    // Regenerate the resultTimesheet array with the new month's data and weekend status
    this.resultTimesheet = this.generateTimesheet(this.year, this.nameMonth, this.numberDayNextMonth)
      .map((day) => ({
        ...day,
        isWeekend: this.isWeekendDay(day.year, this.month2, day.day),
        inputValue: day.nbHeure || '',
      }));
  }


  getNameDate(year: number, month: number, day: number): string {
    return this.dateService.getNameDate(year, month, day);
  }

  private generateTimesheet(year: number, month: string, numberOfDays: number): TimesheetItem[] {
    const timesheet: TimesheetItem[] = [];
    for (let i = 1; i <= numberOfDays; i++) {
      timesheet.push({
        project: this.projectName,
        year: year,
        month: month,
        day: i,
        nameDay: this.getNameDate(year, this.month2, i),
        numberDay: numberOfDays,
        nbHeure: '',
        nbTotal: '',
        projectTotal: '',
      });
    }

    return timesheet;
  }

  private isWeekendDay(year: number, month: number, day: number): boolean {
    const dayOfWeek = new Date(year, month, day).getDay();
    return dayOfWeek === 0 /* Sunday */ || dayOfWeek === 6 /* Saturday */;
  }

  getInputValeur(value: number, day: TimesheetItem): void {
    const oldValue = day.nbHeure || '';
    if (!this.isWeekendDay(day.year, this.month2, day.day)) {
      day.nbHeure = value;
      this.totalHours[day.day - 1] = (this.totalHours[day.day - 1]) + Number(value);
    }
    if (!this.isWeekendDay(day.year, this.month2, day.day) && oldValue > 0) {
      this.totalHours[day.day - 1] -= value;
    }

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
  getTimesheet(): void {
    this.numberOfDay = this.dateService.getDaysInMonth(this.year, this.month2);
    this.resultTimesheet = this.generateTimesheet(this.year, this.nameMonth, this.numberOfDay)
      .map((day) => ({
        ...day,
        isWeekend: this.isWeekendDay(day.year, this.month2, day.day),
        inputValue: day.nbHeure || '',
      }));
    this.updateMonthYear(this.month2, this.year);


  }
  changetotal() {
    this.init_total()
    this.tabProject.forEach((project) => {
      for (let index = 0; index < project.days.length; index++) {
        const element = project.days[index];
        this.resultTimesheet[index].nbHeure = (+this.resultTimesheet[index].nbHeure) + (+element.nbHeure) === 0 ? '' : (+this.resultTimesheet[index].nbHeure) + (+element.nbHeure) || '';

        if (this.resultTimesheet[index].nbHeure > 8) {
          displayAlertwarning(
            "Attention :",
            'Ok',
            this.transloco.translate('features.projects.dialog.warning.message'),
          )
        }
      }

    });
  }
  day_offs: number[] = []
  init_total() {
    this.resultTimesheet = this.generateTimesheet(this.year, this.nameMonth, this.numberDayNextMonth)
      .map((day) => ({
        ...day,
        isWeekend: this.isWeekendDay(day.year, this.month2, day.day),
        inputValue: day.nbHeure || '',
      }));
  }
  filterprojects() {
    this.day_offs = []
    this.day_offService.fetchAllKeyDay_off(this.nameMonth, this.year).then(day_offs => {
      this.day_offs = day_offs;
      this.init_total()
      this.tabProject.forEach((project) => {
        for (const key in project) {
          const MonthNumber = this.monthToNumber(this.getmonth(key));
          if (MonthNumber == this.month2 && this.year == this.getyear(key)) {
            project.days = project[key];
            for (let index = 0; index < project.days.length; index++) {
              const element = project.days[index] === 0 ? '' : project.days[index] || '';
              element.nbHeure = element.nbHeure === 0 ? '' : element.nbHeure || '';
              this.resultTimesheet[index].nbHeure = (+this.resultTimesheet[index].nbHeure) + (+element.nbHeure) === 0 ? '' : (+this.resultTimesheet[index].nbHeure) + (+element.nbHeure) || '';
            }
            break;
          } else {
            project.days = this.generateTimesheet(this.year, this.nameMonth, this.numberDayNextMonth)
              .map((day) => ({
                ...day,
                isWeekend: this.isWeekendDay(day.year, this.month2, day.day),
                inputValue: day.nbHeure || '',
              }));
          }
        }
      });
      // // console.log(this.tabProject);
      // this.tabProject.map(project=>{
      //   console.log(project.days);

      // })
      this.projectService.getstatus(this.currentUser, this.nameMonth, this.year).then(li => {
        if (li) {
          this.status = li.status;
          this.description = li.description;
        } else {
          this.status = null;
          this.description = null;
        }

      })
    })


  }
  calculateTotalHours(days: any[]): number {
    let totalHours = 0;

    if (days) {
      days.forEach((day) => {
        const hours = parseFloat(day.nbHeure);
        if (!isNaN(hours)) {
          totalHours += hours;
        }
      });
    }

    return totalHours;
  }
  calculateTotalHoursInmonth(): number {
    let totalHours = 0;

    // Boucle à travers chaque élément dans days et additionne les nbHeure

    this.resultTimesheet.map((day) => {
      totalHours += (+day.nbHeure);
    });



    return totalHours;
  }
  calculateDaysFromHours(totalHours) {
    const hoursInADay = 8;
    let final:string='';
    const daysEquivalent = Math.floor(totalHours / hoursInADay);
    const remainingHours = totalHours % hoursInADay;
    if (remainingHours > 0 && daysEquivalent > 0) {
      final=`${daysEquivalent} `+this.transloco.translate('features.timeshet.j')+` & ${remainingHours} `+this.transloco.translate('features.timeshet.h');
    } else {
      if (daysEquivalent <= 0  && remainingHours > 0) {
        final=`${remainingHours} `+this.transloco.translate('features.timeshet.heures');
      } else {
        if(remainingHours <= 0 && daysEquivalent > 0){
          final=`${daysEquivalent} `+this.transloco.translate('features.timeshet.jours');;
        }
      }
    }

    return final;
  }
  async changeStatus(): Promise<void> {
    try {
      let data = {
        'description': this.description,
        'status': this.status,
      }
      this.projectService.updatestatusbyUidandMonth(this.currentUser, this.nameMonth, this.year, data);
      this.description = ''
    } catch (error) {
      console.error('Error fetching projects via ProjectService:', error);
    }
  }
  async fetchProjects(): Promise<void> {
    try {
      this.allprojects = await this.projectService.fetchProjects(this.currentUser);
      this.tabProject = this.allprojects


      // Triez le tableau en plaçant l'objet avec name: "Maladie" en dernier
      this.tabProject.sort((a, b) => {
        if ((a.name === "Maladie" && b.name !== "Maladie") || (a.name === "Vacances" && b.name !== "Vacances") || (a.name === "Disponible" && b.name !== "Disponible")) {
          return 1; // Mettez "Maladie" en dernier
        } else if ((a.name !== "Maladie" && b.name === "Maladie") || (a.name !== "Vacances" && b.name === "Vacances") || (a.name !== "Disponible" && b.name === "Disponible")) {
          return -1; // Mettez "Maladie" en premier
        } else {
          return 0; // Les autres éléments restent dans l'ordre actuel
        }
      });
      this.filterprojects();

    } catch (error) {
      console.error('Error fetching projects via ProjectService:', error);
    }
  }
  getmonth(dateString) {
    const parts = dateString.split('_');

    if (parts.length >= 1) {
      const month = parts[0];
      return month
    } else {
    }
  }
  getyear(dateString) {
    const parts = dateString.split('_');
    if (parts.length >= 2) {
      const year = parts[1];
      return year
    } else {
      return null
    }
  }
  getMonthIndexFromName(monthName: string): number {
    return Months.indexOf(monthName); // Assuming Months array contains month names
  }

}
