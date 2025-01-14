import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { startOfWeek, addDays, format, addWeeks, subWeeks } from 'date-fns';
import { RemoteService } from './services/remoteservice.service';
import { Day_offService } from '../day_offs/services/day_off.service';
import { CongeService } from '../conges/services/conge.service';
import Swal from 'sweetalert2';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../sign-in/services/auth.service';
import { ProfileService } from 'src/app/services/profile.service';

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
  filteredDisplayNames: { name: string, photoURL: string }[] = [];
  filterText: string = '';
  filteredSelectedImage: { [key: number]: { [key: number]: { image: string } } } = {};
  userRole: string; 
  selectedView: string = 'week';
  headerText: string;
  currentUserId: string | null = null; 

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
    this.displayNames.forEach((_, i) => {
      this.currentWeekDays.forEach((_, j) => {
        this.showChoices[i][j] = false;
      });
    });
  }
  // function to load display names
  async loadDisplayNames() {
    try {

      this.displayNames = await this.remoteService.getAllDisplayNames();
      // Récupérer l'utilisateur actuel
      this.currentUserId = await this.auth.getCurrentUserId();
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
// function to update current week days
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
  }
// function to previous week
  previousWeek() {
    this.currentWeekStart = subWeeks(this.currentWeekStart, 1);
    this.updateCurrentWeekDays();
    this.loadSavedChanges();
    this.loadDaysOff();
    this.addTripImageToCurrentWeekDays();
  }
// function to next week
  nextWeek() {
    this.currentWeekStart = addWeeks(this.currentWeekStart, 1);
    this.updateCurrentWeekDays();
    this.loadSavedChanges();
    this.loadDaysOff();
    this.addTripImageToCurrentWeekDays();
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
  showImageChoices(i: number, j: number) {
    if (this.selectedImage[i][j].image === 'plus' && this.userCanModify(i, j)) {
      this.markAsInsideChoice();
      this.showChoices[i][j] = !this.showChoices[i][j];
    }
  }
// function to toggle image choices
  toggleImageChoices(i: number, j: number) {
    if (this.selectedImage[i][j].image !== 'plus' && this.userCanModify(i, j)) {
      this.markAsInsideChoice();
      this.showChoices[i][j] = !this.showChoices[i][j];
    }
  }
// function to select remote image
  selectRemoteImage(i: number, j: number) {
    this.selectedImage[i][j] = { image: 'remote' };
    this.showChoices[i][j] = false;
    this.saveToLocalStorage();
    this.saveChanges();
  }
// function to select trip image
  selectTripImage(i: number, j: number) {
    this.selectedImage[i][j] = { image: 'hol' };
    this.showChoices[i][j] = false;
    this.saveToLocalStorage();
    this.saveChanges();
  }
// function to  select client image
  selectClientImage(i: number, j: number) {
    this.selectedImage[i][j] = { image: 'client' };
    this.showChoices[i][j] = false;
    this.saveToLocalStorage();
    this.saveChanges();
  }
// function to select auto image
  selectAutoImage(i: number, j: number) {
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
      const approvedCongesInfo = this.formattedConges.map(conge => {
        const { formattedDateDebut, nature, displayName, nombreHeures } = conge;

        return {
          formattedDateDebut,
          nature,
          displayName,
          nombreHeures
        };
      });

      return approvedCongesInfo;
    } catch (error) {
      console.error('Erreur lors de la récupération des informations des congés approuvés :', error);
      return [];
    }
  }

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
    if (this.userRole === 'admin') {
      return true; // L'admin peut modifier toutes les lignes
    } else {
      const userId = this.displayNames[i].id; // ID de l'utilisateur pour cette ligne
      return userId === this.auth.getCurrentUserId(); // Seul l'utilisateur peut modifier sa propre ligne
    }
  }

  goToToday() {
    this.currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    this.updateCurrentWeekDays();
    this.loadSavedChanges();
    this.loadDaysOff();
    this.addTripImageToCurrentWeekDays();
 
  }
}
