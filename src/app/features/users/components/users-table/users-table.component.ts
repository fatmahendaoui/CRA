import { Component, EventEmitter, Output, inject } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { AbstractTableComponent } from '../../../../components/table.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslocoModule } from '@ngneat/transloco';
import { Profile } from 'src/app/models/profile.model';
import { RouterLink } from '@angular/router';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UsersService } from '../../services/users.service';
import { MatMenuModule, MatMenuItem } from '@angular/material/menu';

@Component({
  standalone: true,
  selector: 'app-users-table',
  styleUrls: ['users-table.component.scss'],
  templateUrl: 'users-table.component.html',
  imports: [
    NgIf,
    NgFor,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    TranslocoModule,
    DatePipe,
    RouterLink,
    MatSlideToggleModule,
    MatMenuModule,
  ],
})
export class UsersTableComponent extends AbstractTableComponent<Profile> {
  @Output()
  public updateRole = new EventEmitter<Profile>();
  today: Date = new Date();
  @Output()
  public deleteUser = new EventEmitter<Profile>();
  @Output()
  public onToggleAdminEvent = new EventEmitter<MatSlideToggleChange>(); // Renommage de l'événement

  private readonly usersService = inject(UsersService);

  public override readonly displayedColumns: string[] = [
    'email',
    'role',
    'dateEmbauche',
    'actions'
  ];

  public async onSelectionChange(change: MatSelectChange, user: Profile): Promise<void> {
    this.updateRole.emit({
      ...user,
      role: change.value,
    });

  }
  ///////////////////
  public managedUserEmails: string[] = []; // Add this property to store managed user emails

  /*public async loadManagedUsersEmails(managerId: string): Promise<void> {
    try {
      // Call the method to get managed user emails
      const emails = await this.usersService.groupUserManager(managerId);
      console.log('emails', emails);
      this.managedUserEmails = emails; // Set the retrieved emails
    } catch (error) {
      console.error('Error loading managed user emails:', error);
    }
  }*/

  //////////////////
  public onDelete(user: Profile): void {
    this.deleteUser.emit(user);

  }

  public onToggleAdmin(element: Profile, event: MatSlideToggleChange): void {
    // Appel de la méthode onToggleAdmin du service UserService
    this.usersService.onToggleAdmin(element, event);
    console.log('element', element);

  }

}
