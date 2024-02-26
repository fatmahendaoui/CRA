import { Component, EventEmitter, Output } from '@angular/core';
import { DatePipe, NgIf } from '@angular/common';
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

@Component({
  standalone: true,
  selector: 'app-users-table',
  styleUrls: ['users-table.component.scss'],
  templateUrl: 'users-table.component.html',
  imports: [
    NgIf,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    TranslocoModule,
    DatePipe,
    RouterLink,


  ],
})
export class UsersTableComponent extends AbstractTableComponent<Profile> {
  @Output()
  public updateRole = new EventEmitter<Profile>();
today:Date=new Date();
  @Output()
  public deleteUser = new EventEmitter<Profile>();

  public override readonly displayedColumns: string[] = [
    'email',
    'role',
    'created_on',
    'actions'
  ];

  public onSelectionChange(change: MatSelectChange, user: Profile): void {
    this.updateRole.emit({
      ...user,
      role: change.value,
    });
  }

  public onDelete(user: Profile): void {
    this.deleteUser.emit(user);
  }
}
