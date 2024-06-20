import { Component, OnInit, HostListener } from '@angular/core';
import { startOfWeek, addDays, format, addWeeks, subWeeks } from 'date-fns';
import { RemoteService } from './services/remoteservice.service';
import { Day_offService } from '../day_offs/services/day_off.service'; 
import { CongeService } from '../conges/services/conge.service';
import Swal from 'sweetalert2';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-remote',
  templateUrl: './remote.component.html',
  styleUrls: ['./remote.component.css']
})
export class RemoteComponent implements OnInit {
  displayNames: { name: string, photoURL: string }[] = [];
  currentWeekStart: Date;
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

  constructor(
    private remoteService: RemoteService,
    private dayOffService: Day_offService,
    private congeService: CongeService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  }

  ngOnInit(): void {
    this.loadDisplayNames();
    this.updateCurrentWeekDays();
    this.loadSavedChanges();
    this.loadDaysOff();
    this.loadApprovedConges().then(() => {
      this.fetchApprovedCongesInfo(); 
      this.addTripImageToCurrentWeekDays();
      this.filteredDisplayNames = [...this.displayNames];
      this.loadFromFirebase(this.getStorageKey());
    });
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    if (!this.isInsideChoice) {
      this.closeAllChoices();
    }
    this.isInsideChoice = false;
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

  async loadDisplayNames() {
    try {
      this.displayNames = await this.remoteService.getAllDisplayNames();
      this.displayNames.forEach((_, i) => {
        this.selectedImage[i] = this.selectedImage[i] || {};
        this.showChoices[i] = this.showChoices[i] || {};
        this.currentWeekDays.forEach((_, j) => {
          this.selectedImage[i][j] = this.selectedImage[i][j] || { image: 'plus' };
          this.showChoices[i][j] = this.showChoices[i][j] || false;
        });
      });
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
        return 'assets/images/trip.jpg';
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
    if (this.selectedImage[i][j].image === 'plus') {
      this.markAsInsideChoice();
      this.showChoices[i][j] = !this.showChoices[i][j];
    }
  }

  toggleImageChoices(i: number, j: number) {
    if (this.selectedImage[i][j].image !== 'plus') {
      this.markAsInsideChoice();
      this.showChoices[i][j] = !this.showChoices[i][j];
    }
  }

  selectRemoteImage(i: number, j: number) {
    this.selectedImage[i][j] = { image: 'remote' };
    this.showChoices[i][j] = false;
    this.saveToLocalStorage(); 
  }

  selectTripImage(i: number, j: number) {
    this.selectedImage[i][j] = { image: 'trip' };
    this.showChoices[i][j] = false;
    this.saveToLocalStorage(); 
  }

  selectClientImage(i: number, j: number) {
    this.selectedImage[i][j] = { image: 'client' };
    this.showChoices[i][j] = false;
    this.saveToLocalStorage(); 
  }

  selectAutoImage(i: number, j: number) {
    this.selectedImage[i][j] = { image: 'auto' };
    this.showChoices[i][j] = false;
    this.saveToLocalStorage(); 
  }

  getStorageKey(): string {
    return `${this.formatDate(this.currentWeekStart, 'MMMM d, yyyy')}`;
  }

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
  }

  loadDaysOff() {
    this.dayOffService.fetchAlldaysoff().subscribe({
      next: (daysOff) => {
        this.daysOff = daysOff.map(dayOff => format(new Date(dayOff.date), 'EEEE, MMMM d'));
        console.log('Days off:', this.daysOff);
        this.updateCurrentWeekDays();
      },
      error: (error) => {
        console.error('Error loading days off:', error);
      }
    });
  }

  removeImage(i: number, j: number) {
    this.selectedImage[i][j] = { image: 'plus' };
    this.saveToLocalStorage(); 
  }

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
      const data = await this.remoteService.loadFromFirebase(storageKey);
      if (data) {
        console.log('Data loaded from Firestore:', data);
        this.selectedImage = data;
      } else {
        console.log('No data found in Firestore for the given key.');
      }
    } catch (error) {
      console.error('Error loading data from Firestore:', error);
    }
  }

  private saveToLocalStorage() {
    const storageKey = this.getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(this.selectedImage));
  }
}
