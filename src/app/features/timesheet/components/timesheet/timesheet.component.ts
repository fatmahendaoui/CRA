import { Component, OnInit, Input, inject, ChangeDetectorRef } from '@angular/core';
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
import { ProfileService } from 'src/app/services/profile.service';
import { Brand, Group, Marque, Media, Product } from 'src/app/features/projects/models/Project.model';

// Définir une interface pour représenter un jour
interface Day {
  year: number;
  month: number;
  day: number;
  nameDay: string;
  isWeekend: boolean; // Ajoutez la propriété isWeekend
}

// Définir une interface pour représenter une semaine
interface Week {
  days: Day[];
}

@Component({
  selector: 'app-timesheet',
  templateUrl: './timesheet.component.html',
  styleUrls: ['./timesheet.component.scss']
})

export class TimesheetComponent implements OnInit {
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
  days: string[] = DaysOfWeek;
  month: string[] = Months;
  weeks: Week[] = [];
  theDate: Date;
  nameMonth: string;
  nameDay: string;
  month2: number;
  year: number;
  myMonth: number;
  numberOfDay: number;
  isWeekend: boolean = false;
  totalHours: number[] = [];
  private readonly usersService = inject(UsersService);
  private readonly day_offService = inject(Day_offService);
  private readonly transloco = inject(TranslocoService);
  private readonly auth = inject(Auth);
  users: User[]
  currentUser;
  description: string | null = '';
  status: string | null;
  IsAdmin: boolean;
  IsManager: boolean;
  displayNamecurent;
  appliedGroup: string | null = null;
  appliedBrand: string | null = null;
  appliedProduct: string | null = null;
  appliedMarque: string | null = null;
  appliedMedia: string | null = null;
  public cdr: ChangeDetectorRef;

