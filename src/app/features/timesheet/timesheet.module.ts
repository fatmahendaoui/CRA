import { NgModule } from '@angular/core';
import { AsyncPipe, CommonModule, JsonPipe } from '@angular/common';
import { TimesheetComponent } from './components/timesheet/timesheet.component';
import { DateService } from './services/date.service'; // Import your service here
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoaderComponent } from 'src/app/components/loader.component';
import { TranslocoModule } from '@ngneat/transloco';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../projects/services/projects.service';
import { DisableWeekendsDirective } from './directives/disable-weekends.directive';
import { RouterModule, Routes } from '@angular/router';
import { UsersService } from '../users/services/users.service';
import { MatSelectModule } from '@angular/material/select';
import { Day_offService } from '../day_offs/services/day_off.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatToolbarModule } from '@angular/material/toolbar';

const routes: Routes = [
  {
    path: ':uid/:date',
    component: TimesheetComponent
  }
];


@NgModule({
  declarations: [
    TimesheetComponent,
    DisableWeekendsDirective
  ],
  imports: [
    CommonModule,
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
    MatIconModule,
    MatSelectModule,
    FormsModule,
    MatChipsModule,
    RouterModule.forChild(routes),
    MatToolbarModule

  ],
  providers: [
    DateService, ProjectService, UsersService, Day_offService// Provide any services that belong to this module
  ],
  exports: [
    TimesheetComponent // Export components, directives, or pipes for use in other modules
  ]
})
export class TimesheetModule { }
