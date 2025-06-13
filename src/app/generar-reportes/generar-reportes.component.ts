import { Component, OnInit } from '@angular/core';
import { Periodo, VerHorariosService } from '../ver-horarios.service';
import { AuthService } from '../auth.service';
import { ReportesService } from '../reportes.service';
import { NotificationService } from '../notificacion.service';

@Component({
  selector: 'app-generar-reportes',
  templateUrl: './generar-reportes.component.html',
  styleUrl: './generar-reportes.component.css'
})
export class GenerarReportesComponent implements OnInit {


   PeriodoSeleccionado: number = 0;
    CarreraSeleccionada: number = 0;
    CursoSeleccionado: number = 0;
    periodos: Periodo[] = [];
    carreras: any[] = [];
    cursos: any[] = [];
    mensajeError: string = '';

    mostrarModalPDF = false;
    pdfUrl: string = '';
    pdfBlob!: Blob;
    pdfSrc: string | null = null;

    constructor(private verHorariosService: VerHorariosService, public usuarioService: AuthService,
      private reporteService: ReportesService, private notificationService: NotificationService
    ) { }

     ngOnInit(): void {
    this.cargarPeriodos();
  }

  cargarPeriodos(): void {
    this.verHorariosService.obtenerPeriodos().subscribe({
      next: (data) => {
        this.periodos = data;
        if (this.periodos.length > 0) {
          this.PeriodoSeleccionado = this.periodos[this.periodos.length - 1].id;
          this.onPeriodoChange(this.PeriodoSeleccionado);
        }
      },
      error: (err) => {
        console.error('Error al cargar periodos:', err);
        this.mensajeError = 'Error al cargar los periodos';
      }
    });
  }

  onPeriodoChange(idPeriodo: number): void {
    if (!idPeriodo) {
      this.carreras = [];
      this.cursos = [];
      this.CarreraSeleccionada = 0;
      this.CursoSeleccionado = 0;
      return;
    }

    this.verHorariosService.obtenerCarrerasPorPeriodo(idPeriodo).subscribe({
      next: (data) => {
        this.carreras = data;
        this.cursos = [];
        this.CarreraSeleccionada = 0;
        this.CursoSeleccionado = 0;
      },
      error: (err) => {
        console.error('Error al cargar carreras:', err);
        this.mensajeError = 'Error al cargar las carreras';
      }
    });
  }

  onCarreraChange(): void {
    if (this.PeriodoSeleccionado && this.CarreraSeleccionada) {
      this.cargarCursos();
    } else {
      this.cursos = [];
      this.CursoSeleccionado = 0;
    }
  }

cargarCursos(): void {
    if (this.PeriodoSeleccionado && this.CarreraSeleccionada) {
      this.verHorariosService
        .obtenerCursosPorPeriodoYCarrera(this.PeriodoSeleccionado, this.CarreraSeleccionada)
        .subscribe({
          next: (data) => {
            this.cursos = data;
            this.CursoSeleccionado = 0;
          },
          error: (err) => {
            console.error('Error al cargar cursos:', err);
            this.mensajeError = 'Error al cargar los cursos';
          }
        });
    }
  }


  generarPDF() {
  if (!this.PeriodoSeleccionado || !this.CarreraSeleccionada || !this.CursoSeleccionado) {
    this.notificationService.showWarningReport(
      'Filtros incompletos',
      'Por favor, selecciona el periodo, la carrera y el curso antes de generar el PDF.',
      'Entendido'
    );
    return;
  }

  const datos = {
    idPeriodo: this.PeriodoSeleccionado,
    idCarrera: this.CarreraSeleccionada,
    idCurso: this.CursoSeleccionado
  };

  this.notificationService.showLoading('Generando PDF...');

  this.reporteService.crearReporte(datos).subscribe({
    next: (blob: Blob) => {
      this.notificationService.hideLoading();

      this.pdfBlob = blob;
      const blobUrl = window.URL.createObjectURL(blob);
      this.pdfUrl = blobUrl;
      this.pdfSrc = blobUrl;
      this.mostrarModalPDF = true;

      this.notificationService.showSuccess(
        'El informe se generó correctamente.'
      );
    },
    error: (error) => {
      this.notificationService.hideLoading();
      console.error('Error al generar el PDF', error);

      let mensajeError = 'Error al generar el PDF';

      if (error.error?.message) {
        mensajeError = error.error.message;
      } else if (error.message) {
        mensajeError = error.message;
      }

      this.notificationService.showErrorReport(
        'Error',
        mensajeError,
        'Cerrar'
      );
    }
  });
}


cerrarModal() {
  this.mostrarModalPDF = false;
  this.pdfUrl = '';
}

descargarPDF() {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(this.pdfBlob);
  link.download = 'horario.pdf';
  link.click();
}




}
