import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'; // Import SweetAlert2
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-sign-in-dialog',
  standalone: true,
  templateUrl: './sign-in-dialog.component.html',
  styleUrls: ['./sign-in-dialog.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule
  ]
})
export class SignInDialogComponent implements AfterViewInit, OnDestroy {
  signInForm: FormGroup;
  private signUpButton: HTMLElement | null;
  private signInButton: HTMLElement | null;
  private container: HTMLElement | null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<SignInDialogComponent>,
    private router: Router
  ) {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngAfterViewInit(): void {
    this.signUpButton = document.getElementById('signUp');
    this.signInButton = document.getElementById('signIn');
    this.container = document.getElementById('container');

    if (this.signUpButton && this.signInButton && this.container) {
      this.signUpButton.addEventListener('click', this.onSignUpClick);
      this.signInButton.addEventListener('click', this.onSignInClick);
    }
  }

  ngOnDestroy(): void {
    if (this.signUpButton && this.signInButton && this.container) {
      this.signUpButton.removeEventListener('click', this.onSignUpClick);
      this.signInButton.removeEventListener('click', this.onSignInClick);
    }
  }

  private onSignUpClick = (): void => {
    if (this.container) {
      this.container.classList.add("right-panel-active");
    }
  }

  private onSignInClick = (): void => {
    if (this.container) {
      this.container.classList.remove("right-panel-active");
    }
  }

  onSignUp(): void {
    const { email, password } = this.signInForm.value;
    this.authService.signUpWithEmail(email, password)
      .then(() => {
        // Display success alert
        Swal.fire({
          title: 'Inscription réussie',
          text: 'Votre compte a été créé avec succès !',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          this.dialogRef.close();
        });
      })
      .catch(error => {
        // Display error alert
        Swal.fire({
          title: 'Erreur',
          text: error.message,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      });
  }

  onLogin(): void {
    const { email, password } = this.signInForm.value;
    this.authService.loginWithEmail(email, password)
      .then(() => {
        // Display success alert
        Swal.fire({
          title: 'Connexion réussie',
          text: 'Vous êtes maintenant connecté !',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          this.dialogRef.close();
        });
      })
      .catch(error => {
        // Display error alert
        Swal.fire({
          title: 'Erreur',
          text: error.message,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      });
  }
}
