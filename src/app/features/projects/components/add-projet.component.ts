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
import { Observable } from "rxjs";
import { AsyncPipe } from '@angular/common';
import { startWith, map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { Brand, Group, Marque, Media, Product } from "../models/Project.model";

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
  private readonly usersService = inject(UsersService);
  private readonly profileService=inject(ProfileService)
  private readonly projectService = inject(ProjectService);
  
  public formGroup: FormGroup;
  users: Profile[]
  usersMan: Profile[];
  public groups: Group[] = [];
  public brands: Brand[] = [];
  public products: Product[] = [];
  public marques: Marque[] = [];
  public mediaTypes = ['Conseil', 'Digital', 'Martech', 'Produit', 'Offline','Internal','Pitch'];
  public dataLoaded = false;   
  private allProjectNames = [
    'Account Mgt', 'Audit DATA', 'Audit SEO', 'Audit Technique', 'Branding', 'CAPI', 
    'Chatbot - IA', 'Content', 'Content- Radio', 'Content- TV', 'DASHBOARDING', 
    'Data Management & Reporting', 'Display', 'Etude et recherche "SURVEY"', 'Generative AI', 
    'Influenceur', 'Kepler MMM', 'Kepler Scoring', 'Kepler Segmentation', 
    'LISTENING & E-REPUTATION', 'OOH', 'Performance - Google Ads', 'Performance - Paid Social', 
    'Presse', 'Programmatic', 'Radio', 'Social Media Mgt', 'Strategie', 'Training', 'TV', 'UGC', 
    'UX UI','Activities','HR House','Offline','Performance','Social','Product','Martech Solution','Presentation'
  ];

  // Project names filtered by media type
  public projectNames: string[] = this.allProjectNames;

  // Filtered autocomplete options
  public filteredGroups: Observable<string[]>;
  public filteredBrands: Observable<string[]>;
  public filteredProducts: Observable<string[]>;
  public filteredMarques: Observable<string[]>;
  public filteredMedia: Observable<string[]>;
  public filteredNames: Observable<string[]>;

  public ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      users: [[], Validators.required],
      manager: ['', Validators.required],
      group: ['', Validators.required],
      brand: ['', Validators.required],
      product: ['', Validators.required],
      marque: ['', Validators.required],
      media: ['', Validators.required]
    });
    this.formGroup.disable();

    this.projectService.getHierarchyByDomain(this.profileService.profile.idDomaine)
      .then(hierarchy => {
        this.groups = hierarchy.groups;
        this.brands = hierarchy.brands;
        this.products = hierarchy.products;
        this.marques = hierarchy.marques;
             
        this.filteredGroups = this._setupFilter('group', this.groups.map(g => g.name));
        this.filteredBrands = this._setupFilter('brand', this.brands.map(b => b.name));
        this.filteredProducts = this._setupFilter('product', this.products.map(p => p.name));
        this.filteredMarques = this._setupFilter('marque', this.marques.map(m => m.name));
        this.filteredMedia = this._setupFilter('media', this.mediaTypes);
        this.filteredNames = this._setupFilter('name', this.projectNames);
        this.dataLoaded = true;
        
          this.formGroup.enable();
        
        // Subscribe to media changes to update project names
        this.formGroup.get('media')?.valueChanges.subscribe(media => {
          this.updateProjectNamesBasedOnMedia(media);
        });
      })
      .catch(err => {
        console.error('Hierarchy error:', err);
        this.dataLoaded = false;
        this.formGroup.disable();

      });

    this.usersService.fetchAllUsers().subscribe(list => {
      this.users = list
      this.usersMan = list.filter(user => user.role === 'manager');
    })

  
  
  }

  private updateProjectNamesBasedOnMedia(media: string): void {
    if (media === 'Conseil') {
      this.projectNames = ['Strategie', 'Account Mgt', 'Training'];
    } else if (media === 'Digital') {
      this.projectNames = [
        'Social Media Mgt',
        'Performance - Paid Social',
        'Performance - Google Ads',
        'Content',
        'Influenceur'
      ];
    }  else if (media === 'Martech') {
      this.projectNames = ['UGC'];
    } else if (media === 'Produit') {
      this.projectNames = ['DASHBOARDING'];
    }else if (media === 'Offline') {
      this.projectNames = ['Content- Radio', 'Content- TV', 'OOH', 'Radio', 'TV', 'Presse'];
    }else if (media === 'Internal') {
      this.projectNames = ['Activities','HR House'];
    }else if (media === 'Pitch') {
      this.projectNames = ['Offline','Performance','Social','Product','Martech Solution','Presentation','Strategie'];
    }else{
      this.projectNames = this.allProjectNames;
    }
    
    // Update the filtered names observable
    this.filteredNames = this._setupFilter('name', this.projectNames);
    // Reset the name field to ensure the dropdown shows the correct options
    this.formGroup.get('name')?.setValue('');
  }

     /**
   * Helper to set up a filter for an autocomplete field
   * @param controlName - Form control name
   * @param options - List of options for autocomplete
   */
  private _setupFilter(controlName: string, options: string[]): Observable<string[]> {
    return this.formGroup.get(controlName)!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterItems(value || '', options))
    );
  }

 /**
   * Generalized filtering function
   */
  private _filterItems(value: string, list: string[]): string[] {
    const filterValue = value.toLowerCase();
    return list.filter(item => item.toLowerCase().includes(filterValue));
  }

    /**
   * Handle form submission and project creation
   */
  public inviteUser(): void {
    const projectData = this.formGroup.value;
    const idproject = uuidv4()||"";

    this.projectService.addNewProject(
      idproject,
      projectData.name,
      '', // Replace with user ID if applicable
      projectData.manager,
      projectData.users,
      '', '', '', '', '','', '', '', '', '' // Replace groupId, brandId, etc., with actual IDs if needed
    );

    this.bottomSheetRef.dismiss(this.formGroup.value);
  }
    
 /**
   * Close the bottom sheet
   */
  public close(): void {
    this.bottomSheetRef.dismiss();
  }
}