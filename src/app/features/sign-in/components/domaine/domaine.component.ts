import { NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Profile} from 'src/app/models/profile.model';
import { TranslocoModule } from '@ngneat/transloco';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-domaine',
  templateUrl: './domaine.component.html',
  styleUrls: ['./domaine.component.scss'],
  imports: [
    NgIf,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCardModule,
    TranslocoModule,
  ],
})
export class DomaineComponent implements OnInit {
  private readonly service = inject(AuthService);
  public profile: Profile;
  private formBuilder = inject(FormBuilder);
  public formGroup: FormGroup;
  domainExists: boolean = false; // Flag to track if the domain exists
  private readonly router = inject(Router);


  public ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      domaineName: ['', [Validators.required]],
    });
  }

  async createProfile(){

    if ( !this.formGroup.value) {
      return;
    }
    try {
      const { profile, exists } = await this.service.createDomaine(this.formGroup.value['domaineName']);

      if (exists) {
        this.domainExists = true;

        // Set a flag or display an error message in the component template
      } else {
        // Domain name doesn't exist, profile created successfully
        if (profile !== null) {
          this.domainExists = false; // Reset the flag
          this.router.navigate(['/dashbord']);
          // Proceed with any desired actions or display a success message in the component template
        }
      }
    } catch (error) {
      // Handle the error or display an error message in the component template
    }  }


}
