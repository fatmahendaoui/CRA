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
import { MatBadgeModule } from '@angular/material/badge';
import { AngularFireModule } from '@angular/fire/compat';


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
    
  ],
})
export class LayoutComponent implements OnInit, OnDestroy {
  // Subject pour la gestion de la destruction du composant
  private readonly isDestroy$ = new Subject<void>();
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);
  public isAdmin: boolean = true;
  domaineName: string | undefined;
  status: boolean;
  userRole: string;
  today: Date = new Date();
  private readonly transloco = inject(TranslocoService);
  public defaultLanguage = this.transloco.getActiveLang();
  public user: User | null;


  public ngOnInit(): void {
    // Récupérer le rôle de l'utilisateur depuis le service de profil utilisateur
    this.profileService.getUserRole().then((res) => {
      this.userRole = res;
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

  // Méthode pour obtenir l'URL de l'image de l'utilisateur si disponible
  getUserImage(user: User): string | null {
    if (user && user.photoURL) {
      return user.photoURL; // Retourner l'URL de l'image si disponible
    } else {
      return null; // Retourner null sinon
    }
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
      queryResult.docs[0].data()['role'] === 'admin';

    // Retourner la valeur de isAdmin
    return this.isAdmin;
  }

  // Méthode appelée lors du changement de langue
  public onSelectionChange(change: MatSelectChange): void {
    const { value } = change;
    this.transloco.setActiveLang(value); // Définir la langue active
    localStorage.setItem('current_language', value); // Sauvegarder la langue sélectionnée dans le stockage local
  }
}