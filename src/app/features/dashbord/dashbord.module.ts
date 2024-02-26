import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashbordComponent } from './dashbord.component';
import { RouterModule, Routes } from '@angular/router';
import { AsyncPipe, DatePipe, JsonPipe, NgFor, NgIf } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { LoaderComponent } from '../../components/loader.component';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { HttpClientModule } from '@angular/common/http';
import { ProjectService } from '../projects/services/projects.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import {MatTabsModule} from '@angular/material/tabs';

const routes: Routes = [
  {
    path: '',
    component: DashbordComponent
  }
];


@NgModule({
  declarations: [
    DashbordComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NgIf,
    NgFor,
    AsyncPipe,
    JsonPipe,
    MatTabsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatBottomSheetModule,
    MatProgressSpinnerModule,
    LoaderComponent,
    TranslocoModule,
    HttpClientModule,
    NgApexchartsModule,
    MatIconModule,
        MatSelectModule,
        FormsModule
  ],
  providers: [ProjectService]
})
export class DashbordModule { }
