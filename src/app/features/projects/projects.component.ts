import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, DatePipe, JsonPipe, NgFor, NgIf } from '@angular/common';
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
import { Project } from './models/Project.model';
import { HttpClientModule } from '@angular/common/http';
import { editProjectComponent } from './components/edit-projet.component';


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
        <mat-form-field appearance="outline">
          <mat-label>
          {{ 'features.projects.search' | transloco }}
          </mat-label>
          <input type="text" #searchInput matInput />
        </mat-form-field>

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
  providers: [
    ProjectService,
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
    HttpClientModule
  ]
})
export class ProjectsComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly transloco = inject(TranslocoService);
  public project$: Observable<Profile[]>;

  public ngOnInit() {
    this.fetchAll();
  }
  allprojects;

  async fetchAll() {
    this.allprojects = null;
    this.projectService.fetchAllProjects().then(li => {
      console.log(li);
      
      this.allprojects = li
    })

  }
  removeDuplicatesByPropertyName(arr: any[]) {
    const uniqueObjects: { [key: string]: any } = {};

    for (const obj of arr) {
      if (!uniqueObjects[obj['name']]) {
        uniqueObjects[obj['name']] = obj;
      }
    }

    return Object.values(uniqueObjects);
  }
  public deleteproject(project: Project): void {
    // TODO : add a loading spinner
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
        data: { nameproject: project.name,idproject: project.id } // Add your parameters here
      })
      .afterDismissed()
      .pipe(filter((project) => !!project))
      .subscribe((projects: Partial<any>) => {
        this.updateproject(project.id, projects);
      });
  }

  updateproject(nomproject, users) {    
    users.allusers.map(li => {
      const foundUser = users.existuser.users.find(user => user === li.uid);
      if(foundUser){
        this.projectService.updateProjectName(nomproject,li.uid, users.existuser.name);
      }      
      this.projectService.getAllUsersForProject(nomproject, li.uid).then(bool => {        
        if (bool) {
          if (!foundUser) {            
            this.projectService.deleteUserProject(nomproject, li.uid);
          }
        } else {
          if (foundUser) {
            this.projectService.addNewProject(nomproject,users.existuser.name, li.uid);
          }
        }
      });

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
    // TODO: add a loading spinner
    if (project) {
      project.users.map(li => {
        this.projectService.addNewProject(project.name,project.name,li);
      }) 
      this.fetchAll();
      handleResponseSuccessWithAlerts(
        this.transloco.translate('features.projects.success.title'),
        '',
        this.transloco.translate('common.close'),
        () => {
        }
      );
    } else {

    }
  }



  public addproject(): void {
    this.bottomSheet
      .open(addNewProjectComponent, { panelClass: 'bottom-sheet-without-padding' })
      .afterDismissed()
      .pipe(filter((project) => !!project))
      .subscribe((project: Partial<any>) => this.inviteproject(project));
  }
}
