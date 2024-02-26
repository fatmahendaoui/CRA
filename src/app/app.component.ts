import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HasDomaineGuard } from './guards/has-domaine.guard';
import { ProjectService } from './features/projects/services/projects.service';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  standalone: true,
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
  imports: [RouterOutlet,
    MatDatepickerModule, MatNativeDateModule], 
   providers: [
    ProjectService
  ],

})
export class AppComponent { }
