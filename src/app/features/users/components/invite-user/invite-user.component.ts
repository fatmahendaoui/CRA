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

@Component({
  standalone: true,
  selector: 'app-invite-user',
  template: `
    <mat-toolbar>
      <mat-toolbar-row>
        <span>
          {{ 'features.users.add-dialog.title' | transloco }}
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
        {{ 'features.users.add-dialog.email' | transloco }}
        </mat-label>
        <input matInput formControlName="email" />
        <mat-error *ngIf="formGroup.get('email')?.hasError('required')">
          {{ 'common.form.required' | transloco }}
        </mat-error>
        <mat-error *ngIf="formGroup.get('email')?.hasError('email')">
          {{ 'common.form.email' | transloco }}
        </mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>
          {{ 'features.users.add-dialog.role' | transloco }}
        </mat-label>
        <mat-select formControlName="role">
          <mat-option value="user">{{ 'common.role.user' | transloco }}</mat-option>
          <mat-option value="admin">{{ 'common.role.admin' | transloco }}</mat-option>
        </mat-select>
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
    MatIconModule,
  ],
})
export class InviteUserComponent implements OnInit {
  private readonly bottomSheetRef = inject(MatBottomSheetRef<InviteUserComponent>);
  private readonly formBuilder = inject(FormBuilder);
  public formGroup: FormGroup;

  public ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      role: ['user', Validators.required]
    });
  }

  public inviteUser(): void {
    this.bottomSheetRef.dismiss(this.formGroup.value);
  }

  public close(): void {
    this.bottomSheetRef.dismiss();
  }
}
