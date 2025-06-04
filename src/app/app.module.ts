import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { PrincipalComponent } from './principal/principal.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { GenerarHorariosComponent } from './generar-horarios/generar-horarios.component';
import { GestionarAulasComponent } from './gestionar-aulas/gestionar-aulas.component';
import { GenerarReportesComponent } from './generar-reportes/generar-reportes.component';
import { VerHorariosComponent } from './ver-horarios/ver-horarios.component';
import { VerHorariosDocentesComponent } from './ver-horarios-docentes/ver-horarios-docentes.component';
import { EditarAulaComponent } from './editar-aula/editar-aula.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CoordinadoresComponent } from './coordinadores/coordinadores.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { HorarioEstudianteComponent } from './horario-estudiante/horario-estudiante.component';
import { HorarioDocenteComponent } from './horario-docente/horario-docente.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    PrincipalComponent,
    GenerarHorariosComponent,
    GestionarAulasComponent,
    GenerarReportesComponent,
    VerHorariosComponent,
    VerHorariosDocentesComponent,
    EditarAulaComponent,
    CoordinadoresComponent,
    HorarioEstudianteComponent,
    HorarioDocenteComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    FullCalendarModule,
    NgSelectModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
