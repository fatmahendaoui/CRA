import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, JsonPipe, NgFor, NgIf } from '@angular/common';
import { Observable, Subscription, filter } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { LoaderComponent } from '../../components/loader.component';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { Profile } from 'src/app/models/profile.model';
import { ProjectService } from '../projects/services/projects.service';
import { tovalidateTableComponent } from './components/tovalidate-table/tovalidate-table.component';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Months } from '../timesheet/models/dates.constants';

@Component({
  standalone: true,
  selector: 'app-tovalidate',
  template: `
    <ng-container >
      <div class="btn-add">
        <h1>
        {{ 'features.day_off.titre' | transloco }}
        </h1>
      </div>
      <mat-card>
      <mat-form-field appearance="outline">
          <mat-label>
          {{ 'features.projects.filter' | transloco }}
          </mat-label>
          <!-- <input type="text" #searchInput matInput /> -->
        <mat-select [(ngModel)]="status" (ngModelChange)="fetchAll()">
          <mat-option value="Submitted">{{ 'features.projects.table.submitted' | transloco }}</mat-option>
          <mat-option value="Improved">{{ 'features.liste_conge.approved' | transloco }}</mat-option>
          <mat-option value="On going">{{ 'features.projects.table.on-going' | transloco }} ({{nameMonth}} {{year}})</mat-option>
        </mat-select>
        </mat-form-field>
 
        <app-tovalidate-table *ngIf="tovalidate"
          [data]="tovalidate"
        >
        </app-tovalidate-table>
        <ng-container *ngIf="!tovalidate">
      <app-loader>Chargement ...</app-loader>
    </ng-container>
      </mat-card>
    </ng-container>

 
  `,
  providers: [

  ],
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
  ]
})
export class tovalidateComponent implements OnInit {
  private readonly bottomSheet = inject(MatBottomSheet);
  public tovalidate;
  private readonly transloco = inject(TranslocoService);
  nameMonth: string;
  private ProjectService = inject(ProjectService);
  month: string[] = Months;
  year;
  status: string = 'Submitted'
  public ngOnInit() {
    this.fetchAll();
    this.setMonthName();
    this.year = new Date().getFullYear();
    this.transloco.langChanges$.subscribe(() => this.setMonthName());
  }
  private setMonthName() {
    const currentMonthIndex = new Date().getMonth();
    const monthNamesKeys = [
      'features.months.january',
      'features.months.february',
      'features.months.march',
      'features.months.april',
      'features.months.may',
      'features.months.june',
      'features.months.july',
      'features.months.august',
      'features.months.september',
      'features.months.october',
      'features.months.november',
      'features.months.december'
    ];
    const currentLang = this.transloco.getActiveLang();
    this.transloco.selectTranslate(monthNamesKeys[currentMonthIndex], {}, currentLang).subscribe((translation) => {
      this.nameMonth = translation;
    });
  }

  public fetchAll(): void {
    this.tovalidate = null;
    if (this.status == 'On going') {
      this.ProjectService.getongoingDateShipCRAs(this.status, this.nameMonth + '_' + this.year).then(li => {
        this.tovalidate = li;
      })
    }
    else {
      this.ProjectService.getSubmittedDateShipCRAs(this.status).then(li => {
        this.tovalidate = li;
      })
    }
  }

  handleResponse(arg0: Subscription, arg1: string) {
    throw new Error('Method not implemented.');
  }

}
