import { NgModule } from '@angular/core';
import { AsyncPipe, CommonModule, JsonPipe, NgFor, NgIf } from '@angular/common';
import { AddcongeComponent } from './components/addconge/addconge.component';
import { HttpClientModule } from '@angular/common/http';
import { TranslocoModule } from '@ngneat/transloco';
import { LoaderComponent } from 'src/app/components/loader.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { RouterModule, Routes } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms'; 
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';

const routes: Routes = [
  {
    path: 'add',
    component: AddcongeComponent
  }
];


@NgModule({
  declarations: [AddcongeComponent ],
  imports: [ NgIf,
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
    RouterModule.forChild(routes),
    MatSelectModule,
    MatOptionModule,
    HttpClientModule,
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    FormsModule,
    MatSelectModule,
    MatIconModule
  ]
})
export class CongeModule { }
