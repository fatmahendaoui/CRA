import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { startOfWeek, addDays, format, addWeeks, subWeeks } from 'date-fns';
import { RemoteService } from './services/remoteservice.service';
import { Day_offService } from '../day_offs/services/day_off.service';
import { CongeService } from '../conges/services/conge.service';
import Swal from 'sweetalert2';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../sign-in/services/auth.service';
import { Auth, user } from '@angular/fire/auth';
import { ProfileService } from 'src/app/services/profile.service';
import { TranslocoService } from '@ngneat/transloco';
/*
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import { CalendarOptions } from '@fullcalendar/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
 */
@Component({
  selector: 'app-remote',
  templateUrl: './remote.component.html',
  styleUrls: ['./remote.component.scss']
})
export class RemoteComponent implements OnInit {
  displayNames: { name: string, photoURL: string, id: string }[] = [];
  currentWeekStart: Date = new Date();
  currentWeekDays: { date: string, isDayOff: boolean }[] = [];
  selectedImage: { [key: number]: { [key: number]: { image: string } } } = {};
  showChoices: { [key: number]: { [key: number]: boolean } } = {};
  daysOff: string[] = [];
  isInsideChoice: boolean = false;
  formattedConges;
  selectedFilter: string = 'all';
  filteredDisplayNames: { name: string, photoURL: string ,id:string}[] = [];
  filterText: string = '';
  filteredSelectedImage: { [key: number]: { [key: number]: { image: string } } } = {};
  userRole: string; 
  selectedView: string = 'week';
  headerText: string;
  currentUserId: string | null = null; 
  public isAdmin: boolean = true;
  public isNotManager: boolean = true;


  constructor(
    private remoteService: RemoteService,
    private dayOffService: Day_offService,
    private congeService: CongeService,
    private changeDetectorRef: ChangeDetectorRef,
    private authS: AuthService,
    private auth: Auth,
    private profileService: ProfileService,
    private translocoService: TranslocoService
  ) {
    this.currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    this.addTripImageToCurrentWeekDays();

  }

