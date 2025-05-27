import { id } from 'date-fns/locale';
import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, DatePipe, JsonPipe, NgFor, NgIf, NgStyle } from '@angular/common';
import { Observable, Subscription, filter, forkJoin } from 'rxjs';
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
import { ProjectService } from './services/projects.service';
import { addNewProjectComponent } from './components/add-projet.component';
import { ProjectTableComponent } from './components/project-table/project-table.component';
import { Brand, Group, Marque, Media, Product, Project } from './models/Project.model';
import { HttpClientModule } from '@angular/common/http';
import { editProjectComponent } from './components/edit-projet.component';
import { ProfilService } from '../profileUser/services/profile.service';
import { ProfileService } from 'src/app/services/profile.service';
import { v4 as uuidv4 } from 'uuid';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';


@Component({
  standalone: true,
  selector: 'app-projects',
  template: `
    <ng-container >

      <div class="btn-add">
        <h1>
        {{ 'features.projects.title' | transloco }}
        </h1>
        <button mat-flat-button color="primary" (click)="addproject()">
        {{ 'features.projects.add' | transloco }}
        </button>
      </div>

      <mat-card>
      <div class="form-fields-row">
      
        <mat-form-field appearance="outline">
          <mat-label>
          {{ 'features.projects.search' | transloco }}
          </mat-label>
          <input type="text" #searchInput matInput /> 
        </mat-form-field>
        <span class="button filter">
    <button mat-flat-button color="accent" (click)="showFilters = !showFilters" [ngStyle]="{ 'background-color': showFilters ?  '#193F70':'#E50060' }"
    style="margin-left: 16px;">
      <mat-icon>tune</mat-icon> {{ 'features.projects.filter' | transloco }}
    </button>
  </span>
      </div>
      <div class="form-fields-row" *ngIf="showFilters">
        <mat-form-field appearance="outline">
  <mat-label>{{ 'features.projects.add-dialog.origine' | transloco }}</mat-label>
  <mat-select [(value)]="selectedGroup" (selectionChange)="onGroupSelected()">
    <mat-option *ngFor="let group of groups" [value]="group.id">{{ group.name }}</mat-option>
  </mat-select>
</mat-form-field>

<mat-form-field appearance="outline">
  <mat-label>{{ 'features.projects.add-dialog.group' | transloco }}</mat-label>
  <mat-select [(value)]="selectedBrand" (selectionChange)="onBrandSelected()">
    <mat-option *ngFor="let brand of brands" [value]="brand.id">{{ brand.name }}</mat-option>
  </mat-select>
</mat-form-field>

<mat-form-field appearance="outline">
  <mat-label>{{ 'features.projects.add-dialog.client' | transloco }}</mat-label>
  <mat-select [(value)]="selectedProduct" (selectionChange)="onProductSelected()">
    <mat-option *ngFor="let product of products" [value]="product.id">{{ product.name }}</mat-option>
  </mat-select>
</mat-form-field>
<mat-form-field appearance="outline">
  <mat-label>{{ 'features.projects.add-dialog.marque' | transloco }}</mat-label>
  <mat-select [(value)]="selectedMarque" (selectionChange)="onMarqueSelected()">
    <mat-option *ngFor="let marque of marques" [value]="marque.id">{{ marque.name }}</mat-option>
  </mat-select>
</mat-form-field>
<mat-form-field appearance="outline">
  <mat-label>{{ 'features.projects.add-dialog.media' | transloco }}</mat-label>
  <mat-select [(value)]="selectedMedia">
    <mat-option *ngFor="let media of medias" [value]="media.id">{{ media.name }}</mat-option>
  </mat-select>
</mat-form-field>
 <!-- Buttons for Apply and Reset -->
 <div class="button-row">
    <button mat-raised-button style="background-color: #E50060; color:white" (click)="applyFilters()">{{ 'features.projects.apply' | transloco }}</button>
    <button mat-raised-button style="color: #193F66;" (click)="resetFilters()">{{ 'features.projects.reset' | transloco }}</button>
  </div>
</div>
        <app-project-table *ngIf="allprojects"
          [data]="removeDuplicatesByPropertyName(allprojects)"
          [filter]="searchInput.value"
          (deleteproject)="deleteproject($event)"
          (updateRole)="updateRole($event)"
        >
        </app-project-table>
      </mat-card>
    </ng-container>

    <ng-container *ngIf="!allprojects">
      <app-loader>Chargement ...</app-loader>
    </ng-container>
  `,
  styles: [`
 mat-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  
  .form-fields-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    
    mat-form-field {
      flex: 1;
      min-width: 200px; /* Adjust the minimum width as needed */
    }
  }

  app-project-table {
    margin-top: 24px;
  }
}

  `],
  providers: [
    ProjectService
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
    TranslocoModule,
    ProjectTableComponent,
    HttpClientModule,
    MatSelectModule,
    MatIconModule,NgStyle
  ]
})
export class ProjectsComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly profileService = inject(ProfileService);

  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly transloco = inject(TranslocoService);
  public project$: Observable<Profile[]>;
  //////
  groups: Group[] = [];
  brands: Brand[] = [];
  products: Product[] = [];
  marques: Marque[] = [];
  medias: Media[] = [];
  selectedGroup: string = '';
  selectedBrand: string = '';
  selectedProduct: string = '';
  selectedMarque: string = '';
  selectedMedia: string = '';
  showFilters: boolean = false;

  public ngOnInit() {
    this.fetchAll();
    this.loadGroups();
  }
  
  allprojects;

  async fetchAll() {
    this.allprojects = null;
    // Pass all selected filters to the service
    this.allprojects = await this.projectService.fetchAllProjectsWithFilters(
      this.selectedGroup,
      this.selectedBrand,
      this.selectedProduct,
      this.selectedMarque,
      this.selectedMedia
    );
  }

  removeDuplicatesByPropertyName(arr: any[]) {
    const uniqueObjects: { [key: string]: any } = {};

    for (const obj of arr) {
      if (!uniqueObjects[obj['id']]) {
        uniqueObjects[obj['id']] = obj;
      }
    }
    return Object.values(uniqueObjects);
  }

  public deleteproject(project: Project): void {
    displayConfirmationAlert(
      this.transloco.translate('features.projects.dialog.confirmation'),
      this.transloco.translate('common.confirm'),
      this.transloco.translate('common.cancel'),
    ).then((result) => {
      if (result.isConfirmed) {
        this.projectService.deleteProject(project.id).then(li => {
          this.fetchAll()
        })
      }
    });
  }

  handleResponse(arg0: Subscription, arg1: string) {
    throw new Error('Method not implemented.');
  }

  public updateRole(project: Project) {
    this.bottomSheet
      .open(editProjectComponent, {
        panelClass: 'bottom-sheet-without-padding',
        data: {
          nameproject: project.name, idproject: project.id, managerId: project.managerId,
          groupId: project.groupId, brandId: project.brandId, productId: project.productId, marqueId: project.marqueId, mediaId: project.mediaId
        }
      })
      .afterDismissed()
      .pipe(filter((project) => !!project))
      .subscribe((projects: Partial<any>) => {
        this.updateproject(project.id, projects, project.groupId, project.brandId, project.productId, project.marqueId, project.mediaId);
      });
  }

  updateproject(nomproject, users, groupId, brandId, productId, marqueId, mediaId) {
    const managerId = users.existuser.manager;
    const groupName = users.existuser.group;
    const brandName = users.existuser.brand;
    const productName = users.existuser.product;
    const marqueName = users.existuser.marque;
    const mediaName = users.existuser.media;

    users.allusers.map(li => {
      const foundUser = users.existuser.users.find(user => user === li.uid);
      if (foundUser) {
        this.projectService.updateProjectName(nomproject, li.uid, users.existuser.name);
        this.projectService.updateProjectManager(nomproject, li.uid, managerId);
      }
      this.projectService.getAllUsersForProject(nomproject, li.uid).then(bool => {
        if (bool) {
          if (!foundUser) {
            this.projectService.deleteUserProject(nomproject, li.uid);
          }
        } else {
          if (foundUser) {
            this.projectService.addNewProject(nomproject, users.existuser.name, li.uid, managerId, [], groupId, brandId, productId, marqueId, mediaId, groupName, brandName, productName, marqueName, mediaName);
          }
        }
      });

      if (groupId) {
        this.projectService.updateGroupName(groupId, groupName);
      }

      if (brandId) {
        this.projectService.updateBrandName(groupId, brandId, brandName);
      }

      if (productId) {
        this.projectService.updateProductName(groupId, brandId, productId, productName);
      }

      if (marqueId) {
        this.projectService.updateMarqueName(groupId, brandId, productId, marqueId, marqueName);
      }
      if (mediaId) {
        this.projectService.updateMediaName(groupId, brandId, productId, marqueId, mediaId, mediaName);
      }
      this.fetchAll();
      handleResponseSuccessWithAlerts(
        this.transloco.translate('features.projects.success.update'),
        '',
        this.transloco.translate('common.close'),
        () => {
        }
      );
    })
  }

  private inviteproject(project): void {
    if (project) {
      const managerId = project.manager;
      const users = [...project.users, managerId];

      this.projectService.findGroupByNameAndDomain(project.group, this.profileService.profile.idDomaine)
        .then(existingGroupId => {
          let groupId = existingGroupId || uuidv4();
          if (!existingGroupId) {
            return this.projectService.createGroup(groupId, project.group, this.profileService.profile.idDomaine)
              .then(() => groupId);
          }
          return groupId;
        })
        .then(groupId => {
          return this.projectService.findBrandByNameAndGroup(project.brand, groupId)
            .then(existingBrandId => {
              const brandId = existingBrandId || uuidv4();
              if (!existingBrandId) {
                return this.projectService.createBrand(brandId, project.brand, groupId)
                  .then(() => brandId);
              }
              return brandId;
            })
            .then(brandId => {
              return this.projectService.findProductByNameAndBrand(project.product, groupId, brandId)
                .then(existingProductId => {
                  const productId = existingProductId || uuidv4();
                  if (!existingProductId) {
                    return this.projectService.createProduct(productId, project.product, groupId, brandId)
                      .then(() => productId);
                  }
                  return productId;
                })
                .then(productId => {
                  return this.projectService.findMarqueByNameAndProduct(project.marque, groupId, brandId, productId)
                    .then(existingMarqueId => {
                      const marqueId = existingMarqueId || uuidv4();
                      if (!existingMarqueId) {
                        return this.projectService.createMarque(marqueId, project.marque, groupId, brandId, productId)
                          .then(() => marqueId);
                      }
                      return marqueId;
                    })
                    .then(marqueId => {
                      return this.projectService.findMediaByNameAndMarque(project.media, groupId, brandId, productId, marqueId)
                        .then(existingMediaId => {
                          const mediaId = existingMediaId || uuidv4();
                          if (!existingMediaId) {
                            return this.projectService.createMedia(mediaId, project.media, groupId, brandId, productId, marqueId)
                              .then(() => mediaId);
                          }
                          return mediaId;
                        })
                        .then(mediaId => {
                          project.id = uuidv4();
                          return Promise.all(
                            project.users.map(li =>
                              this.projectService.addNewProject(project.id, project.name, li, managerId, users, groupId, brandId, productId, marqueId, mediaId, project.group, project.brand, project.product, project.marque, project.media)
                            )
                          );
                        });
                    });
                });
            });
        })
        .then(() => {
          this.fetchAll();
          handleResponseSuccessWithAlerts(
            this.transloco.translate('features.projects.success.title'),
            '',
            this.transloco.translate('common.close'),
            () => { }
          );
        })
        .catch(error => {
          console.error('Error during project invitation process:', error);
        });
    }
  }

  public addproject(): void {
    this.bottomSheet
      .open(addNewProjectComponent, { panelClass: 'bottom-sheet-without-padding' })
      .afterDismissed()
      .pipe(filter((project) => !!project))
      .subscribe((project: Partial<any>) => this.inviteproject(project));
  }

  async loadGroups() {
    const domainId = this.profileService.profile.idDomaine;
    this.groups = await this.projectService.getGroupsByDomain(domainId);
  }

  async onGroupSelected() {
    this.selectedBrand = '';
    this.selectedProduct = '';
    this.selectedMarque = '';
    this.selectedMedia = '';
    if (this.selectedGroup) {
      this.brands = await this.projectService.getBrandsByGroup(this.selectedGroup);
    } else {
      this.brands = [];
    }
    this.products = [];
    this.marques = [];
    this.medias = [];
  }

  async onBrandSelected() {
    this.selectedProduct = '';
    this.selectedMarque = '';
    this.selectedMedia = '';
    if (this.selectedGroup && this.selectedBrand) {
      this.products = await this.projectService.getProductsByBrand(this.selectedGroup, this.selectedBrand);
    } else {
      this.products = [];
    }
    this.marques = [];
    this.medias = [];
  }

  async onProductSelected() {
    this.selectedMarque = '';
    this.selectedMedia = '';
    if (this.selectedGroup && this.selectedBrand && this.selectedProduct) {
      this.marques = await this.projectService.getMarquesByProduct(this.selectedGroup, this.selectedBrand, this.selectedProduct);
    } else {
      this.marques = [];
    }
    this.medias = [];
  }

  async onMarqueSelected() {
    this.selectedMedia = '';
    if (this.selectedGroup && this.selectedBrand && this.selectedProduct && this.selectedMarque) {
      this.medias = await this.projectService.getMediaByMarque(this.selectedGroup, this.selectedBrand, this.selectedProduct, this.selectedMarque);
    } else {
      this.medias = [];
    }
  }

  applyFilters() {
    this.fetchAll();
  }

  resetFilters() {
    this.selectedGroup = '';
    this.selectedBrand = '';
    this.selectedProduct = '';
    this.selectedMarque = '';
    this.selectedMedia = '';
    this.brands = [];
    this.products = [];
    this.marques = [];
    this.medias = [];
    this.fetchAll();
  }
}