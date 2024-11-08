import { id } from 'date-fns/locale';
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
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { ProfileService } from 'src/app/services/profile.service';
import { Brand, Group, Marque, Product } from "../models/Project.model";
import { Observable } from "rxjs";
import { AsyncPipe } from '@angular/common';
import { startWith, map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

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
      <!-- Origine Autocomplete -->
  <mat-form-field appearance="outline">
    <mat-label>{{ 'features.projects.add-dialog.origine' | transloco }}</mat-label>
    <input type="text" matInput formControlName="group" [matAutocomplete]="autoGroup" />
    <mat-autocomplete #autoGroup="matAutocomplete">
      <mat-option *ngFor="let group of filteredGroups | async" [value]="group">
        {{ group }}
      </mat-option>
    </mat-autocomplete>
  </mat-form-field>

  <!-- Groupe Autocomplete -->
  <mat-form-field appearance="outline">
    <mat-label>{{ 'features.projects.add-dialog.group' | transloco }}</mat-label>
    <input type="text" matInput formControlName="brand" [matAutocomplete]="autoBrand" />
    <mat-autocomplete #autoBrand="matAutocomplete">
      <mat-option *ngFor="let brand of filteredBrands | async" [value]="brand">
        {{ brand }}
      </mat-option>
    </mat-autocomplete>
  </mat-form-field>

  <!-- Client Autocomplete -->
  <mat-form-field appearance="outline">
    <mat-label>{{ 'features.projects.add-dialog.client' | transloco }}</mat-label>
    <input type="text" matInput formControlName="product" [matAutocomplete]="autoProduct" />
    <mat-autocomplete #autoProduct="matAutocomplete">
      <mat-option *ngFor="let product of filteredProducts | async" [value]="product">
        {{ product}}
      </mat-option>
    </mat-autocomplete>
  </mat-form-field>

   <!-- Marque Autocomplete -->
   <mat-form-field appearance="outline">
    <mat-label>{{ 'features.projects.add-dialog.marque' | transloco }}</mat-label>
    <input type="text" matInput formControlName="marque" [matAutocomplete]="autoMarque" />
    <mat-autocomplete #autoMarque="matAutocomplete">
      <mat-option *ngFor="let marque of filteredMarques | async" [value]="marque">
        {{ marque }}
      </mat-option>
    </mat-autocomplete>
  </mat-form-field>
 <!-- New MEDIA Autocomplete -->
 <mat-form-field appearance="outline">
        <mat-label>{{ 'features.projects.add-dialog.media' | transloco }}</mat-label>
        <input type="text" matInput formControlName="media" [matAutocomplete]="autoMedia" />
        <mat-autocomplete #autoMedia="matAutocomplete">
          <mat-option *ngFor="let media of filteredMedia | async" [value]="media">
            {{ media }}
          </mat-option>
        </mat-autocomplete>
      </mat-form-field>
<!-- Name Field with Autocomplete like Media -->
<mat-form-field appearance="outline">
  <mat-label>{{ 'features.projects.add-dialog.name' | transloco }}</mat-label>
  <input type="text" matInput formControlName="name" [matAutocomplete]="autoName" />
  <mat-autocomplete #autoName="matAutocomplete">
    <mat-option *ngFor="let name of filteredNames | async" [value]="name">
      {{ name }}
    </mat-option>
  </mat-autocomplete>
  <mat-error *ngIf="formGroup.get('name')?.hasError('required')">
    {{ 'common.form.required' | transloco }}
  </mat-error>
  <mat-error *ngIf="formGroup.get('name')?.hasError('name')">
    {{ 'common.form.name' | transloco }}
  </mat-error>
</mat-form-field>
    <!-- Manager, Users -->
      <mat-form-field appearance="outline">
        <mat-label>
          {{ 'features.projects.add-dialog.maneger' | transloco }}
        </mat-label>
        <mat-select formControlName="manager">
          <mat-option *ngFor="let element of usersMan" [value]="element.uid">{{element.email}}</mat-option>
        </mat-select>
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
    NgIf, NgFor,
    MatToolbarModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    TranslocoModule,
    MatIconModule,
    MatAutocompleteModule,
    AsyncPipe
    ],
})
export class addNewProjectComponent implements OnInit {
  private readonly bottomSheetRef = inject(MatBottomSheetRef<addNewProjectComponent>);
  private readonly formBuilder = inject(FormBuilder);
  public formGroup: FormGroup;
  private readonly usersService = inject(UsersService);
  private readonly profileService=inject(ProfileService)
  private readonly projectService = inject(ProjectService);
  users: Profile[]
  usersMan: Profile[];
  //////////////
  groups: string[] = ['Locaux','Etranger'];
  filteredGroups: Observable<string[]>;