  async ngOnInit(): Promise<void> {
    this.loadFromFirebase(this.getStorageKey());
    await this.loadUserRole();
    this.loadDisplayNames();
    this.updateCurrentWeekDays();
    this.loadSavedChanges();
    this.loadDaysOff();
    this.loadApprovedConges()
    this.fetchApprovedCongesInfo();
    this.filteredDisplayNames = [...this.displayNames];
    // Vérifier l'accès de l'utilisateur
    this.checkUserAccess();
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    if (!this.isInsideChoice) {
      this.closeAllChoices();
    }
    this.isInsideChoice = false;
  }
// function to load user role
  async loadUserRole(): Promise<void> {
    try {
      this.userRole = await this.profileService.getUserRole();
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  }
// function to mark as inside choice
  markAsInsideChoice() {
    this.isInsideChoice = true;
  }
// function to close all choices
closeAllChoices() {
  this.displayNames.forEach((displayName) => {
    const userId = displayName.id;
    if (this.showChoices[userId]) {
      this.currentWeekDays.forEach((day) => {
        const dateKey = day.date;
        if (this.showChoices[userId][dateKey] !== undefined) {
          this.showChoices[userId][dateKey] = false;
        }
      });
    }
  });
}

// function to load display names
async loadDisplayNames() {
  try {
    this.displayNames = await this.remoteService.getAllDisplayNames();
    this.currentUserId = await this.authS.getCurrentUserId();
    this.displayNames.sort((a, b) => {
     if (a.id ===  this.currentUserId) return -1; 
       if (b.id ===  this.currentUserId) return 1;
      if (a.name < b.name) { return -1; }
      if (a.name > b.name) { return 1; }
      return 0;
    });
    // Initialize structures for `selectedImage` and `showChoices`
    this.displayNames.forEach((displayName) => {
      const userId = displayName.id;
      if (!this.selectedImage[userId]) this.selectedImage[userId] = {};
      if (!this.showChoices[userId]) this.showChoices[userId] = {};

      this.currentWeekDays.forEach((day) => {
        const dateKey = day.date;
        if (!this.selectedImage[userId][dateKey]) {
          this.selectedImage[userId][dateKey] = { image: 'plus' };
        }
        if (!this.showChoices[userId][dateKey]) {
          this.showChoices[userId][dateKey] = false;
        }
      });
    });

    this.filteredDisplayNames = [...this.displayNames];
    this.filteredSelectedImage = this.filterSelectedImages();
  } catch (error) {
    console.error('Error loading display names:', error);
  }
}


// function to update current week days
updateCurrentWeekDays() {
  this.currentWeekDays = [];
  // Iterate through each day of the current week
  for (let i = 0; i < 7; i++) {
    const day = addDays(this.currentWeekStart, i);
    const formattedDate = format(day, 'EEEE, MMMM d');
    const dayName = format(day, 'EEEE'); 

    // Skip weekends (Saturday and Sunday)
    if (dayName !== 'Saturday' && dayName !== 'Sunday') {
      const isDayOff = this.daysOff.includes(formattedDate);

      // Add the day to the current week days array
      this.currentWeekDays.push({ date: formattedDate, isDayOff });

      // Ensure `selectedImage` and `showChoices` structures are initialized for each user and date
      this.displayNames.forEach((displayName) => {
        const userId = displayName.id;
        if (!this.selectedImage[userId]) this.selectedImage[userId] = {};
        if (!this.showChoices[userId]) this.showChoices[userId] = {};

        if (!this.selectedImage[userId][formattedDate]) {
          this.selectedImage[userId][formattedDate] = { image: 'plus' };
        }
        if (!this.showChoices[userId][formattedDate]) {
          this.showChoices[userId][formattedDate] = false;
        }
      });
    }
  }
}




// function to previous week
  async previousWeek() {
    this.currentWeekStart = subWeeks(this.currentWeekStart, 1);
    this.updateCurrentWeekDays();
    this.loadSavedChanges();
    this.loadDaysOff();
    await this.addTripImageToCurrentWeekDays();
  }
// function to next week
 async nextWeek() {
    this.currentWeekStart = addWeeks(this.currentWeekStart, 1);
    this.updateCurrentWeekDays();
    this.loadSavedChanges();
    this.loadDaysOff();
    await this.addTripImageToCurrentWeekDays();
  }
// function to format date
  formatDate(date: Date, dateFormat: string): string {
    return format(date, dateFormat);
  }
// function to get image url
  getImageUrl(image: string): string {
    switch (image) {
      case 'remote':
        return 'assets/images/remote.png';
      case 'trip':
        return 'assets/images/hol.jpg';
      case 'client':
        return 'assets/images/client.png';
      case 'auto':
        return 'assets/images/auto.jpg';
      case 'maladie':
        return 'assets/images/maladie.png';
      default:
        return '';
    }
  }
// function to show image choices
showImageChoices(userId: string, dateKey: string) {
  if (!this.selectedImage[userId]) {
    console.error(`No data found for userId: ${userId}`);
    this.selectedImage[userId] = {}; 
  }
  if (!this.selectedImage[userId][dateKey]) {
    console.error(`No data found for dateKey: ${dateKey}`);
    this.selectedImage[userId][dateKey] = { image: 'plus' }; 
  }
  if (this.selectedImage[userId][dateKey].image === 'plus' && this.userCanModify(userId, dateKey)) {
    this.markAsInsideChoice();
    this.showChoices[userId][dateKey] = !this.showChoices[userId][dateKey];
  }
}

// function to toggle image choices
  toggleImageChoices(i: string, j: string) {
    if (this.selectedImage[i][j].image !== 'plus' && this.userCanModify(i, j)) {
      this.markAsInsideChoice();
      this.showChoices[i][j] = !this.showChoices[i][j];
    }
  }
  loadPreviousWeekRemoteDays(i, j) {
    const previousWeekStart = subWeeks(this.currentWeekStart, 1);
    const previousWeekDay = addDays(previousWeekStart, this.currentWeekDays.findIndex(day => day.date === j));
  
    // Format the previousWeekDay to display DAY, Month Date (in English)
    const formattedDate = previousWeekDay.toLocaleDateString('en-US', {
      weekday: 'long', // Full day of the week (e.g., 'Thursday')
      month: 'long',   // Full month name (e.g., 'January')
      day: 'numeric',  // Numeric day (e.g., '30')
    });
  
    console.log("previousWeekDay:", formattedDate);
  }
  
  
// function to select remote image
  selectRemoteImage(i: string, j: string) {
    const previousWeekStart = subWeeks(this.currentWeekStart, 1);
    const previousWeekDay = addDays(previousWeekStart, this.currentWeekDays.findIndex(day => day.date === j));
  
    // Format the previousWeekDay to display DAY, Month Date (in English)
    const formattedDate = previousWeekDay.toLocaleDateString('en-US', {
      weekday: 'long', // Full day of the week (e.g., 'Thursday')
      month: 'long',   // Full month name (e.g., 'January')
      day: 'numeric',  // Numeric day (e.g., '30')
    });
    console.log("this.selectedImage[i][previousWeekDay]:", this.selectedImage[i][formattedDate]);
    console.log("this.selectedImage[i][formattedDate]:", this.selectedImage[i][formattedDate].image === 'remote');
    if (this.selectedImage[i] && this.selectedImage[i][formattedDate] && this.selectedImage[i][formattedDate].image === 'remote') {
      Swal.fire({
        icon: 'error',
        title: 'Restriction de télétravail',
        text: `Vous ne pouvez pas sélectionner le même jour de télétravail deux semaines de suite (${j}).`,
        confirmButtonText: 'OK'
      });
      return;
    }
 this.loadPreviousWeekRemoteDays(i,j);
    const remoteDaysCount = this.calculateRemoteTotalForDay(j);
    if (!this.isAdmin && remoteDaysCount >= 5) {
      Swal.fire({
        icon: 'warning',
        iconColor: 'rgb(239, 64, 100)',
       // title: this.translocoService.translate('features.remote.attention'),
        text: this.translocoService.translate('features.remote.limit_remote_days'),
        input: 'textarea',
        inputPlaceholder: this.translocoService.translate('features.remote.comment'),
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonText: 'Annuler',
        confirmButtonColor: 'rgb(239, 64, 100)' ,
        cancelButtonColor: '#193F77',
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const comment = result.value;
          let userName = '';
          this.filteredDisplayNames.forEach((displayName) => {
            if (i === displayName.id) {
               userName = displayName.name;
            }
          });
          console.log("userName",userName);
          console.log("comment",comment);
          console.log("j :",j);
          let data ={ 
            Name:userName, 
            Comment:comment,
            Date: j }
         this.remoteService.sendEmailRemoteExeption(data);
        }
      });
      return; 
    }
    console.log("i : ",i ,"j : ",j);
    this.selectedImage[i][j] = { image: 'remote' };
    this.showChoices[i][j] = false;
    this.saveToLocalStorage();
    this.saveChanges();
  }
// function to select trip image
  selectTripImage(i: string, j: string) {
    this.selectedImage[i][j] = { image: 'hol' };
    this.showChoices[i][j] = false;
    this.saveToLocalStorage();
    this.saveChanges();
  }
// function to  select client image
  selectClientImage(i: string, j: string) {
    this.selectedImage[i][j] = { image: 'client' };
    this.showChoices[i][j] = false;
    this.saveToLocalStorage();
    this.saveChanges();
  }
// function to select auto image
  selectAutoImage(i: string, j: string) {
    this.selectedImage[i][j] = { image: 'auto' };
    this.showChoices[i][j] = false;
    this.saveToLocalStorage();
    this.saveChanges();
  }

