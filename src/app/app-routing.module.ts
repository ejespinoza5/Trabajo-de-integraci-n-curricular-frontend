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
import { CoordinadoresComponent } from './coordinadores/coordinadores.component';
import { HorarioEstudianteComponent } from './horario-estudiante/horario-estudiante.component';
import { HorarioDocenteComponent } from './horario-docente/horario-docente.component';
import { InicioComponent } from './inicio/inicio.component';


const routes: Routes = [
  { path: '', component: LoginComponent },
 { path: 'login', component: LoginComponent },
 {
  path: 'inicio',component: PrincipalComponent,canActivate: [AuthGuard], data: { roles: ['COORDINADOR','SUPERADMINISTRADOR','ESTUDIANTE','DOCENTE','ADMINISTRADOR'] } ,
  children: [
    { path: 'bienvenida', component: InicioComponent,canActivate: [AuthGuard] },
    { path: 'gestionar-aulas', component: GestionarAulasComponent, canActivate: [AuthGuard], data: { roles: ['SUPERADMINISTRADOR', 'ADMINISTRADOR'] } },
    { path: 'generar-horario', component: GenerarHorariosComponent,canActivate: [AuthGuard], data: { roles: ['COORDINADOR','SUPERADMINISTRADOR', 'ADMINISTRADOR'] } },
    { path: 'generar-reporte', component: GenerarReportesComponent,canActivate: [AuthGuard], data: { roles: ['SUPERADMINISTRADOR', 'COORDINADOR', 'ADMINISTRADOR'] } },
    { path: 'ver-horario', component: VerHorariosComponent,canActivate: [AuthGuard],data: { roles: ['SUPERADMINISTRADOR','COORDINADOR', 'ADMINISTRADOR'] } },
    { path: 'ver-horario-docente', component: VerHorariosDocentesComponent,canActivate: [AuthGuard],data: { roles: ['SUPERADMINISTRADOR','COORDINADOR', 'ADMINISTRADOR'] } },
    { path: 'editar-aula/:id', component: EditarAulaComponent, canActivate: [AuthGuard],data: { roles: ['SUPERADMINISTRADOR', 'ADMINISTRADOR'] } },
    { path: 'coordinadores', component: CoordinadoresComponent, canActivate: [AuthGuard],data: { roles: ['SUPERADMINISTRADOR', 'ADMINISTRADOR'] }},
    { path: 'mi-horario', component: HorarioEstudianteComponent, canActivate: [AuthGuard], data: { roles: ['ESTUDIANTE'] } },
    { path: 'docente-horario', component: HorarioDocenteComponent, canActivate: [AuthGuard], data: { roles: ['DOCENTE'] } },
    // { path: '', redirectTo: 'gestionar-aulas', pathMatch: 'full' }
  ]
},
{ path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
