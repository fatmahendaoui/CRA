import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RemoteComponent } from '../remote.component';
import { RemoteService } from '../services/remoteservice.service';
import {MatIconModule} from '@angular/material/icon';
import { Day_offService } from '../../day_offs/services/day_off.service';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    RemoteComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule
 
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