  getStorageKey(): string {
    return `${this.formatDate(this.currentWeekStart, 'd MMMM , yyyy')}`;
  }
// function to save chnages 
  async saveChanges() {
    const storageKey = this.getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(this.selectedImage));
    try {
      await this.remoteService.saveToFirebase(storageKey, this.selectedImage);
      Swal.fire({
        icon: 'success',
        title: 'Changes saved successfully!',
        showConfirmButton: false,
        timer: 2000
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to save changes!',
        showConfirmButton: true
      });
    }
  }
  async loadSavedChanges(): Promise<void> {
    const storageKey = this.getStorageKey();
    try {
      // Attempt to load data from Firebase
      const firebaseData = await this.remoteService.loadAllFromFirebase(storageKey);
  
      if (firebaseData) {
        // If data exists in Firebase, load it
        this.selectedImage = firebaseData;
      } else {
        // If no data exists in Firebase, initialize with default values for all users
        this.selectedImage = {};
        this.displayNames.forEach((displayName) => {
          const userId = displayName.id;
          if (!this.selectedImage[userId]) this.selectedImage[userId] = {};
          this.currentWeekDays.forEach((day) => {
            const dateKey = day.date;
            if (!this.selectedImage[userId][dateKey]) {
              this.selectedImage[userId][dateKey] = { image: 'plus' };
            }
          });
        });
  
        // Save the initialized data to Firebase
        await this.remoteService.saveToFirebase(storageKey, this.selectedImage);
      }
    } catch (error) {
      console.error('Error loading saved changes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to load saved changes!',
        text: 'Please check your connection and try again.',
        showConfirmButton: true,
      });
    }
  
    // Ensure structures for `showChoices` are initialized
    this.displayNames.forEach((displayName) => {
      const userId = displayName.id;
      if (!this.showChoices[userId]) this.showChoices[userId] = {};
      this.currentWeekDays.forEach((day) => {
        const dateKey = day.date;
        if (!this.showChoices[userId][dateKey]) {
          this.showChoices[userId][dateKey] = false;
        }
      });
    });
  }
  
  

  loadDaysOff() {
    this.dayOffService.fetchAlldaysoff().subscribe({
      next: (daysOff) => {
        this.daysOff = daysOff.map(dayOff => format(new Date(dayOff.date), 'EEEE, MMMM d'));
        this.updateCurrentWeekDays();
       /* this.addDayOffEvents();
        this.refreshCalendar(); // Assurez-vous que les événements sont rafraîchis
     */ },
      error: (error) => {
        console.error('Error loading days off:', error);
      }
    });
  }

  removeImage(i: string, j: string) {
    if (this.userCanModify(i, j)) {
      this.selectedImage[i][j] = { image: 'plus' };
      this.saveToLocalStorage();
      this.saveChanges();
    }
  }
