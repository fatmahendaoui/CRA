import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RemoteComponent } from '../remote.component';
import { RemoteService } from '../services/remoteservice.service';
import { MatIconModule } from '@angular/material/icon';
import { Day_offService } from '../../day_offs/services/day_off.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@ngneat/transloco';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FullCalendarModule } from '@fullcalendar/angular';


@NgModule({
  declarations: [
    RemoteComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    TranslocoModule,
    MatCardModule,
    MatToolbarModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    FullCalendarModule
  ],
  providers: [
    RemoteService,
    Day_offService
  ],
  exports: [
    RemoteComponent
  ]
})
export class RemoteModule { }
