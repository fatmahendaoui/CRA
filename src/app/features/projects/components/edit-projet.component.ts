import { NgFor, NgIf } from "@angular/common";
import { Component, Inject, OnInit, inject } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
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
          {{ data.nameproject}}
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
        {{ 'features.projects.add-dialog.update' | transloco }}
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
        ProjectService,
    ],
    imports: [
        NgIf, NgFor,
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
export class editProjectComponent implements OnInit {
    private readonly bottomSheetRef = inject(MatBottomSheetRef<editProjectComponent>);
    private readonly formBuilder = inject(FormBuilder);
    public formGroup: FormGroup;
    private readonly usersService = inject(UsersService);
    users: Profile[]
    initialUsersArray
    constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: any) {
    }
    public ngOnInit(): void {
        this.formGroup = this.formBuilder.group({
            users: [[], Validators.required],
            name: ['', Validators.required]
          });
        this.initialUsersArray = []
        this.usersService.fetchAllUsers().subscribe((list) => {
            this.users = list;
      
            const promises = this.users.map((user) => {
              return this.usersService.getAllUsersForProject(this.data.idproject, user.uid).then((bol) => {
                if (bol) {                  
                  this.initialUsersArray.push(user);
                }
              });
            });
      
            Promise.all(promises).then(() => {
              this.formGroup.get('users')?.setValue(this.initialUsersArray.map((user) => user.uid));
              this.formGroup.get('name')?.setValue(this.data.nameproject);

            });
          });

        // 
       
    }

    public inviteUser(): void {
      let data={
        allusers :this.users,
        existuser:this.formGroup.value
      }
        this.bottomSheetRef.dismiss(data);
    }

    public close(): void {
        this.bottomSheetRef.dismiss();
    }
}
