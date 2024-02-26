import { NgFor, NgIf } from "@angular/common";
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
import { UsersService } from "../../users/services/users.service";
import { Profile } from "src/app/models/profile.model";
import { ProjectService } from "../services/projects.service";

@Component({
  standalone: true,
  selector: 'app-invite-user',
  template: `
    <mat-toolbar>
      <mat-toolbar-row>
        <span>
          {{ 'features.projects.add-dialog.title' | transloco }}
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
        {{ 'features.projects.add-dialog.name' | transloco }}
        </mat-label>
        <input matInput formControlName="name" />
        <mat-error *ngIf="formGroup.get('name')?.hasError('required')">
          {{ 'common.form.required' | transloco }}
        </mat-error>
        <mat-error *ngIf="formGroup.get('name')?.hasError('name')">
          {{ 'common.form.name' | transloco }}
        </mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>
          {{ 'features.projects.add-dialog.users' | transloco }}
        </mat-label>
        <mat-select formControlName="users" multiple>
          <mat-option *ngFor="let element of users" [value]="element.uid">{{element.email}}
            </mat-option>
        </mat-select>
      </mat-form-field>

      <button mat-flat-button color="primary" type="submit" [disabled]="!formGroup.valid">
        {{ 'features.projects.add-dialog.action' | transloco }}
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
  providers: [
    UsersService,
    ProjectService
  ],
  imports: [
    NgIf,NgFor,
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
export class addNewProjectComponent implements OnInit {
  private readonly bottomSheetRef = inject(MatBottomSheetRef<addNewProjectComponent>);
  private readonly formBuilder = inject(FormBuilder);
  public formGroup: FormGroup;
  private readonly usersService = inject(UsersService);
  users: Profile[]
  public ngOnInit(): void {
    this.usersService.fetchAllUsers().subscribe(list => {
      this.users = list
    })
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      users: [[], Validators.required]
    });
  }

  public inviteUser(): void {
    this.bottomSheetRef.dismiss(this.formGroup.value);
  }

  public close(): void {
    this.bottomSheetRef.dismiss();
  }
}
