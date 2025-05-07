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
    EditarAulaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
