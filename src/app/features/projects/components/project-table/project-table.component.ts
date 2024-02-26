import { CUSTOM_ELEMENTS_SCHEMA, Component, EventEmitter, Output } from '@angular/core';
import { DatePipe, NgIf } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { AbstractTableComponent } from '../../../../components/table.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslocoModule } from '@ngneat/transloco';
import { Project } from '../../models/Project.model';

@Component({
  standalone: true,
  selector: 'app-project-table',
  styleUrls: ['project-table.component.scss'],
  templateUrl: 'project-table.component.html',
  imports: [
    NgIf,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    TranslocoModule,
    DatePipe

  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProjectTableComponent extends AbstractTableComponent<Project> {
  @Output()
  public updateRole = new EventEmitter<Project>();

  @Output()
  public deleteproject = new EventEmitter<Project>();

  public override readonly displayedColumns: string[] = [
    'name','actions'
  ];
  public onSelectionChange(change: MatSelectChange, user: Project): void {

  }
  
  public onDelete(user: Project): void {
    this.deleteproject.emit(user);
  }
  public onUpdate(user: Project): void {
    this.updateRole.emit(user);
  }
}
