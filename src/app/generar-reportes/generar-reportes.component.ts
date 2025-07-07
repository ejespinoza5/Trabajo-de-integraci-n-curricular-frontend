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

    observacion: any;

    mostrarModalPDF = false;
    pdfUrl: string = '';
    pdfBlob!: Blob;
    pdfSrc: string | null = null;

    mostrarModalConfiguracion: boolean = false;
     modoEdicion: boolean = false;
  guardandoCambios: boolean = false;
  mensajeExito: string = '';

   observacionEditada: any = {
    preprof: '',
    comunitario: '',
    ingles: ''
  };

  //Autoridades
  autoridades: any[] = [];
autoridadesEditadas: any = {
  rector: '',
  vicerrectora: ''
};
autoridadesOriginales: any = {};
modoEdicionAutoridades: boolean = false;
guardandoCambiosAutoridades: boolean = false;
mensajeExitoAutoridades: string = '';
mensajeErrorAutoridades: string = '';

  observacionOriginal: any = {};
    constructor(private verHorariosService: VerHorariosService, public usuarioService: AuthService,
      private reporteService: ReportesService, private notificationService: NotificationService,
      private authService: AuthService
    ) { }

     ngOnInit(): void {
    this.cargarPeriodos();
    this.cargarObservacion();
    this.cargarAutoridades();
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
  // Verificar si ya hay un PDF generado previamente
  if (this.pdfSrc) {
    const width = 900;
    const height = 700;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;

    window.open(
      this.pdfSrc,
      'pdfViewer',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no`
    );
    return;
  }

  // Validar que los filtros estén completos
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

      // Crear la URL del blob
      this.pdfBlob = blob;
      const blobUrl = window.URL.createObjectURL(blob);
      this.pdfUrl = blobUrl;
      this.pdfSrc = blobUrl;

      // Configurar ventana flotante centrada
      const width = 900;
      const height = 700;
      const left = (screen.width - width) / 2;
      const top = (screen.height - height) / 2;

      // Abrir el PDF en una ventana flotante centrada
      const ventanaFlotante = window.open(
        blobUrl,
        'pdfViewer',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no`
      );

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
generarExcel() {
  if (!this.PeriodoSeleccionado || !this.CarreraSeleccionada || !this.CursoSeleccionado) {
    this.notificationService.showWarningReport(
      'Filtros incompletos',
      'Por favor, selecciona el periodo, la carrera y el curso antes de generar el Excel.',
      'Entendido'
    );
    return;
  }

  const datos = {
    idPeriodo: this.PeriodoSeleccionado,
    idCarrera: this.CarreraSeleccionada,
    idCurso: this.CursoSeleccionado
  };

  this.notificationService.showLoading('Generando Excel...');

  this.reporteService.crearReporteExcel(datos).subscribe({
    next: (blob: Blob) => {
      this.notificationService.hideLoading();

      // Crear URL para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-${this.PeriodoSeleccionado}-${this.CarreraSeleccionada}-${this.CursoSeleccionado}.xlsx`;
      link.click();

      // Limpiar la URL creada
      window.URL.revokeObjectURL(url);

      this.notificationService.showSuccess(
        'El archivo Excel se descargó correctamente.'
      );
    },
    error: (error) => {
      this.notificationService.hideLoading();
      console.error('Error al generar el Excel', error);

      let mensajeError = 'Error al generar el Excel';

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


cargarObservacion(): void {
  const idCarrera = this.authService.obtenerIdCarrera();
  if (idCarrera === null) {
    this.mensajeError = 'No se pudo obtener la carrera del token';
    return;
  }
  this.reporteService.obtenerObservacionesPorCarrera(idCarrera).subscribe({
    next: (data) => {
      this.observacion = data;
    },
    error: (err) => {
      console.error('Error al cargar observación:', err);
      this.mensajeError = 'No se pudo cargar la observación';
    }
  });
}

abrirModalConfiguracion(): void {
    this.mostrarModalConfiguracion = true;
    this.inicializarDatosEdicion();
    this.limpiarMensajes();
  }

cerrarModalConfiguracion(): void {
    this.mostrarModalConfiguracion = false;
    this.modoEdicion = false;
    this.limpiarMensajes();
  }

  inicializarDatosEdicion(): void {
    // Mapear los datos originales al formato de edición
    this.observacionEditada = {
      preprof: this.observacion.PRACTICAS_PREPROFESIONALES_HORAS || '',
      comunitario: this.observacion.SERVICIO_COMUNITARIO_HORAS || '',
      ingles: this.observacion.INGLES_HORAS || ''
    };

    // Crear respaldo
    this.observacionOriginal = { ...this.observacionEditada };
  }

  habilitarEdicion(): void {
    this.modoEdicion = true;
    this.limpiarMensajes();
  }

  cancelarEdicion(): void {
    // Restaurar valores originales
    this.observacionEditada = { ...this.observacionOriginal };
    this.modoEdicion = false;
    this.limpiarMensajes();
  }

  guardarCambios(): void {
  this.notificationService.showLoading('Guardando cambios...');
  this.limpiarMensajes();

  // Llamar al servicio con el ID de observación
  const idObservacion = this.observacion.id; // Asume que tienes el ID

  this.reporteService.editarObservaciones(idObservacion, this.observacionEditada)
    .subscribe({
      next: (response) => {
        this.notificationService.hideLoading();
        this.modoEdicion = false;

        // Si tu servicio de actualización devuelve un mensaje de éxito
        this.notificationService.showSuccess(
          'Cambios Guardados Correctamente.',
        );

        // Actualizar los datos originales
        this.observacion.PRACTICAS_PREPROFESIONALES_HORAS = this.observacionEditada.preprof;
        this.observacion.SERVICIO_COMUNITARIO_HORAS = this.observacionEditada.comunitario;
        this.observacion.INGLES_HORAS = this.observacionEditada.ingles;
        this.observacionOriginal = { ...this.observacionEditada };
      },
      error: (error) => {
        this.notificationService.hideLoading();
        console.error('Error al guardar observaciones:', error);

        let mensajeError = 'Error al guardar los cambios';

        // Manejo específico de errores
        if (error.status === 403 && error.error && error.error.message) {
          // Error 403: Forbidden
          mensajeError = error.error.message;
        } else if (error.status === 404 && error.error && error.error.message) {
          // Error 404: Not Found
          mensajeError = error.error.message;
        } else if (error.error && error.error.message) {
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

  esComunitarioConfigurado(): boolean {
  const horas = this.observacionEditada.comunitario;
  return horas !== '' && horas !== '0' && parseInt(horas) > 0;
}
esPracticasConfigurado(): boolean {
  const horas = this.observacionEditada.preprof;
  return horas !== '' && horas !== '0' && parseInt(horas) > 0;
}
obtenerTextoEstado(configurado: boolean): string {
  return configurado ? 'Configurado' : 'No configurado';
}

obtenerClasesEstado(configurado: boolean): string {
  return configurado
    ? 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'
    : 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800';
}

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  // Métodos para manejar las autoridades
  // Agregar estos métodos a la clase GenerarReportesComponent

cargarAutoridades(): void {
  this.reporteService.obtenerAutoridades().subscribe({
    next: (data) => {
      this.autoridades = data;
      this.inicializarDatosAutoridades();
    },
    error: (err) => {
      console.error('Error al cargar autoridades:', err);
      this.mensajeErrorAutoridades = 'No se pudieron cargar las autoridades';
    }
  });
}

inicializarDatosAutoridades(): void {
  // Mapear los datos de autoridades al formato de edición
  const rector = this.autoridades.find(auth => auth.ID_AUTORIDAD === 1);
  const vicerrectora = this.autoridades.find(auth => auth.ID_AUTORIDAD === 2);

  this.autoridadesEditadas = {
    rector: rector?.NOMBRE_AUTORIDAD || '',
    vicerrectora: vicerrectora?.NOMBRE_AUTORIDAD || ''
  };

  // Crear respaldo
  this.autoridadesOriginales = { ...this.autoridadesEditadas };
}

habilitarEdicionAutoridades(): void {
  this.modoEdicionAutoridades = true;
  this.limpiarMensajesAutoridades();
}

cancelarEdicionAutoridades(): void {
  // Restaurar valores originales
  this.autoridadesEditadas = { ...this.autoridadesOriginales };
  this.modoEdicionAutoridades = false;
  this.limpiarMensajesAutoridades();
}

guardarCambiosAutoridades(): void {
  this.notificationService.showLoading('Actualizando autoridades...');
  this.limpiarMensajesAutoridades();

  this.reporteService.actualizarAutoridad(this.autoridadesEditadas)
    .subscribe({
      next: (response) => {
        this.notificationService.hideLoading();
        this.modoEdicionAutoridades = false;

        // Si tu servicio de actualización devuelve un mensaje de éxito
        this.notificationService.showSuccess(
          'Datos de autoridades actualizados correctamente.',
        );

        // Actualizar los datos originales
        this.autoridadesOriginales = { ...this.autoridadesEditadas };

        // Actualizar el array de autoridades
        const rectorIndex = this.autoridades.findIndex(auth => auth.ID_AUTORIDAD === 1);
        const vicerrectoraIndex = this.autoridades.findIndex(auth => auth.ID_AUTORIDAD === 2);

        if (rectorIndex !== -1) {
          this.autoridades[rectorIndex].NOMBRE_AUTORIDAD = this.autoridadesEditadas.rector;
        }
        if (vicerrectoraIndex !== -1) {
          this.autoridades[vicerrectoraIndex].NOMBRE_AUTORIDAD = this.autoridadesEditadas.vicerrectora;
        }
      },
      error: (error) => {
        this.notificationService.hideLoading();
        console.error('Error al guardar autoridades:', error);

        let mensajeError = 'Error al guardar las autoridades';

        // Manejo específico de errores
        if (error.status === 403 && error.error && error.error.message) {
          // Error 403: Forbidden
          mensajeError = error.error.message;
        } else if (error.status === 404 && error.error && error.error.message) {
          // Error 404: Not Found
          mensajeError = error.error.message;
        } else if (error.error && error.error.message) {
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
limpiarMensajesAutoridades(): void {
  this.mensajeExitoAutoridades = '';
  this.mensajeErrorAutoridades = '';
}


}
