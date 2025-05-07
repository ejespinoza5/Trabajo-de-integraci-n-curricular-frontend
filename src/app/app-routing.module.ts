import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { PrincipalComponent } from './principal/principal.component';
import { GestionarAulasComponent } from './gestionar-aulas/gestionar-aulas.component';
import { GenerarHorariosComponent } from './generar-horarios/generar-horarios.component';
import { GenerarReportesComponent } from './generar-reportes/generar-reportes.component';
import { VerHorariosComponent } from './ver-horarios/ver-horarios.component';
import { VerHorariosDocentesComponent } from './ver-horarios-docentes/ver-horarios-docentes.component';
import { AuthGuard } from './auth.guard';
import { EditarAulaComponent } from './editar-aula/editar-aula.component';


const routes: Routes = [
  { path: '', component: LoginComponent },
 { path: 'login', component: LoginComponent },
 {
  path: 'inicio',component: PrincipalComponent,canActivate: [AuthGuard],
  children: [
    { path: 'gestionar-aulas', component: GestionarAulasComponent, canActivate: [AuthGuard]},
    { path: 'generar-horario', component: GenerarHorariosComponent,canActivate: [AuthGuard] },
    { path: 'generar-reporte', component: GenerarReportesComponent,canActivate: [AuthGuard] },
    { path: 'ver-horario', component: VerHorariosComponent,canActivate: [AuthGuard] },
    { path: 'ver-horario-docente', component: VerHorariosDocentesComponent,canActivate: [AuthGuard] },
    { path: 'editar-aula/:id', component: EditarAulaComponent, canActivate: [AuthGuard] },
    { path: '', redirectTo: 'gestionar-aulas', pathMatch: 'full' }
  ]
},
{ path: '**', redirectTo: 'login' } // en caso de rutas no existentes
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
