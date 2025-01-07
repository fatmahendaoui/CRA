import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { HrPoliciesComponent } from './hr-policies.component';
import { MatIconModule } from '@angular/material/icon';



@NgModule({
  declarations: [HrPoliciesComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
    ]
})
export class HrPoliciesModule { }
