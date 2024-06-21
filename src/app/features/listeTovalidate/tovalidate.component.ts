import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, JsonPipe, NgFor, NgIf } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { LoaderComponent } from '../../components/loader.component';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { ProjectService } from '../projects/services/projects.service';
import { tovalidateTableComponent } from './components/tovalidate-table/tovalidate-table.component';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Months } from '../timesheet/models/dates.constants';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-tovalidate',
  styleUrls: ['components/tovalidate-table/tovalidate-table.component.scss'],
  template: `
    <ng-container>
      <div class="btn-add">
        <h1>{{ 'features.day_off.titre' | transloco }}</h1>
        <div class="filter-table">
          <div class="mois">
            <button mat-mini-fab color="primary" (click)="getMonth(false)">
              <mat-icon>navigate_before</mat-icon>
            </button>
            <h3 style="font-weight: bold;">{{ nameMonth }}</h3>
            <button mat-mini-fab color="primary" (click)="getMonth(true)">
              <mat-icon>navigate_next</mat-icon>
            </button>
          </div>
          <div class="year">
            <button mat-mini-fab color="primary" (click)="getYear(false)">
              <mat-icon>navigate_before</mat-icon>
            </button>
            <h3 style="font-weight: bold;">{{ year }}</h3>
            <button mat-mini-fab color="primary" (click)="getYear(true)">
              <mat-icon>navigate_next</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <mat-card>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'features.projects.filter' | transloco }}</mat-label>
          <mat-select [(ngModel)]="status" (ngModelChange)="fetchAll()">
            <mat-option value="Submitted">{{ 'features.projects.table.submitted' | transloco }}</mat-option>
            <mat-option value="Improved">{{ 'features.liste_conge.approved' | transloco }}</mat-option>
            <mat-option value="On going">{{ 'features.projects.table.on-going' | transloco }} ({{ nameMonth }} {{ year }})</mat-option>
          </mat-select>
        </mat-form-field>
        <app-tovalidate-table *ngIf="tovalidate" [data]="tovalidate"></app-tovalidate-table>
        <ng-container *ngIf="!tovalidate">
          <app-loader>Chargement ...</app-loader>
        </ng-container>
      </mat-card>
    </ng-container>
  `,
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    JsonPipe,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatBottomSheetModule,
    MatProgressSpinnerModule,
    LoaderComponent,
    FormsModule,
    MatSelectModule,
    TranslocoModule,
    tovalidateTableComponent,
    MatIconModule
  ]
})
export class tovalidateComponent implements OnInit {
  private readonly bottomSheet = inject(MatBottomSheet);
  public tovalidate;
  private readonly transloco = inject(TranslocoService);
  nameMonth: string;
  private ProjectService = inject(ProjectService);
  month: string[] = Months;
  year: number;
  status: string = 'Submitted';
  private monthNames = {
    en: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    fr: [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
  };
  public ngOnInit() {
    this.year = new Date().getFullYear();
    this.setMonthName();
    this.transloco.langChanges$.subscribe(() => this.setMonthName());
    this.fetchAll();
  }

  private setMonthName() {
    const currentMonthIndex = new Date().getMonth();
    const currentLang = this.transloco.getActiveLang();
    this.nameMonth = this.monthNames[currentLang][currentMonthIndex];


  }

  public fetchAll(): void {
    this.tovalidate = null;
    const monthYear = this.nameMonth + '_' + this.year;

    if (this.status === 'On going') {
      this.ProjectService.getongoingDateShipCRAs(this.status, monthYear).then((items) => {
        this.tovalidate = items;
      });
    } else {
      this.ProjectService.getSubmittedDateShipCRAs(this.status).then((items) => {
        this.tovalidate = items.filter((item) => item.month === monthYear);
      });
    }
  }

  getYear(op: boolean): void {
    this.year += op ? 1 : -1;
    this.fetchAll();
  }

  getMonth(op: boolean): void {
    const currentLang = this.transloco.getActiveLang();
    const currentMonthIndex = this.monthNames[currentLang].indexOf(this.nameMonth);
    let newMonthIndex = currentMonthIndex + (op ? 1 : -1);
    if (newMonthIndex < 0) {
      newMonthIndex = 11; // décembre
      this.year--;
    } else if (newMonthIndex > 11) {
      newMonthIndex = 0; // janvier
      this.year++;
    }
    this.nameMonth = this.monthNames[currentLang][newMonthIndex];

    this.fetchAll();
  }
}