  private monthNames = {
    en: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    fr: [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
  };
  constructor(
    private dateService: DateService,
    private projectService: ProjectService,
    private profileService: ProfileService
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
      this.projectService.checkUserAccessManager().then(li => {
        this.IsManager = li
      })
      this.auth.onAuthStateChanged((user) => {
        if (user) {
          this.displayNamecurent = user.displayName;
        }
      });
    });
    this.fetchAll()

  }

  // method to fetch all users and filter based on manager access
  public fetchAll(): void {
    this.usersService.fetchAllUsers().subscribe(users => {
      if (this.IsManager) {
        this.usersService.groupUserManagerObserv(this.auth.currentUser!.uid).subscribe(managerEmails => {
          // Filter users to exclude those managed by the current user
          this.users = users.filter(user => managerEmails.includes(user.email));
        }, error => {
          console.error('Error fetching manager emails:', error);
        });
      } else {
        this.users = users;
      }
    }, error => {
      console.error('Error fetching users:', error);
    });
  }

  ngOnInit(): void {
    this.getTimesheet();
    this.splitDaysIntoWeeks(this.resultTimesheet);
    this.getGroups(this.currentUser)
  }

  // get by month
  getMonth(op: boolean): void {
    const newMonth = op ? this.month2 + 1 : this.month2 - 1;
    let newYear = this.year;
    const wrappedMonth = (newMonth + 12) % 12;

    this.updateMonthYear(wrappedMonth, newYear);
    this.updateMonthYear(newMonth, newYear);
    this.filterprojects();
  }
  // get by year
  getYear(op: boolean): void {
    const newYear = this.year + (op ? 1 : -1);
    this.year = newYear;
    this.updateMonthYear(this.month2, newYear);
    this.filterprojects();
  }
  // method to save the timesheet
  async Save() {
    try {
      console.log("test 0000 : ", this.tabProject);
      this.tabProject.forEach((project) => {
        this.status = "";
        this.projectService.updateProjectsMonth(project.id, this.currentUser, project.days);
        this.changeStatus(this.status)
        if (this.description) {
          console.log("test 0000 : ", this.description);
          this.projectService.updateDescription(this.currentUser, this.nameMonth, this.year, this.description); // Mettre à jour la description
        }
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
  // method to transfer the date from string to date object
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
  // method to get the index of the month from the name
  getMonthIndex(monthName: string): number {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.indexOf(monthName);
  }
  // method to save the timesheet and send email notifications
  async Savewithemail() {
    try {
      // Parcourir les projets et mettre à jour les informations
      this.tabProject.forEach((project) => {
        this.projectService.updateProjectsMonth(project.id, this.currentUser, project.days);
      });

      // Définir les données pour la notification
      let data = {
        "nameRequest": this.displayNamecurent,
        "uid": this.currentUser,
        "date": new Date(this.transfertdate(this.nameMonth + '_' + this.year)),
        "month": this.nameMonth,
        "year": this.year
      };

      // Envoyer la notification à l'administrateur
      await this.projectService.sendNotificationToAdmin(data);

      // Modifier le statut à "Submitted"
      this.status = 'Submitted';
      await this.changeStatus(this.status);

      // Mettre à jour l'interface utilisateur
      this.fetchProjects();
      this.filterprojects();

      // Afficher un message de succès
      handleResponseSuccessWithAlerts(
        this.transloco.translate('features.projects.dialog.success.title'),
        this.transloco.translate('features.projects.dialog.success.message'),
        this.transloco.translate('common.close'),
        () => { }
      );
    } catch (error) {
      console.error('Error adding project via ProjectService:', error);
    }
  }
  // method to change the status of the timesheet
  changestatus(): void {
    setTimeout(() => {
      this.cdr.detectChanges()
      this.cdr.markForCheck()
    }, 500)
  }
  // method to send email notifications
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
  // method to handle user selection
  async onUserSelect(currentUser: any): Promise<void> {
    console.log("User selected: ", currentUser);
    if (currentUser) {
      try {
        this.resetFilters()
        this.getGroups(currentUser)
        const description = await this.projectService.getDescription(currentUser, this.nameMonth, this.year);
        this.description = description; // Store the description in a variable
        console.log("Description fetched: ", this.description);
      } catch (error) {
        console.error("Error fetching description: ", error);
      }
    }
  }

  // method to update the month and year based on user input
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

  // method to get the name of the date
  getNameDate(year: number, month: number, day: number): string {
    return this.dateService.getNameDate(year, month, day);
  }
  // method to generate the timesheet for a given month and year
  private generateTimesheet(year: number, month: string, numberOfDays: number): TimesheetItem[] {
    const timesheet: TimesheetItem[] = [];
    let currentWeek: TimesheetItem[] = [];

    for (let i = 1; i <= numberOfDays; i++) {
      // Vérifiez si le jour est un jour de week-end ou un jour férié avant de l'ajouter
      if (!this.isWeekendDay(year, this.monthToNumber(month), i)) {
        currentWeek.push({
          project: this.projectName,
          year: year,
          month: month,
          day: i,
          nameDay: this.getNameDate(year, this.monthToNumber(month), i),
          numberDay: numberOfDays,
          nbHeure: '',
          nbTotal: '',
          projectTotal: '',
        });
      }

      // Si le jour est un samedi ou le dernier jour du mois, ajoutez la semaine actuelle au timesheet
      if (currentWeek.length === 5 || i === numberOfDays) {
        timesheet.push(...currentWeek);
        currentWeek = []; // Réinitialiser la semaine
      }
    }

    return timesheet;
  }
  // method to check if a day is a weekend
  private isWeekendDay(year: number, month: number, day: number): boolean {
    const dayOfWeek = new Date(year, month, day).getDay();
    return dayOfWeek === 0 /* Sunday */ || dayOfWeek === 6 /* Saturday */;
  }
  // method to get the input value and update the total hours for each day
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
  // method to convert month name to number
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
  // method to get the timesheet for a given month and year
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
  // method to change the total hours in the timesheet 
  changetotal() {
    this.init_total()
    console.log("bebebebbe", this.tabProject)
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
  // method to initialize the total hours for each day
  init_total() {

    this.resultTimesheet = this.generateTimesheet(this.year, this.nameMonth, this.numberDayNextMonth)
      .map((day) => ({
        ...day,
        isWeekend: this.isWeekendDay(day.year, this.month2, day.day),
        inputValue: day.nbHeure || '',
      }));

  }
  // method to check if a day is a day off
  isDayOff(day: number): boolean {
    const isDayOff = this.day_offs.includes(day);
    return isDayOff;
  }
  // method to filter projects based on selected group, brand, product, and marque
  filterprojects() {
    this.day_offs = []
    this.day_offService.fetchAllKeyDay_off(this.nameMonth, this.year, this.profileService.profile.idDomaine).then(day_offs => {
      this.day_offs = day_offs;
      this.init_total()
      this.tabProject.forEach((project) => {
        for (const key in project) {
          const MonthNumber = this.monthToNumber(this.getmonth(key));
          if (MonthNumber == this.month2 && this.year == this.getyear(key)) {
            project.days = project[key].filter((day) => !this.isWeekendDay(day.year, this.month2, day.day));
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
          console.log("status....", li.status);
          this.status = li.status;
          this.description = li.description;
        } else {
          this.status = null;
          this.description = li.description;
        }

      })
    })


  }
  // method to calculate the total hours in a project
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
  // function to calculate the total hours in the month
  calculateTotalHoursInmonth(): number {
    let totalHours = 0;
    this.resultTimesheet.map((day) => {
      totalHours += (+day.nbHeure);
    });



    return totalHours;
  }
  // method to calculate the days from hours
  calculateDaysFromHours(totalHours) {
    const hoursInADay = 8;
    let final: string = '';
    const daysEquivalent = Math.floor(totalHours / hoursInADay);
    const remainingHours = totalHours % hoursInADay;
    if (remainingHours > 0 && daysEquivalent > 0) {
      final = `${daysEquivalent} ` + this.transloco.translate('features.timeshet.j') + ` & ${remainingHours} ` + this.transloco.translate('features.timeshet.h');
    } else {
      if (daysEquivalent <= 0 && remainingHours > 0) {
        final = `${remainingHours} ` + this.transloco.translate('features.timeshet.heures');
      } else {
        if (remainingHours <= 0 && daysEquivalent > 0) {
          final = `${daysEquivalent} ` + this.transloco.translate('features.timeshet.jours');;
        }
      }
    }

    return final;
  }
  // method to change the status of the timesheet
  async changeStatus(status): Promise<void> {
    const idDomaine = await this.profileService.getIdDomaine();
    try {
      let data = {
        'description': this.description,
        'status': status,
        'idDomaine': idDomaine,
      }

      this.projectService.updatestatusbyUidandMonth(this.currentUser, this.nameMonth, this.year, data);
      //this.description = ''
    } catch (error) {
      console.error('Error fetching projects via ProjectService:', error);
    }
  }

  //method to fetch projects
  async fetchProjects(): Promise<void> {
    try {
      this.allprojects = await this.projectService.fetchProjects(this.currentUser);
      this.tabProject = this.allprojects;
      console.log("allprojects", this.allprojects)

      // Tri des projets : "Maladie", "Vacances" et "Disponible" en dernier
      this.tabProject.sort((a, b) => {
        const specialProjects = ["Maladie", "Vacances", "Disponible"];
        console.log("AAA", a, "BBBBB", b)
        return specialProjects.includes(a.name) && !specialProjects.includes(b.name) ? 1
          : !specialProjects.includes(a.name) && specialProjects.includes(b.name) ? -1
            : 0;
      });
      this.filterprojects();

      //this.applyFilters(); // Appliquer le filtrage initial
    } catch (error) {
      console.error('Error fetching projects via ProjectService:', error);
    }
  }
  //method to get the month from the date string
  getmonth(dateString) {
    const parts = dateString.split('_');

    if (parts.length >= 1) {
      const month = parts[0];
      return month
    } else {
    }
  }
  //method to get the year from the date string
  getyear(dateString) {
    const parts = dateString.split('_');
    if (parts.length >= 2) {
      const year = parts[1];
      return year
    } else {
      return null
    }
  }
  //method to get the index of the month from the name
  getMonthIndexFromName(monthName: string): number {
    return Months.indexOf(monthName); // Assuming Months array contains month names
  }
  //fuction to get the ISO week number of a date
  getISOWeek(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
  // Fonction pour diviser les jours en semaines
  splitDaysIntoWeeks(days: TimesheetItem[]): void {
    const weeks: Week[] = [];
    let currentWeek: Week = { days: [] };

    days.forEach((day, index) => {
      // Convert TimesheetItem to Day
      const convertedDay: Day = {
        year: day.year,
        month: this.monthToNumber(day.month),
        day: day.day,
        nameDay: day.nameDay,
        isWeekend: (day as any).isWeekend
      };
      currentWeek.days.push(convertedDay);
      // If the day is a Sunday or the last day of the month
      if (day.nameDay === 'Sunday' || index === days.length - 1) {
        weeks.push(currentWeek);
        currentWeek = { days: [] }; // Reset the week
      }
    });

    this.weeks = weeks;
  }
// method to get the groups by domain
  async getGroups(usersId) {
    console.log('hello : ',)
    const domainId = this.profileService.profile.idDomaine; // Récupérer le domaine actuel
    this.allprojects = await this.projectService.fetchProjects(usersId); // Charger les projets de l'utilisateur

    const allGroups = await this.projectService.getGroupsByDomain(domainId); // Charger tous les groupes du domaine
    this.groups = allGroups.filter(group =>
      this.allprojects.some(project => project.groupId === group.id)
    );
  }
// method to get the brand by group
  async onGroupSelected() {
    // this.applyFilters();
    this.selectedBrand = '';
    this.selectedProduct = '';
    this.selectedMarque = '';
    if (this.selectedGroup) {
      this.allprojects = await this.projectService.fetchProjects(this.currentUser);
      console.log("shshhshshshh", this.fetchProjects())
      const allBrands = await this.projectService.getBrandsByGroup(this.selectedGroup);
      this.brands = allBrands.filter(brand =>
        this.allprojects.some(project => project.brandId === brand.id)
      );
    }
  }
  // method to get the product by brand
  async onBrandSelected() {
    this.selectedProduct = '';
    this.selectedMarque = '';
    if (this.selectedGroup && this.selectedBrand) {
      this.allprojects = await this.projectService.fetchProjects(this.currentUser);

      const allProducts = await this.projectService.getProductsByBrand(this.selectedGroup, this.selectedBrand);
      this.products = allProducts.filter(product =>
        this.allprojects.some(project => project.productId === product.id)
      );
    }
  }
  // method to get the marque by product
  async onProductSelected() {
    this.selectedMarque = '';

    if (this.selectedGroup && this.selectedBrand && this.selectedProduct) {
      this.allprojects = await this.projectService.fetchProjects(this.currentUser);

      const allMarques = await this.projectService.getMarquesByProduct(this.selectedGroup, this.selectedBrand, this.selectedProduct);
      this.marques = allMarques.filter(marque =>
        this.allprojects.some(project => project.marqueId === marque.id)
      );
    }
  }
// method to get the media by marque
  async onMarqueSelected() {

    this.selectedMedia = '';

    if (this.selectedGroup && this.selectedBrand && this.selectedProduct && this.selectedMarque) {
      this.allprojects = await this.projectService.fetchProjects(this.currentUser);

      const allMedias = await this.projectService.getMediaByMarque(this.selectedGroup, this.selectedBrand, this.selectedProduct, this.selectedMarque);
      this.medias = allMedias.filter(media =>
        this.allprojects.some(project => project.mediaId === media.id)
      );
    }
  }
 // method to apply filters
  applyFilters() {
    this.appliedGroup = this.selectedGroup;
    this.appliedBrand = this.selectedBrand;
    this.appliedProduct = this.selectedProduct;
    this.appliedMarque = this.selectedMarque;
    this.appliedMedia = this.selectedMedia;

  }
  // method to reset all filters
  resetFilters() {
    this.selectedGroup = '';
    this.selectedBrand = '';
    this.selectedProduct = '';
    this.selectedMarque = '';
    this.selectedMedia = '';

    this.appliedGroup = null;
    this.appliedBrand = null;
    this.appliedProduct = null;
    this.appliedMarque = null;
    this.appliedMedia = null;
    this.brands = [];
    this.products = [];
    this.marques = [];
    this.medias = [];

    // Call any additional functions to refresh data if necessary
    this.fetchProjects();
  }
 // method to calculate the total hours for all projects
  calculateTotalHoursAllProjects(): number {
    let totalHours = 0;

    this.tabProject.forEach((project) => {
      project.days.forEach((day) => {
        const hours = parseFloat(day.nbHeure);
        if (!isNaN(hours)) {
          totalHours += hours;
        }
      });
    });

    return totalHours;
  }
// method to toggle the visibility of filters
  showFilters: boolean = true; 
  toggleFilter() {
    this.showFilters = !this.showFilters; // Toggle the visibility
  }
}

