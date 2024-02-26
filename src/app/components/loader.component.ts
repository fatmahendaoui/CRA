import { Component } from "@angular/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";


@Component({
  standalone: true,
  selector: 'app-loader',
  template: `
  <div class="container">
    <!-- [strokeWidth]="4" -->
    <mat-spinner diameter="80"></mat-spinner>
    <ng-content></ng-content>
  </div>
    
  `,
  styles: [`
    :host {
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: 32px;
    }
    .container{
      display:flex;
      justify-content:center;
      align-items:center;
      flex-direction: column;
      width:100%;
      height: calc(100vh - 13rem) !important;
     }
  `],
  imports: [
    MatProgressSpinnerModule,
  ],
})
export class LoaderComponent {
}