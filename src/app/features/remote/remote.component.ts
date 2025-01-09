import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { startOfWeek, addDays, format, addWeeks, subWeeks } from 'date-fns';
import { RemoteService } from './services/remoteservice.service';
import { Day_offService } from '../day_offs/services/day_off.service';
import { CongeService } from '../conges/services/conge.service';
import Swal from 'sweetalert2';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../sign-in/services/auth.service';
import { ProfileService } from 'src/app/services/profile.service';
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
  // @ViewChild('calendar') calendarComponent: FullCalendarComponent;

  displayNames: { name: string, photoURL: string, id: string }[] = [];
  currentWeekStart: Date = new Date();
  currentWeekDays: { date: string, isDayOff: boolean }[] = [];
  selectedImage: { [key: number]: { [key: number]: { image: string } } } = {};
  showChoices: { [key: number]: { [key: number]: boolean } } = {};
  daysOff: string[] = [];
  isInsideChoice: boolean = false;
  formattedConges;
  selectedFilter: string = 'all';
  filteredDisplayNames: { name: string, photoURL: string }[] = [];
  filterText: string = '';
  filteredSelectedImage: { [key: number]: { [key: number]: { image: string } } } = {};

  /*** */
  userRole: string; // Ajoutez cette propriété
  selectedView: string = 'week';
  headerText: string;

  /**** */
  //Events = [];
  /* Events: Array<{
     title: string;
     start: string;
     display?: string;
     backgroundColor?: string;
     borderColor?: string;
     textColor?: string;
   }> = [];
   calendarToolbarTitle: string = '';
   calendarOptions!: CalendarOptions;
 */
  /**** */
  constructor(
    private remoteService: RemoteService,
    private dayOffService: Day_offService,
    private congeService: CongeService,
    private changeDetectorRef: ChangeDetectorRef,
    private auth: AuthService,
    private profileService: ProfileService
  ) {
    this.currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

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
    this.addTripImageToCurrentWeekDays();
    this.filteredDisplayNames = [...this.displayNames];
    
    /*** */
    /* this.currentWeekStart = new Date();
     this.updateHeaderText();
     /* setTimeout(() => {
        this.calendarOptions = {
          plugins: [interactionPlugin, dayGridPlugin],
          initialView: 'dayGridMonth',
          dateClick: this.onDateClick.bind(this),
          events: this.Events,
          headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          },
          datesSet: this.updateCalendarToolbarTitle.bind(this)
        };
      }, 3500);*/

    /*** */
  }
  /////
  /*
  ngAfterViewInit() {
    this.calendarOptions = {
      plugins: [interactionPlugin, dayGridPlugin],
      initialView: 'dayGridMonth',
      dateClick: this.onDateClick.bind(this),
      events: this.Events,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      eventContent: this.renderEventContent.bind(this),
      datesSet: this.updateCalendarToolbarTitle.bind(this)
    };
    this.updateHeaderText();
  }
  onDateClick(res: { dateStr: string }) {
    console.log('you click : ', res.dateStr);
    // Supposons que vous ayez un tableau d'images à afficher
    const images = [
      { name: 'remote', url: 'assets/images/remote.jpg' },
      { name: 'client', url: 'assets/images/client.jpg' }
    ];
    // Afficher une liste de choix à l'utilisateur
    const selectedImage = window.prompt('Choisissez une image: remote image ou client image', 'remote');

    // Trouver l'image sélectionnée dans le tableau
    const selected = images.find(image => image.name === selectedImage);

    if (selected) {
      const imageUrl = this.getImageUrl(selected.url);
      console.log('Image URL:', imageUrl);
      // Faire quelque chose avec l'URL de l'image, comme l'afficher dans l'interface utilisateur
    } else {
      console.error('Aucune image sélectionnée ou image non trouvée.');
    }

  }

  updateCalendarToolbarTitle(info: any) {
    console.log('updateCalendarToolbarTitle called with:', info);
    if (info && info.view) {
      console.log('info.view:', info.view);
      if (this.selectedView === 'month') {
        this.calendarToolbarTitle = info.view.title;
        console.log('Calendar toolbar title:', this.calendarToolbarTitle);
      } else {
        console.error('Error: info.view.title is undefined.');
      }
    } else {
      console.error('Error: info.view or info.view.title is undefined.');
    }
  }
  navigate(direction: string) {
    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) {
      if (direction === 'prev') {
        calendarApi.prev();
      } else if (direction === 'next') {
        calendarApi.next();
      } const view = calendarApi.view;
      if (view) {
        this.updateCalendarToolbarTitle(view);
      } else {
        console.error('Error: calendarApi.view is undefined.');
      }
    } else {
      console.error('calendarApi is undefined');
    }
  }*/
  //////
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    if (!this.isInsideChoice) {
      this.closeAllChoices();
    }
    this.isInsideChoice = false;
  }

  async loadUserRole(): Promise<void> {
    try {
      this.userRole = await this.profileService.getUserRole();
      console.log('User role:', this.userRole);
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  }

  markAsInsideChoice() {
    this.isInsideChoice = true;
  }

  closeAllChoices() {
    this.displayNames.forEach((_, i) => {
      this.currentWeekDays.forEach((_, j) => {
        this.showChoices[i][j] = false;
      });
    });
  }
  // 
  async loadDisplayNames() {
    try {

      this.displayNames = await this.remoteService.getAllDisplayNames();
      // Récupérer l'utilisateur actuel
      const currentUserId = await this.auth.getCurrentUserId(); // Méthode fictive, ajustez selon votre AuthService
      console.log("test 11111", currentUserId);
      // Trier les noms par ordre alphabétique
      this.displayNames.sort((a, b) => {
        /* if (a.id === currentUserId) return -1; // Mettre l'utilisateur actuel en premier
         if (b.id === currentUserId) return 1;*/
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
      });
      this.displayNames.forEach((_, i) => {
        this.selectedImage[i] = this.selectedImage[i] || {};
        this.showChoices[i] = this.showChoices[i] || {};
        this.currentWeekDays.forEach((_, j) => {
          this.selectedImage[i][j] = this.selectedImage[i][j] || { image: 'plus' };
          this.showChoices[i][j] = this.showChoices[i][j] || false;
        });
      });
      // Assigner les noms triés à filteredDisplayNames
      this.filteredDisplayNames = [...this.displayNames];
      this.filteredSelectedImage = this.filterSelectedImages();
    } catch (error) {
      console.error('Error loading display names:', error);
    }
  }

  updateCurrentWeekDays() {
    this.currentWeekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(this.currentWeekStart, i);
      const dayName = format(day, 'EEEE');
      if (dayName !== 'Saturday' && dayName !== 'Sunday') {
        const formattedDay = format(day, 'EEEE, MMMM d');
        const isDayOff = this.daysOff.includes(formattedDay);
        this.currentWeekDays.push({ date: formattedDay, isDayOff });
      }
    }
    console.log('Current week days:', this.currentWeekDays);
  }

  previousWeek() {
    this.currentWeekStart = subWeeks(this.currentWeekStart, 1);
    this.updateCurrentWeekDays();
    this.loadSavedChanges();
    this.loadDaysOff();
    this.addTripImageToCurrentWeekDays();
  }

  nextWeek() {
    this.currentWeekStart = addWeeks(this.currentWeekStart, 1);
    this.updateCurrentWeekDays();
    this.loadSavedChanges();
    this.loadDaysOff();
    this.addTripImageToCurrentWeekDays();
  }

  formatDate(date: Date, dateFormat: string): string {
    return format(date, dateFormat);
  }

  getImageUrl(image: string): string {
    switch (image) {
      case 'remote':
        return 'assets/images/remote.jpg';
      case 'trip':
        return 'assets/images/hol.jpg';
      case 'client':
        return 'assets/images/client.jpg';
      case 'auto':
        return 'assets/images/auto.jpg';
      case 'maladie':
        return 'assets/images/maladie.jpg';
      default:
        return '';
    }
  }

  showImageChoices(i: number, j: number) {
    if (this.selectedImage[i][j].image === 'plus' && this.userCanModify(i, j)) {
      this.markAsInsideChoice();
      this.showChoices[i][j] = !this.showChoices[i][j];
    }
  }

  toggleImageChoices(i: number, j: number) {
    if (this.selectedImage[i][j].image !== 'plus' && this.userCanModify(i, j)) {
      this.markAsInsideChoice();
      this.showChoices[i][j] = !this.showChoices[i][j];
    }
  }

  selectRemoteImage(i: number, j: number) {
    this.selectedImage[i][j] = { image: 'remote' };
    this.showChoices[i][j] = false;
    this.saveToLocalStorage();
    this.saveChanges();
  }

  selectTripImage(i: number, j: number) {
    this.selectedImage[i][j] = { image: 'hol' };
    this.showChoices[i][j] = false;
    this.saveToLocalStorage();
    this.saveChanges();
  }

  selectClientImage(i: number, j: number) {
    this.selectedImage[i][j] = { image: 'client' };
    this.showChoices[i][j] = false;
    this.saveToLocalStorage();
    this.saveChanges();
  }

  selectAutoImage(i: number, j: number) {
    this.selectedImage[i][j] = { image: 'auto' };
    this.showChoices[i][j] = false;
    this.saveToLocalStorage();
    this.saveChanges();
  }

  getStorageKey(): string {
    return `${this.formatDate(this.currentWeekStart, 'd MMMM , yyyy')}`;
  }

  async saveChanges() {
    const storageKey = this.getStorageKey();
    console.log('Saving changes for key:', storageKey);
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

  loadSavedChanges() {
    const storageKey = this.getStorageKey();
    const savedImages = localStorage.getItem(storageKey);
    if (savedImages) {
      this.selectedImage = JSON.parse(savedImages);
    } else {
      this.selectedImage = {};
      this.displayNames.forEach((_, i) => {
        this.selectedImage[i] = this.selectedImage[i] || {};
        this.showChoices[i] = this.showChoices[i] || {};
        this.currentWeekDays.forEach((_, j) => {
          this.selectedImage[i][j] = this.selectedImage[i][j] || { image: 'plus' };
          this.showChoices[i][j] = this.showChoices[i][j] || false;
        });
      });
    }
    this.loadFromFirebase(this.getStorageKey());
  }

  loadDaysOff() {
    this.dayOffService.fetchAlldaysoff().subscribe({
      next: (daysOff) => {
        this.daysOff = daysOff.map(dayOff => format(new Date(dayOff.date), 'EEEE, MMMM d'));
        console.log('Days off:', this.daysOff);
        this.updateCurrentWeekDays();
       /* this.addDayOffEvents();
        this.refreshCalendar(); // Assurez-vous que les événements sont rafraîchis
     */ },
      error: (error) => {
        console.error('Error loading days off:', error);
      }
    });
  }

  removeImage(i: number, j: number) {
    if (this.userCanModify(i, j)) {
      this.selectedImage[i][j] = { image: 'plus' };
      this.saveToLocalStorage();
      this.saveChanges();
    }
  }

  convertUnixTimestamp(unixTimestamp: number): string {
    const date = new Date(unixTimestamp * 1000);
    const day = format(date, 'EEEE');
    const month = format(date, 'MMMM');
    const dayNumber = format(date, 'd');
    return `${day}, ${month} ${dayNumber}`;
  }
  /*
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
  
        console.log('Liste des congés approuvés:', this.formattedConges);
      } catch (error) {
        console.error('Erreur lors de la récupération des congés approuvés :', error);
      }
    }
  */
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
      console.log('Liste des congés approuvés:', this.formattedConges);
    } catch (error) {
      console.error('Erreur lors de la récupération des congés approuvés :', error);
    }
  }

  async fetchApprovedCongesInfo() {
    try {
      const approvedCongesInfo = this.formattedConges.map(conge => {
        const { formattedDateDebut, nature, displayName, nombreHeures } = conge;

        return {
          formattedDateDebut,
          nature,
          displayName,
          nombreHeures
        };
      });

      console.log('Informations des congés approuvés :', approvedCongesInfo);
      return approvedCongesInfo;
    } catch (error) {
      console.error('Erreur lors de la récupération des informations des congés approuvés :', error);
      return [];
    }
  }
  /*
    addTripImageToCurrentWeekDays() {
      this.formattedConges.forEach((conge) => {
        const displayName = conge.displayName;
        const formattedDateDebut = conge.formattedDateDebut;
        const nature = conge.nature;
        let nombreHeures = conge.nombreHeures;
        let dayIndex = this.currentWeekDays.findIndex(day => day.date === formattedDateDebut);
  
        console.log(`Processing leave for: ${displayName}`);
        console.log(`Start date: ${formattedDateDebut}`);
        console.log(`Nature: ${nature}`);
        console.log(`Total hours: ${nombreHeures}`);
  
        while (dayIndex !== -1 && nombreHeures > 0) {
          const i = this.displayNames.findIndex(name => name.name === displayName);
  
          if (i !== -1) {
            const j = dayIndex;
  
            console.log(`Adding image for ${displayName} on ${this.currentWeekDays[j].date}`);
  
            switch (nature) {
              case 'Congé payé':
                this.selectedImage[i][j] = { image: 'trip' };
                console.log('Added trip image');
                break;
              case 'Congé de maladie (1 jour)':
                this.selectedImage[i][j] = { image: 'maladie' };
                console.log('Added maladie image');
                break;
              case 'Autorisation de sortie':
                this.selectedImage[i][j] = { image: 'auto' };
                console.log('Added auto image');
                break;
              default:
                this.selectedImage[i][j] = { image: 'trip' };
                console.log('Added default trip image');
                break;
            }
  
            this.saveToLocalStorage();
            // this.saveChanges();
  
  
            console.log('Selected image state:', this.selectedImage);
  
            nombreHeures -= 8;
            console.log(`Remaining hours: ${nombreHeures}`);
  
            dayIndex++;
            while (dayIndex < this.currentWeekDays.length && this.currentWeekDays[dayIndex].isDayOff) {
              dayIndex++;
            }
  
            if (dayIndex < this.currentWeekDays.length && nombreHeures > 0) {
              console.log(`Adding image for ${displayName} on next day ${this.currentWeekDays[dayIndex].date}`);
            } else if (nombreHeures > 0) {
              console.log('No more days in the current week to allocate. Moving to the next week.');
              break;
            }
          } else {
            console.log(`Display name ${displayName} not found in displayNames array.`);
            break;
          }
        }
      });
  
      this.updateCurrentWeekDays();
      this.loadSavedChanges();
      // this.saveChanges();
    }
  
  */
  addTripImageToCurrentWeekDays() {
    this.formattedConges.forEach((conge) => {
      const displayName = conge.displayName;
      const userId = conge.userId; // Assuming userId is available in conge
      const formattedDateDebut = conge.formattedDateDebut;
      const nature = conge.nature;
      let nombreHeures = conge.nombreHeures;
      let dayIndex = this.currentWeekDays.findIndex(day => day.date === formattedDateDebut);
      while (dayIndex !== -1 && nombreHeures > 0) {
        // const i = this.displayNames.findIndex(name => name.name === displayName);
        const i = this.displayNames.findIndex(user => user.id === userId); // Verify by ID
        if (i !== -1) {
          const j = dayIndex;
          switch (nature) {
            case 'Congé payé':
              this.selectedImage[i][j] = { image: 'hol' };
              break;
            case 'Congé de maladie (1 jour)':
              this.selectedImage[i][j] = { image: 'maladie' };
              break;
            case 'Autorisation de sortie':
              this.selectedImage[i][j] = { image: 'auto' };
              break;
            default:
              this.selectedImage[i][j] = { image: 'trip' };
              break;
          }
          this.saveToLocalStorage();
          nombreHeures -= 8;
          dayIndex++;
          while (dayIndex < this.currentWeekDays.length && this.currentWeekDays[dayIndex].isDayOff) {
            dayIndex++;
          }
          if (dayIndex >= this.currentWeekDays.length && nombreHeures > 0) break;
        } else {
          break;
        }
      }
    });
    this.updateCurrentWeekDays();
    this.loadSavedChanges();
  }

  refreshUI() {
    this.changeDetectorRef.detectChanges(); // Utiliser ChangeDetectorRef pour forcer la détection des changements
  }


  filterSelectedImages(): { [key: number]: { [key: number]: { image: string } } } {
    const filteredImages: { [key: number]: { [key: number]: { image: string } } } = {};
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
      console.log('Data loaded from local storage:', data);
      if (data) {
        this.selectedImage = data;
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

  userCanModify(i: number, j: number): boolean {
    console.log('User role:', this.userRole);
    if (this.userRole === 'admin') {
      return true; // L'admin peut modifier toutes les lignes
    } else {
      const userId = this.displayNames[i].id; // ID de l'utilisateur pour cette ligne
      return userId === this.auth.getCurrentUserId(); // Seul l'utilisateur peut modifier sa propre ligne
    }
  }

  /*
    updateHeaderText() {
      if (this.selectedView === 'week') {
        this.headerText = `${this.translocoService.translate('features.remote.Week_starting')} ${this.formatDate(this.currentWeekStart, 'MMMM d, yyyy')}`;
      } else if (this.selectedView === 'month') {
        this.headerText = `${this.translocoService.translate('features.remote.Month_starting')} ${this.formatDate(this.currentWeekStart, 'MMMM yyyy')}`;
      }
    }
   
    // Dummy method for translation, replace with actual method from Transloco service
    translocoService = {
      translate: (key: string) => {
        const translations = {
          'features.remote.Week_starting': 'Week starting',
          'features.remote.Month_starting': 'Month of'
        };
        return translations[key];
      }
    };
   
    /* Dummy formatDate method, replace with actual implementation
    formatDate(date: Date, dateFormat: string): string {
      // Implement date formatting logic here
      return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
    }
   
   
    addDayOffEvents() {
      // Supprimer les anciens événements de jour férié
      this.Events = this.Events.filter(event => event.title == 'Jour férié');
   
      this.daysOff.forEach(dayOff => {
        this.Events.push({
          title: 'Jour férié',
          start: format(new Date(dayOff), 'yyyy-MM-dd'),
          display: 'background',
          backgroundColor: 'red',
          borderColor: 'red',
          textColor: 'white'
        });
      });
      console.log('Day off events:', this.Events);
      this.refreshCalendar(); // Rafraîchir le calendrier après avoir ajouté les événements
    }
    refreshCalendar() {
      if (this.calendarComponent) {
        const calendarApi = this.calendarComponent.getApi();
        if (calendarApi) {
          calendarApi.removeAllEvents(); // Supprimer tous les événements actuels
          calendarApi.addEventSource(this.Events); // Ajouter les événements mis à jour
          calendarApi.render(); // Rendre les changements visibles
          console.log('Calendar refreshed');
        } else {
          console.error('calendarApi is undefined');
        }
      }
    }
    
  renderEventContent(eventInfo) {
    let content = '';
    if (eventInfo.event.title === 'Jour férié') {
      content = `<div class="fc-event-main"><img src="assets/images/trip.jpg" alt="Image" class="event-image"><span class="event-title">${eventInfo.event.title}</span></div>`;
    } else {
      content = `<div class="fc-event-main"><span class="event-title">${eventInfo.event.title}</span></div>`;
    }
    return { html: content };
  }
  onViewChange(event: any) {
    this.selectedView = event.value;
    this.updateHeaderText();
   
  }*/
  goToToday() {

    //if (this.selectedView === 'week') {
    this.currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    this.updateCurrentWeekDays();
    this.loadSavedChanges();
    this.loadDaysOff();
    this.addTripImageToCurrentWeekDays();
    // this.updateHeaderText();
    //}
    /* else if (this.selectedView === 'month') {
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.today();
    this.updateCalendarToolbarTitle(calendarApi.view);
  }
  }*/
  }
}
