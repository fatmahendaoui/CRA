import { NgClass, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
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
import { MatBadgeModule } from '@angular/material/badge';
import { AngularFireModule } from '@angular/fire/compat';
import { AuthService } from '../features/sign-in/services/auth.service';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';


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
    MatBadgeModule,
    AngularFireModule,
    MatSidenavModule,
    MatListModule,
    CommonModule
  ],
})
export class LayoutComponent implements OnInit, OnDestroy {

  public showHorizontalNavbar: boolean = false;
  public selectedLanguage: string = 'fr'; // Langue par défaut

  // Subject pour la gestion de la destruction du composant
  private readonly isDestroy$ = new Subject<void>();
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  public isAdmin: boolean = true;
  public isNotManager: boolean = true;
  domaineName: string | undefined;
  status: boolean;
  userRole: string;
  today: Date = new Date();
  private readonly transloco = inject(TranslocoService);
  public defaultLanguage = this.transloco.getActiveLang();
  public user: User | null;
  profileImage: string | ArrayBuffer | null = null;
  public ngOnInit(): void {
    // Récupérer le rôle de l'utilisateur depuis le service de profil utilisateur
    this.profileService.getUserRole().then((res) => {
      this.userRole = res;
    });

    this.profileService.getUserPhotoURL(this.auth.currentUser!.uid
    ).then((res) => {
      this.profileImage = res;
    });
    //defualt language
    const defaultLanguage = localStorage.getItem('current_language');
    if (defaultLanguage) {
      this.selectedLanguage = defaultLanguage;
    }

    const domaineId = this.profileService.profile.idDomaine;
    this.authService.getDomainName(domaineId).then((domaineName) => {
      if (domaineName !== null) {
        this.domaineName = domaineName;
      } else {
        this.domaineName = ""; // Assign a default value or handle the null case accordingly
      }
    });
    // Observer les changements d'état d'authentification de l'utilisateur
    this.auth.onAuthStateChanged((user) => {
      this.user = user; // Mettre à jour l'utilisateur actuel
    });

    // Vérifier l'accès de l'utilisateur
    this.checkUserAccess();
  }

  // Méthode pour obtenir la première lettre de l'email de l'utilisateur
  getFirstLetter(email: string): string {
    return email ? email.charAt(0).toUpperCase() : '';
  }

  // Méthode pour naviguer vers les paramètres de l'utilisateur
  navigateToSettings() {
    this.router.navigate(['/settings']); // Redirection vers la page de paramètres
  }

  // Méthode appelée lors de la destruction du composant
  public ngOnDestroy(): void {
    this.isDestroy$.next(); // Émettre un événement de destruction
    this.isDestroy$.complete(); // Compléter la destruction
  }

  // Méthode pour se déconnecter de l'application
  public async signOut() {
    await this.auth.signOut(); // Déconnexion de l'utilisateur
    this.router.navigate(['/sign-in']); // Redirection vers la page de connexion
  }

  // Méthode pour vérifier l'accès de l'utilisateur
  public async checkUserAccess() {
    // Vérifier si l'utilisateur est un administrateur en utilisant le service de profil
    const queryResult = await this.profileService.checkAdmin(
      this.auth.currentUser!.uid
    );

    // Vérifier si le résultat de la requête contient des documents et si le rôle de l'utilisateur est "admin"
    this.isAdmin =
      queryResult.docs.length > 0 &&
      queryResult.docs[0].data()['role'] === 'admin' || queryResult.docs[0].data()['role'] === 'manager';
    this.isNotManager = queryResult.docs.length > 0 && queryResult.docs[0].data()['role'] === 'admin';
    // Retourner la valeur de isAdmin
    return this.isAdmin;
  }

  public onSelectionChange(language: string): void {
    this.selectedLanguage = language; // Mettre à jour la langue sélectionnée
    this.transloco.setActiveLang(language); // Définir la langue active
    localStorage.setItem('current_language', language); // Sauvegarder la langue sélectionnée dans le stockage local
  }
  public toggleHorizontalNavbar() {
    this.showHorizontalNavbar = !this.showHorizontalNavbar;

  }



}