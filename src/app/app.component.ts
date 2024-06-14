import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HasDomaineGuard } from './guards/has-domaine.guard';
import { ProjectService } from './features/projects/services/projects.service';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Day_offService } from './features/day_offs/services/day_off.service';

@Component({
  standalone: true,
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
  imports: [RouterOutlet,
    MatDatepickerModule, MatNativeDateModule,
    
  MatTooltipModule], 
   providers: [
    ProjectService,Day_offService
  ],

})
export class AppComponent { }
