import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from 'src/app/features/sign-in/services/auth.service';
import { ProfilService } from '../../services/profile.service';
import { Timestamp } from '@angular/fire/firestore';
import { DatePipe } from '@angular/common'; // Importer DatePipe

@Component({
  selector: 'app-profile-user',
  templateUrl: './profile-user.component.html',
  styleUrls: ['./profile-user.component.scss'],
  providers: [DatePipe] // Ajouter DatePipe aux providers du composant
})
export class ProfileUserComponent implements OnInit {
  profileForm: FormGroup;
  profileImage: string | ArrayBuffer | null = null;
  selectedDate: Date | null = null;
  typeContrat: string | null = null;
  userId: string | null = null; // Store the user ID here

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private profilService: ProfilService,
    private datePipe: DatePipe // Injecter DatePipe
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: [''],
      Email: [''],
      dateOfBirth: [''],
      phone: [''],
      typeContrat: [''],
      dateEmbauche: [''],
      poste: ['']
      // Add other form controls here
    });

    this.userId = this.authService.getCurrentUserId();

    if (this.userId) {
      this.profilService.getUserProfile(this.userId).then(profileData => {
        if (profileData) {
          let dateEmbaucheFormatted = '';

          if (typeof profileData.dateEmbauche === 'string') {
            const timestamp = Timestamp.fromDate(new Date(profileData.dateEmbauche));
            const dateEmbauche = timestamp.toDate();
            dateEmbaucheFormatted = this.datePipe.transform(dateEmbauche, 'dd/MM/yyyy') || '';
          }

          this.profileForm.patchValue({
            name: profileData.displayName || '',
            Email: profileData.email || '',
            dateOfBirth: profileData.dateOfBirth || null,
            phone: profileData.phoneNumber || '',
            typeContrat: profileData.contratType || '',
            dateEmbauche: dateEmbaucheFormatted,
            poste: profileData.poste || '',
          });
        }
      }).catch(error => {
        console.error('Error loading user profile:', error);
      });
    }
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
        // Ajouter d'autres champs si nécessaire
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
}
