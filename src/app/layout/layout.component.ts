import { NgClass, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Auth, User } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { ProfileService } from '../services/profile.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';

@Component({
  standalone: true,
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  imports: [
    NgIf,
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    TranslocoModule,
    MatFormFieldModule,
    MatSelectModule,
    NgClass,
  ],
})
export class LayoutComponent implements OnInit, OnDestroy {
  private readonly isDestroy$ = new Subject<void>();
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);
  public isAdmin: boolean = true;
  domaineName: string | undefined;
  status: boolean;
  userRole: string;
  private unsubscribe: () => void; // Declare the unsubscribe function
  today:Date=new Date();


  private readonly transloco = inject(TranslocoService);
  public defaultLanguage = this.transloco.getActiveLang();

  public user: User | null;

  public ngOnInit(): void {
    this.profileService.getUserRole().then((res) => {
      this.userRole = res;
    });
    this.auth.onAuthStateChanged((user) => {
      this.user = user;
    });
    this.checkUserAccess();
  }



  getFirstLetter(email: string): string {
    return email ? email.charAt(0).toUpperCase() : '';
  }

  navigateToSettings() {
    this.router.navigate(['/settings']);
  }

  public ngOnDestroy(): void {
    this.isDestroy$.next();
    this.isDestroy$.complete();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  public async signOut() {
    await this.auth.signOut();
    this.router.navigate(['/sign-in']);
  }

  public async checkUserAccess() {
    // check if the user exist in bqds-user is an admin using the profileService
    const queryResult = await this.profileService.checkAdmin(
      this.auth.currentUser!.uid
    );

    // Check if the query result has any documents and if the user's role is "admin"
    this.isAdmin =
      queryResult.docs.length > 0 &&
      queryResult.docs[0].data()['role'] === 'admin';

    // Check if userData exists and if the user's role is "admin"
    this.isAdmin = this.isAdmin;

    // Return the value of isAdmin
    return this.isAdmin;
  }

  public onSelectionChange(change: MatSelectChange): void {
    const { value } = change;
    this.transloco.setActiveLang(value);

    localStorage.setItem('current_language', value);
  }
}


