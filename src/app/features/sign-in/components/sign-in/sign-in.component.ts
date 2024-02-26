import { Component, inject, NgZone, OnDestroy, OnInit } from "@angular/core";
import { Auth, signInWithPopup } from '@angular/fire/auth';
import { MatButtonModule } from "@angular/material/button";
import { ActivatedRoute, Router } from "@angular/router";
import { GoogleAuthProvider, Unsubscribe } from '@angular/fire/auth';
import { take } from "rxjs";

import { MatCardModule } from "@angular/material/card";
import { AuthService } from "../../services/auth.service";

@Component({
  standalone: true,
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  imports: [
    MatButtonModule,
    MatCardModule,
  ]
})
export class SignInComponent implements OnInit, OnDestroy {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly service = inject(AuthService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly ngZone = inject(NgZone);
  private unsubscribeAuthStateChanged: Unsubscribe;

  public signInWithGoogle(): void {
    const provider = new GoogleAuthProvider();

  // Sign in with a popup using the specified provider
signInWithPopup(this.auth, provider)
.then((result) => {
  // Retrieve the signed-in user
  const user = result.user;

  // Call the CheckUser function to validate the user's access
  this.service.CheckUserExist(user?.uid).then((res) => {
    if (res == true) {      
      // If the user is authorized, navigate to the 'folders' route
      this.router.navigate(['/dashbord']);
    } else {
      // If the user is not authorized, navigate to the 'not-authorized' route
      this.router.navigate(['create-domaine']);
    }
  });
});



  }

  public ngOnInit(): void {
   // this.randombg();
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
      }else{
        
      }
    });
  }

  public ngOnDestroy(): void {
    this.unsubscribeAuthStateChanged();
  }

  public  randombg() {
    const random: number = Math.floor(Math.random() * 4);
    const bigSize: string[] = [
      "url('https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1400&q=60')",
      "url('https://images.unsplash.com/photo-1477346611705-65d1883cee1e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=60')",
      "url('https://images.unsplash.com/photo-1441794016917-7b6933969960?ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=60')",
      "url('https://images.unsplash.com/photo-1491466424936-e304919aada7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjF9&auto=format&fit=crop&w=1400&q=60')"
    ];
    const rightElement: HTMLElement | null = document.getElementById("right");
    if (rightElement) {
      rightElement.style.backgroundImage = bigSize[random];
    }
  }
}