  brands: string[] = ['DU DIGITAL','PGH','ROAD HERO','Second chance','STE La paix -','Textil retail'];
  filteredBrands: Observable<string[]>;

  products: string[] = ['DU DIGITAL',' Med oil compagny','CHAHRAZED','CITY MARKET','GIPA','Mazraa Market','KIABI'];
  filteredProducts: Observable<string[]>;
  marques: string[] = ['DU DIGITAL','Jadida','Golden ships','ICE VEGAS','OLA','ROAD HERO'];
  filteredMarques: Observable<string[]>;
  // New MEDIA field
  mediaTypes = ['Conseil', 'Digital', 'Kepler', 'Offline', 'Produit'];
  filteredMedia: Observable<string[]>;
  projectNames: string[] = [
    'Strategie',
    'Account Mgt',
    'Training',
    'Etude et recherche "SURVEY"',
    'Audit Technique',
    'UX UI',
    'Audit SEO',
    'Brand Book',
    'Audit DATA',
    'Social Media Mgt',
    'Performance - Paid Social',
    'Performance - Google Ads',
    'Content',
    'Influenceur',
   'Display',
    'Programmatic',
    'LISTENING & E-REPUTATION',
    'MMM (Mix Media Modeling)',
    'Segmentation',
    'Scoring',
    'TV',
    'Content- TV',
'Content- Radio',
    'Radio',
    'OOH',
    'Presse',
    'DASHBOARDING'
    ,'Chatbot - IA',
    'Data Management & Reporting'
  ];
  filteredNames: Observable<string[]>;

  public ngOnInit(): void {
    this.usersService.fetchAllUsers().subscribe(list => {
      this.users = list
      // Filtrer les utilisateurs ayant le rôle "manager"
      this.usersMan = list.filter(user => user.role === 'manager');
    })
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      users: [[], Validators.required],
      manager: ['', Validators.required] ,
      group: ['', Validators.required],
      brand: ['', Validators.required],
      product: ['', Validators.required],
      marque: ['', Validators.required],
      media: ['', Validators.required]  // New MEDIA field

     });
     // Setup filtering for each field
  // Setup filtering for each field using the generalized _filterItems method
this.filteredGroups = this.formGroup.get('group')!.valueChanges.pipe(
  startWith(''),
  map(value => this._filterItems(value || '', this.groups))
);

this.filteredBrands = this.formGroup.get('brand')!.valueChanges.pipe(
  startWith(''),
  map(value => this._filterItems(value || '', this.brands))
);

this.filteredProducts = this.formGroup.get('product')!.valueChanges.pipe(
  startWith(''),
  map(value => this._filterItems(value || '', this.products))
);

this.filteredMarques = this.formGroup.get('marque')!.valueChanges.pipe(
  startWith(''),
  map(value => this._filterItems(value || '', this.marques))
);

this.filteredMedia = this.formGroup.get('media')!.valueChanges.pipe(
  startWith(''),
  map(value => this._filterItems(value || '', this.mediaTypes))
);
this.filteredNames = this.formGroup.get('name')!.valueChanges.pipe(
  startWith(''),
  map(value => this._filterItems(value || '', this.projectNames))
);
    }
// Generalized filtering method
private _filterItems(value: string, list: string[]): string[] {
  const filterValue = value.toLowerCase();
  return list.filter(item => item.toLowerCase().includes(filterValue));
}


    inviteUser(): void {
        this.bottomSheetRef.dismiss(this.formGroup.value);
        const projectData = this.formGroup.value;
    const idproject = ''; // Replace this with actual ID logic
    const iduser = '';
   const groupId ='';
    const brandId='';
    const productId='';
    const marqueId ='';
    const mediaId='';
    this.projectService.addNewProject(
      idproject,
      projectData.name,
      iduser,
      projectData.manager,
      projectData.users,groupId,brandId,productId,marqueId,mediaId
    );
    this.bottomSheetRef.dismiss(this.formGroup.value);

    }
    

  public close(): void {
    this.bottomSheetRef.dismiss();
  }
}