// function to filter display names
  convertUnixTimestamp(unixTimestamp: number): string {
    const date = new Date(unixTimestamp * 1000);
    const day = format(date, 'EEEE');
    const month = format(date, 'MMMM');
    const dayNumber = format(date, 'd');
    return `${day}, ${month} ${dayNumber}`;
  }

  async loadApprovedConges() {
    try {
      const approvedConges = await this.congeService.getApprovedConges();
      this.formattedConges = approvedConges.map(conge => {
        const dateDebut = this.convertUnixTimestamp(conge.dateDebut.seconds);
        const dateFin = this.convertUnixTimestamp(conge.dateFin.seconds);

        return {
          ...conge,
          formattedDateDebut: dateDebut,
          formattedDateFin: dateFin
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des congés approuvés :', error);
    }
  }

  async fetchApprovedCongesInfo() {
    try {
      if (!this.formattedConges || !Array.isArray(this.formattedConges)) {
        console.warn('Aucun congé approuvé disponible.');
        return [];
      }
      const idDomaine = await this.profileService.getIdDomaine();
      const approvedCongesInfo = this.formattedConges.map(conge => {
if (idDomaine===conge.domainId){
  const { formattedDateDebut, nature, displayName, nombreHeures } = conge;
  return {
    formattedDateDebut,
    nature,
    displayName,
    nombreHeures,
  };
}
       
      });

      return approvedCongesInfo;
    } catch (error) {
      console.error('Erreur lors de la récupération des informations des congés approuvés :', error);
      return [];
    }
  }

  async addTripImageToCurrentWeekDays() :Promise<void> {
    const storageKey = this.getStorageKey();
    this.formattedConges.forEach((conge) => {
      const displayName = conge.displayName;
      const userId = conge.userId; 
      const formattedDateDebut = conge.formattedDateDebut;
      const nature = conge.nature;
      let nombreHeures = conge.nombreHeures;
      let dayIndex = this.currentWeekDays.findIndex(day => day.date === formattedDateDebut);

      while (dayIndex !== -1 && nombreHeures > 0) {
        const dateKey = this.currentWeekDays[dayIndex].date; 
        console.log("datekey",dateKey);
        if (!this.selectedImage[userId]) {
          this.selectedImage[userId] = {}; 
        }
        
        if (!this.selectedImage[userId][dateKey]) {
          this.selectedImage[userId][dateKey] = { image: "plus" }; // Initialize image if not present
        }
        // Set the image based on the nature of the conge
        switch (nature) {
          case 'Congé Payé':
            this.selectedImage[userId][dateKey] = { image: "trip" };
            console.log("conger paye",this.selectedImage[userId][dateKey]);
            break;
          case 'Congé de maladie (1 jour)':
            this.selectedImage[userId][dateKey] = { image: "maladie" };
            console.log("conger maladie",this.selectedImage[userId][dateKey],'texttt',userId,dateKey);
            break;
          case 'Autorisation de sortie':
            this.selectedImage[userId][dateKey] = { image: "auto" };
            console.log("autorisation ",this.selectedImage[userId][dateKey],'texttt',userId,dateKey);
            break;
          default:
            this.selectedImage[userId][dateKey] = { image: "plus" };
            break;
        }
        this.saveToLocalStorage(); // Save the updated changes to localStorage

        nombreHeures -= 8; // Deduct 8 hours
        dayIndex++;
        
        // Skip over any days that are days off
        while (dayIndex < this.currentWeekDays.length && this.currentWeekDays[dayIndex].isDayOff) {
          dayIndex++;
        }
        if (dayIndex >= this.currentWeekDays.length && nombreHeures > 0) break;
      }

    });
    await this.remoteService.saveToFirebase(storageKey,this.selectedImage)

  }
  

  refreshUI() {
    this.changeDetectorRef.detectChanges(); 
  }

  filterSelectedImages(): { [key: string]: { [key: string]: { image: string } } } {
    const filteredImages: { [key: string]: { [key: string]: { image: string } } } = {};
    this.filteredDisplayNames.forEach((displayName, i) => {
      const originalIndex = this.displayNames.findIndex(name => name.name === displayName.name);
      if (originalIndex !== -1) {
        filteredImages[i] = { ...this.selectedImage[originalIndex] };
      }
    });
    return filteredImages;
  }

  async loadFromFirebase(storageKey: string): Promise<void> {
    try {
      const data = await this.remoteService.loadAllFromFirebase(storageKey);
      if (data) {
        this.selectedImage = data;
        console.log("datafrom firbase ",data)      
      } else {
        console.error('No data found in Firestore for the given key.');
      }
    } catch (error) {
      console.error('Error loading data from Firestore:', error);
    }
  }

  private saveToLocalStorage() {
    const storageKey = this.getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(this.selectedImage));
  }

  userCanModify(i: string, j: string): boolean {
    if (this.userRole === 'admin') {
      return true; 
    } else {
      const userId =i; 
      return userId === this.authS.getCurrentUserId(); // Seul l'utilisateur peut modifier sa propre ligne
    }
  }

  async goToToday() {
    this.currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    this.updateCurrentWeekDays();
    this.loadSavedChanges();
    this.loadDaysOff();
    await this.addTripImageToCurrentWeekDays();
 
  }
  // function to get remote total for day
calculateRemoteTotalForDay(dayDate: string): number {
  let remoteDaysCount = 0;

  this.displayNames.forEach(displayName => {
    const userId = displayName.id;
    const selectedDayImage = this.selectedImage[userId]?.[dayDate]?.image;

    if (selectedDayImage === 'remote') {
      remoteDaysCount++;
    }
  });

  return remoteDaysCount;
}
  // Méthode pour vérifier l'accès de l'utilisateur
  public async checkUserAccess() {
    // Vérifier si l'utilisateur est un administrateur en utilisant le service de profil
    const queryResult = await this.profileService.checkAdmin(
      this.auth.currentUser!.uid
    );

    // Vérifier si le résultat de la requête contient des documents et si le rôle de l'utilisateur est "admin"
    this.isAdmin =
      queryResult.docs.length > 0 &&
      queryResult.docs[0].data()['role'] === 'admin' || queryResult.docs[0].data()['role'] === 'manager';
    this.isNotManager = queryResult.docs.length > 0 && queryResult.docs[0].data()['role'] === 'admin';
    // Retourner la valeur de isAdmin
    return this.isAdmin;
  }
  isTuesday(date: string): boolean {
    const dayTuesday = date.split(',')[0].trim(); 
   // console.log("dayTuesday",dayTuesday);
    return dayTuesday === "Tuesday"; 
  }
}
