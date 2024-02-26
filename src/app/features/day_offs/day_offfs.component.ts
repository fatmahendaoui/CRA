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
import { displayConfirmationAlert, handleResponseErrorWithAlerts, handleResponseSuccessWithAlerts } from 'src/app/common/alerts.utils';
import { Day_offService } from './services/day_off.service';
import { Day_offTableComponent } from './components/day_off-table/day_off-table.component';
import { ProfileService } from 'src/app/services/profile.service';
import { Edit_day_offComponent } from './components/edit_day_off';
import { MatDialogModule } from '@angular/material/dialog';
import { Add_day_offComponent } from './components/add_day_off';
@Component({
  standalone: true,
  selector: 'app-day_off',
  template: `
    <ng-container *ngIf="day_off$ | async as day_off">

      <div class="btn-add">
        <h1>
        {{ 'features.day_off.title' | transloco }}
        </h1>
        <button mat-flat-button color="primary" (click)="addday_off()">
        {{ 'features.day_off.add-dialig-title' | transloco }}
        </button>
      </div>

      <mat-card>
        <app-day_off-table
          [data]="day_off"
          (deleteday_off)="deleteday_off($event)"  (updateDay_off)="updateDay_off($event)"
        >
        </app-day_off-table>
      </mat-card>
    </ng-container>

    <ng-template #loading>
      <app-loader>Chargement des utilisateurs</app-loader>
    </ng-template>
  `,
  providers: [
    Day_offService,
    ProfileService
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
    MatDialogModule,
    TranslocoModule,
    Day_offTableComponent
  ]
})
export class day_offComponent implements OnInit {
  private readonly bottomSheet = inject(MatBottomSheet);
  public day_off$: Observable<Profile[]>;
  private readonly transloco = inject(TranslocoService);

  private Day_offService = inject(Day_offService);


  public ngOnInit() {
    this.fetchAll();
  }

  public fetchAll(): void {
    this.day_off$ = this.Day_offService.fetchAlldaysoff();
  }

  public deleteday_off(Date): void {
    // TODO : add a loading spinner
    displayConfirmationAlert(
      this.transloco.translate('features.day_off.confirmation'),
      this.transloco.translate('common.confirm'),
      this.transloco.translate('common.cancel'),
    )
      .then((result) => {
        if (result.isConfirmed) {
          this.Day_offService.deletedaysoff(Date.date)
            .subscribe({
              next: () => this.fetchAll(),
              error: () => alert('Une erreur est survenue lors de la suppression de l\'jours')
            }), 'remove'

        }
      });
  }
  private inviteday_off(day_off: Partial<any>): void {
    // TODO: add a loading spinner
    if (day_off) {
      this.Day_offService.AddDay_off(day_off)
        .then(() => {
          // Invitation was successful
          this.fetchAll(); // Replace this with your fetchAll logic
          handleResponseSuccessWithAlerts(
            this.transloco.translate('features.day_off.success'),
            '',
            this.transloco.translate('common.close'),
            () => { }
          );
        })
        .catch((error: any) => {
          // Handle errors
          console.error('Error inviting day_off:', error);

          // Check if the error code indicates email-already-in-use
          if (error.code === 'auth/email-already-in-use') {
            handleResponseErrorWithAlerts(
              this.transloco.translate('features.day_off.error.title'),
              this.transloco.translate('features.day_off.error.message'),
              this.transloco.translate('common.close'),
            );
          } else {
            // Handle other error cases
            handleResponseErrorWithAlerts(
              this.transloco.translate('features.day_off.error.title'),
              this.transloco.translate('features.day_off.error.message'),
              this.transloco.translate('common.close'),
            );
          }
        });
    }
  }

  public updateDay_off(day_off) {
    this.bottomSheet
      .open(Edit_day_offComponent, {
        panelClass: 'bottom-sheet-without-padding',
        data: day_off // Add your parameters here
      })
      .afterDismissed()
      .pipe(filter((Day_off) => !!Day_off))
      .subscribe((Day_offs: any) => {
        console.log(Day_offs);

        this.Day_offService.UpdateDayOffName(Day_offs).then(li => {
          this.fetchAll();
          handleResponseSuccessWithAlerts(
            this.transloco.translate('features.day_off.update'),
            '',
            this.transloco.translate('common.close'),
            () => {
            }
          );
        })
      });
  }


  public addday_off(): void {
    this.bottomSheet
      .open(Add_day_offComponent, { panelClass: 'bottom-sheet-without-padding' })
      .afterDismissed()
      .pipe(filter((day_off) => !!day_off))
      .subscribe((day_off: Partial<any>) => this.inviteday_off(day_off));
  }
}
