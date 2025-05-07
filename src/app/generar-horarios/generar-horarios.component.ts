import { Component, OnInit } from '@angular/core';
import { HorariosService } from '../horarios.service';
import { AulasService } from '../aulas.service';

@Component({
  selector: 'app-generar-horarios',
  templateUrl: './generar-horarios.component.html',
  styleUrl: './generar-horarios.component.css'
})
export class GenerarHorariosComponent implements OnInit {

  periodos: any[] = [];
  docentes: any[] = [];
  asignaturas: any[] = [];
  aulas: any[] = [];
  dias: any[] = [];
  carreras: any[] = [];
  niveles: any[] = [];

  PeriodoSeleccionado: number = 0;
  DocenteSeleccionado: number = 0;
  AulaSeleccionada: number = 0;
  DiaSeleccionado: number = 0;
  CarreraSeleccionada: number = 0;
  NivelSeleccionado: number = 0;
  AsiganturaSeleccionada: number = 0;

  horaInicio: string = '';
  horaFin: string = '';


  constructor(private horariosService: HorariosService,private aulasService: AulasService) {}

  ngOnInit(): void {
    this.horariosService.obtenerPeriodos().subscribe(data => this.periodos = data);
    this.aulasService.obtenerAulas().subscribe(data => this.periodos = data);
    this.horariosService.obtenerDias().subscribe(data => this.dias = data);
  }

  onPeriodoChange(idPeriodo: number) {
    this.PeriodoSeleccionado = idPeriodo;
    this.DocenteSeleccionado = 0;
    this.asignaturas = [];
    this.docentes = [];

    this.horariosService.obtenerDocentes(idPeriodo).subscribe(data => {
      this.docentes = data;
    });
  }

  onDocenteChange(idDocente: number) {
    this.DocenteSeleccionado = idDocente;
    this.asignaturas = [];

    this.horariosService.obtenerAsignaturas(this.PeriodoSeleccionado, idDocente)
        .subscribe(data => this.asignaturas = data);
  }

  onAulaChange() {
    this.aulasService.obtenerAulas().subscribe(data => {
      this.aulas = data;
    });
  }

  onDiaChange() {
    this.horariosService.obtenerDias().subscribe(data => {
      this.aulas = data;
    });
  }

  onAsignaturaChange(idAsignatura: number) {
    this.AsiganturaSeleccionada = idAsignatura;
    this.carreras = [];
    this.niveles = [];
    this.CarreraSeleccionada = 0;
    this.NivelSeleccionado =0;
    this.horariosService.obtenerCarreras(this.AsiganturaSeleccionada)
    .subscribe(data => this.carreras = data);
    this.horariosService.obtenerNiveles(this.AsiganturaSeleccionada)
    .subscribe(data => this.niveles = data);
  }


}
