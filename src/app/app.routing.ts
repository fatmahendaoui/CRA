import { RouterModule, Routes } from '@angular/router';
import { isAuthenticated } from './guards/is-authenticated.guard';
import { fetchProfile } from './resolvers/profile.resolver';
import { LayoutComponent } from './layout/layout.component';
import { isAdmin } from './guards/is-admin.guard';
import { Authentification } from './guards/authentification.guard';
import { HasDomaineGuard } from './guards/has-domaine.guard';
import { UsersComponent } from './features/users/users.component';
import { NgModule } from '@angular/core';
import { DashbordComponent } from './features/dashbord/dashbord.component';
import { AddcongeComponent } from './features/conges/components/addconge/addconge.component';
import { ListcongeComponent } from './features/conges/components/listconge/listconge.component';
import { DetailscongeComponent } from './features/conges/components/detailsconge/detailsconge.component';



export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashbord',
  },
  {
    path: 'not-authorized',
    loadComponent: () =>
      import('./components/not-authorized.component').then(
        ({ NotAuthorizedComponent }) => NotAuthorizedComponent
      ),
  },
  {
    path: 'create-domaine',
    canActivate: [() => HasDomaineGuard()],
    loadComponent: () =>
      import('./features/sign-in/components/domaine/domaine.component').then(
        ({ DomaineComponent }) => DomaineComponent
      ),
  },
  {
    path: 'sign-in',
    canActivate: [() => Authentification()],
    loadComponent: () =>
      import('./features/sign-in/components/sign-in/sign-in.component').then(
        ({ SignInComponent }) => SignInComponent
      ),
  },

  {
    path: '',
    canActivate: [() => isAuthenticated()],
    component: LayoutComponent,
    resolve: { profile: () => fetchProfile() },
    children: [
      {
        path: 'users',
        canActivate: [() => isAdmin()],

        loadComponent: () =>
          import('./features/users/users.component').then(
            ({ UsersComponent }) => UsersComponent
          ),
      },
      {
        path: 'dashbord',
        canActivate: [() => isAdmin()],
        loadChildren: () =>
          import('./features/dashbord/dashbord.module').then(
            ({ DashbordModule }) => DashbordModule
          ),
      },
      {
        path: 'projects',
        canActivate: [() => isAdmin()],
        loadComponent: () =>
          import('./features/projects/projects.component').then(
            ({ ProjectsComponent }) => ProjectsComponent
          ),
      },
      {
        path: 'toValide',
        canActivate: [() => isAdmin()],
        loadComponent: () =>
          import('./features/listeTovalidate/tovalidate.component').then(
            ({ tovalidateComponent }) => tovalidateComponent
          ),
      },
      {
        path: 'timesheet',
        loadChildren: () => import('./features/timesheet/timesheet.module')
          .then(({ TimesheetModule }) => TimesheetModule)
      }, {
        path: 'profile',
        loadChildren: () => import('./features/profileUser/profile-user.module')
          .then(({ ProfileUserModule }) => ProfileUserModule)
      },

      {
        path: 'conge',
        canActivate: [() => isAdmin()],
        loadChildren: () => import('./features/conges/conge.module')
          .then(({ CongeModule }) => CongeModule)
      },


      {
        path: 'listconge',
        canActivate: [() => isAdmin()],
        component: ListcongeComponent
      },

      {
        path: 'conge/details',
        canActivate: [() => isAdmin()],
        component: DetailscongeComponent
      },

      {
        path: 'conge/details/:id',
        canActivate: [() => isAdmin()],
        component: DetailscongeComponent
      },



      {
        path: 'day_off',
        canActivate: [() => isAdmin()],

        loadComponent: () =>
          import('./features/day_offs/day_offfs.component').then(
            ({ day_offComponent }) => day_offComponent
          ),
      },



    ],
  },

  {
    path: '**',
    pathMatch: 'full',
    component: DashbordComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
