import { NgIf } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatToolbarModule } from "@angular/material/toolbar";
import { TranslocoModule } from "@ngneat/transloco";
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  standalone: true,
  selector: 'app-day-off',
  template: `
    <mat-toolbar>
      <mat-toolbar-row>
        <span>
          {{ 'features.day_off.add-dialig-title' | transloco }}
        </span>
        <span class="spacer"></span>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </mat-toolbar-row>
    </mat-toolbar>

    <form class="invite-user-form" [formGroup]="formGroup" (ngSubmit)="inviteUser()">
    <mat-form-field appearance="outline">
        <mat-label>
        {{ 'features.day_off.name' | transloco }}
          </mat-label>
        <input matInput formControlName="name" />
      </mat-form-field>
    <mat-form-field>
  <mat-label>Date Day Off</mat-label>
  <input matInput [matDatepicker]="picker"  formControlName="date">
  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
  <mat-datepicker #picker></mat-datepicker>
</mat-form-field>

      <button mat-flat-button color="primary" type="submit" [disabled]="!formGroup.valid">
        {{ 'features.users.add-dialog.action' | transloco }}
      </button>
    </form>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      padding: 0;
    }

    .invite-user-form {
      padding: 16px;
      display: flex;
      flex-direction: column;
    }

    span{
      color: #E11D74;
      font-weight: 500;
      font-size: 1rem;
    }
  `],
  imports: [
    NgIf,
    MatToolbarModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    TranslocoModule,
    MatDatepickerModule,
    MatIconModule,
  ],
})
export class Add_day_offComponent implements OnInit {
  private readonly bottomSheetRef = inject(MatBottomSheetRef<Add_day_offComponent>);
  private readonly formBuilder = inject(FormBuilder);
  public formGroup: FormGroup;

  public ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      date: [null, Validators.required],
      name: ['']
    });
  }

  public inviteUser(): void {
    this.bottomSheetRef.dismiss(this.formGroup.value);
  }

  public close(): void {
    this.bottomSheetRef.dismiss();
  }
}
