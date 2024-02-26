import { Component, OnInit, inject } from '@angular/core';
import { UsersService } from './services/users.service';
import { AsyncPipe, DatePipe, JsonPipe, NgFor, NgIf } from '@angular/common';
import { Observable, Subscription, filter } from 'rxjs';
import { UsersTableComponent } from './components/users-table/users-table.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { InviteUserComponent } from './components/invite-user/invite-user.component';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { LoaderComponent } from '../../components/loader.component';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { Profile} from 'src/app/models/profile.model';
import { displayConfirmationAlert, handleResponseErrorWithAlerts, handleResponseSuccessWithAlerts } from 'src/app/common/alerts.utils';
import { ProjectService } from '../projects/services/projects.service';
import { AuthModule } from '@angular/fire/auth';


@Component({
  standalone: true,
  selector: 'app-users',
  template: `
    <ng-container *ngIf="users$ | async as users">

      <div class="btn-add">
        <h1>
        {{ 'features.users.title' | transloco }}
        </h1>
        <button mat-flat-button color="primary" (click)="addUser()">
        {{ 'features.users.add' | transloco }}
        </button>
      </div>

      <mat-card>
        <mat-form-field appearance="outline">
          <mat-label>
          {{ 'features.users.search' | transloco }}
          </mat-label>
          <input type="text" #searchInput matInput />
        </mat-form-field>

        <app-users-table
          [data]="users"
          [filter]="searchInput.value"
          (deleteUser)="deleteUser($event)"
          (updateRole)="updateRole($event)"
        >
        </app-users-table>
      </mat-card>
    </ng-container>

    <ng-template #loading>
      <app-loader>Chargement des utilisateurs</app-loader>
    </ng-template>
  `,
  providers: [
    UsersService,
    ProjectService
  ],
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    JsonPipe,
    UsersTableComponent,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatBottomSheetModule,
    MatProgressSpinnerModule,
    LoaderComponent,
    TranslocoModule,
    AuthModule

  ]
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly bottomSheet = inject(MatBottomSheet);
  public users$: Observable<Profile[]>;
  private readonly transloco = inject(TranslocoService);



  public ngOnInit() {
     this.fetchAll();
  }

  public fetchAll(): void {
    this.users$ = this.usersService.fetchAllUsers();

  }

  public deleteUser(user: Profile): void {
    // TODO : add a loading spinner
    displayConfirmationAlert(
      this.transloco.translate('features.users.dialog.confirmation'),
      this.transloco.translate('common.confirm'),
      this.transloco.translate('common.cancel'),
    )
      .then((result) => {
        if (result.isConfirmed) {
          this.handleResponse(
            this.usersService.deleteUser(user.uid)
            .subscribe({
                next: () => this.fetchAll(),
                 error: () => alert('Une erreur est survenue lors de la suppression de l\'utilisateur')
              }), 'remove'
          );
        }
      });
  }
  handleResponse(arg0: Subscription, arg1: string) {
    throw new Error('Method not implemented.');
  }

  public updateRole(user: Profile) {
    // TODO : add a loading spinner

    this.usersService
      .updateUserRole(user.uid, user)
      .subscribe(() => this.fetchAll());
  }
  private inviteUser(user: Partial<Profile>): void {
    // TODO: add a loading spinner
    if (user) {
      this.usersService.sendInvitation(user)
        .then(() => {
          // Invitation was successful
          this.fetchAll(); // Replace this with your fetchAll logic
          handleResponseSuccessWithAlerts(
            this.transloco.translate('features.users.success.title'),
            this.transloco.translate('features.users.success.message'),
            this.transloco.translate('common.close'),
            () => {}
          );
        })
        .catch((error: any) => {
          // Handle errors
          console.error('Error inviting user:', error);

          // Check if the error code indicates email-already-in-use
          if (error.code === 'auth/email-already-in-use') {
            handleResponseErrorWithAlerts(
              this.transloco.translate('features.users.error.title'),
              this.transloco.translate('features.users.error.message'),
              this.transloco.translate('common.close'),
            );
          } else {
            // Handle other error cases
            handleResponseErrorWithAlerts(
              this.transloco.translate('features.users.error.title'),
              this.transloco.translate('features.users.error.message'),
              this.transloco.translate('common.close'),
            );
          }
        });
    }
  }




  public addUser(): void {
    this.bottomSheet
      .open(InviteUserComponent, { panelClass: 'bottom-sheet-without-padding' })
      .afterDismissed()
      .pipe(filter((user) => !!user))
      .subscribe((user: Partial<Profile>) => this.inviteUser(user));
  }
}
