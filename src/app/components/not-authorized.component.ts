import { Component, NgZone, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'scd-not-authorized',
  imports: [RouterModule, MatButtonModule,MatIconModule],
  template: `
    <div class="error-page">
    <mat-icon class="alert">warning</mat-icon>
      <h4>Page Forbidden</h4>
      <p>Sorry, You are not authorized to sign in. Please contact your admin .</p>
    </div>
    <a class="blue-button" (click)="backToSignIn()">Back To Sign In Page</a>
  `
})
export class NotAuthorizedComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  private readonly ngZone = inject(NgZone);


  public async backToSignIn() {
    // Sign out the user
    await this.auth.signOut();

    // Run the following code within the Angular zone
    this.ngZone.run(() => {
      // Navigate to the '/sign-in' route
      this.router.navigateByUrl('/sign-in', {
        // Reload the component if the destination URL is the same as the current URL
        onSameUrlNavigation: 'reload',

        // Replace the current URL in the browser history with the new URL
        replaceUrl: true,
      });
    });
  }

}
