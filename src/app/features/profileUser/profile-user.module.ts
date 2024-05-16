import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileUserComponent } from './components/profile-user/profile-user.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: ProfileUserComponent
  }
];

@NgModule({
  declarations: [
    ProfileUserComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),


  ]
})
export class ProfileUserModule { }
