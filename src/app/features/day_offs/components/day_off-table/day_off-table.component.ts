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

@Component({
  standalone: true,
  selector: 'app-day_off-table',
  styleUrls: ['day_off-table.component.scss'],
  templateUrl: 'day_off-table.component.html',
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

  ],
})
export class Day_offTableComponent extends AbstractTableComponent<any> {
  @Output()
  public updateDay_off = new EventEmitter<any>();
  @Output()
  public deleteday_off = new EventEmitter<any>();

  public override readonly displayedColumns: string[] = [
    'name','date','actions'
  ];
  public onUpdate(user): void {
    this.updateDay_off.emit(user);
  }
  public onDelete(day_off: any): void {
    this.deleteday_off.emit(day_off);
  }
}
