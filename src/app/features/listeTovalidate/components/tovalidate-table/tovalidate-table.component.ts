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
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-tovalidate-table',
  styleUrls: ['tovalidate-table.component.scss'],
  templateUrl: 'tovalidate-table.component.html',
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
export class tovalidateTableComponent extends AbstractTableComponent<any> {

  @Output()
  public deletetovalidate = new EventEmitter<any>();

  public override readonly displayedColumns: string[] = [
    'name','month','actions'
  ];

  public onDelete(tovalidate: any): void {
    this.deletetovalidate.emit(tovalidate);
  }
  transfertdate(x){
    let result
    const parts = x.split('_');
    if (parts.length === 2) {
      const month = this.getMonthIndex(parts[0]);
      const year = parseInt(parts[1], 10);

      if (!isNaN(month) && !isNaN(year)) {
        // Create a new Date object for the specified month and year
        result = new Date(year, month, 1);
      }
    }
    return result;
  }
  getMonthIndex(monthName: string): number {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.indexOf(monthName);
  }
}
