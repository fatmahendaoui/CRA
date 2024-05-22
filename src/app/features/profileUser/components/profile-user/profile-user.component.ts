import { Component } from '@angular/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';

@Component({
  selector: 'app-profile-user',
  templateUrl: './profile-user.component.html',
  styleUrls: ['./profile-user.component.scss']
})

export class ProfileUserComponent {
  profileImage: string | ArrayBuffer | null = null;
  selectedDate: Date | null = null;
  typeContrat: string | null = null;
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = e => this.profileImage = reader.result;
      reader.readAsDataURL(file);
    }
  }



}