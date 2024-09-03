import { Component, inject, NgZone, OnDestroy, OnInit } from "@angular/core";
import { Auth, signInWithPopup } from '@angular/fire/auth';
import { MatButtonModule } from "@angular/material/button";
import { ActivatedRoute, Router } from "@angular/router";
import { GoogleAuthProvider, Unsubscribe } from '@angular/fire/auth';
import { take } from "rxjs";
import { MatCardModule } from "@angular/material/card";
import { AuthService } from "../../services/auth.service";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDialog } from '@angular/material/dialog';
import { SignInDialogComponent } from './sign-in-dialog/sign-in-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';



@Component({
  standalone: true,
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],

  imports: [
    MatButtonModule,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule, SignInDialogComponent, MatDialogModule
  ]
})
export class SignInComponent implements OnInit, OnDestroy {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly service = inject(AuthService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly ngZone = inject(NgZone);
  private unsubscribeAuthStateChanged: Unsubscribe;

  // Form for email and password sign-in
  signInForm: FormGroup;

  constructor(
    private fb: FormBuilder, // FormBuilder injected
    private authService: AuthService,
    private dialog: MatDialog


  ) { }
  openSignInDialog(): void {
    this.dialog.open(SignInDialogComponent, {
      width: '400px',
      // Optionally set other dialog options
    });
  }
  ngOnInit(): void {
    // Initialize the form with validators
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.unsubscribeAuthStateChanged = this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.activatedRoute
          .queryParams
          .pipe(take(1))
          .subscribe(({ redirect, search }) => {
            this.ngZone.run(() => {
              this.router.navigateByUrl(redirect + search || '/', {
                onSameUrlNavigation: 'reload',
                replaceUrl: true,
              });
            })
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAuthStateChanged();
  }

  // Google Sign-In Method
  public signInWithGoogle(): void {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.auth, provider)
      .then((result) => {
        const user = result.user;
        this.service.CheckUserExist(user?.uid).then((res) => {
          if (res == true) {
            this.router.navigate(['/timesheet/' + this.auth.currentUser?.uid + '/' + new Date()]);
            //this.router.navigate(['/dashbord']);
          } else {
            this.router.navigate(['create-domaine']);
          }
        });
      });
  }

  // Email and Password Sign-Up
  onSignUp(): void {
    const { email, password } = this.signInForm.value;
    this.authService.signUpWithEmail(email, password);
  }

  // Email and Password Login
  onLogin(): void {
    const { email, password } = this.signInForm.value;
    this.authService.loginWithEmail(email, password);
  }
  loginWithMicrosoft() {
    this.authService.loginWithMicrosoft()
      .then(result => {
        console.log('Connexion réussie avec Microsoft');
      })
      .catch(error => {
        console.error('Erreur de connexion avec Microsoft:', error);
      });
  }
}

