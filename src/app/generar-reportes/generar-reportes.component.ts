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
        this.mensajeError = 'Error al cargar las carreras';
      }
    });
  }

  onCarreraChange(): void {
    if (this.PeriodoSeleccionado && this.CarreraSeleccionada) {
      this.cargarCursos();
      // ✅ NUEVO: Cargar observaciones de la carrera seleccionada
      this.cargarObservacionPorCarrera(this.CarreraSeleccionada);
    } else {
      this.cursos = [];
      this.CursoSeleccionado = 0;
    }
  }

  // ✅ NUEVO: Método para cargar observaciones por carrera específica
  cargarObservacionPorCarrera(idCarrera: number): void {

    this.reporteService.obtenerObservacionesPorCarrera(idCarrera).subscribe({
      next: (data) => {
        // ✅ CORRECCIÓN: Manejar el caso donde data puede ser un array o un objeto
        const observacionData = Array.isArray(data) ? data[0] : data;
        this.observacion = observacionData;

        // ✅ NUEVO: Inicializar datos de edición si no están inicializados
        if (!this.observacionEditada.preprof && !this.observacionEditada.comunitario && !this.observacionEditada.ingles) {
          this.observacionEditada = {
            preprof: observacionData?.PRACTICAS_PREPROFESIONALES_HORAS || '',
            comunitario: observacionData?.SERVICIO_COMUNITARIO_HORAS || '',
            ingles: observacionData?.INGLES_HORAS || ''
          };
          this.observacionOriginal = { ...this.observacionEditada };
        }
      },
      error: (err) => {

        // ✅ NUEVO: Crear observación por defecto si falla la carga
        this.observacion = {
          PRACTICAS_PREPROFESIONALES_HORAS: '',
          SERVICIO_COMUNITARIO_HORAS: '',
          INGLES_HORAS: ''
        };
      }
    });
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
            this.mensajeError = 'Error al cargar los cursos';
          }
        });
    }
  }


  generarPDF() {
    // Limpia el estado anterior
    this.mensajeExito = '';
    this.pdfSrc = '';
    this.pdfUrl = '';
    this.pdfBlob = undefined as any;

    // Validar que los filtros estén completos
    if (!this.PeriodoSeleccionado || !this.CarreraSeleccionada || !this.CursoSeleccionado) {
      this.notificationService.showWarningReport(
        'Filtros incompletos',
        'Por favor, selecciona el periodo, la carrera y el curso antes de generar el PDF.',
        'Entendido'
      );
      return;
    }

    // ✅ NUEVO: Verificar que los datos de configuración estén cargados (solo advertencias, no bloquea)
    this.verificarDatosConfiguracion();

    // ✅ CORRECCIÓN: Incluir datos de configuración en el PDF
    const datos = {
      idPeriodo: this.PeriodoSeleccionado,
      idCarrera: this.CarreraSeleccionada,
      idCurso: this.CursoSeleccionado,
      // ✅ NUEVO: Incluir observaciones configuradas
      observaciones: {
        PRACTICAS_PREPROFESIONALES_HORAS: this.observacion?.PRACTICAS_PREPROFESIONALES_HORAS || '',
        SERVICIO_COMUNITARIO_HORAS: this.observacion?.SERVICIO_COMUNITARIO_HORAS || '',
        INGLES_HORAS: this.observacion?.INGLES_HORAS || ''
      },
      // ✅ NUEVO: Incluir autoridades configuradas
      autoridades: {
        rector: this.autoridades.find(auth => auth.ID_AUTORIDAD === 1)?.NOMBRE_AUTORIDAD || '',
        vicerrectora: this.autoridades.find(auth => auth.ID_AUTORIDAD === 2)?.NOMBRE_AUTORIDAD || ''
      }
    };



    this.notificationService.showLoading('Generando PDF...');

    this.reporteService.crearReporte(datos).subscribe({
      next: (blob: Blob) => {
        this.notificationService.hideLoading();

        // Guardar el blob para poder descargarlo después si es necesario
        this.pdfBlob = blob;

        // Crear URL para abrir en nueva pestaña
        const url = window.URL.createObjectURL(blob);

        // Abrir el PDF en una nueva pestaña
        const nuevaPestana = window.open(url, '_blank');

        if (nuevaPestana) {
          this.notificationService.showSuccess(
            'El PDF se abrió en una nueva pestaña para previsualización.'
          );
        } else {
          // Si el navegador bloqueó la ventana emergente, mostrar mensaje
          this.notificationService.showWarningReport(
            'Ventana bloqueada',
            'El navegador bloqueó la ventana emergente. El PDF se descargará automáticamente.',
            'Entendido'
          );

          // Descargar como fallback
          const link = document.createElement('a');
          link.href = url;
          link.download = `reporte-${this.PeriodoSeleccionado}-${this.CarreraSeleccionada}-${this.CursoSeleccionado}.pdf`;
          link.click();
        }

        // Limpiar la URL creada después de un tiempo
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 5000);
      },
      error: (error) => {
        this.notificationService.hideLoading();

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
      // ✅ CORRECCIÓN: Manejar el caso donde data puede ser un array o un objeto
      const observacionData = Array.isArray(data) ? data[0] : data;
      this.observacion = observacionData;

      // ✅ NUEVO: Inicializar datos de edición si no están inicializados
      if (!this.observacionEditada.preprof && !this.observacionEditada.comunitario && !this.observacionEditada.ingles) {
        this.observacionEditada = {
          preprof: observacionData?.PRACTICAS_PREPROFESIONALES_HORAS || '',
          comunitario: observacionData?.SERVICIO_COMUNITARIO_HORAS || '',
          ingles: observacionData?.INGLES_HORAS || ''
        };
        this.observacionOriginal = { ...this.observacionEditada };
      }
    },
    error: (err) => {
      this.mensajeError = 'No se pudo cargar la observación';

      // ✅ NUEVO: Crear observación por defecto si falla la carga
      this.observacion = {
        PRACTICAS_PREPROFESIONALES_HORAS: '',
        SERVICIO_COMUNITARIO_HORAS: '',
        INGLES_HORAS: ''
      };
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
      this.mensajeErrorAutoridades = 'No se pudieron cargar las autoridades';

      // ✅ NUEVO: Crear autoridades por defecto si falla la carga
      this.autoridades = [
        { ID_AUTORIDAD: 1, NOMBRE_AUTORIDAD: '' },
        { ID_AUTORIDAD: 2, NOMBRE_AUTORIDAD: '' }
      ];
      this.inicializarDatosAutoridades();
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

  // ✅ NUEVO: Método para verificar que los datos de configuración estén cargados
  private verificarDatosConfiguracion(): boolean {
    let problemas = [];

    // Verificar que las observaciones estén cargadas
    if (!this.observacion) {

      problemas.push('observaciones');
    }

    // Verificar que las autoridades estén cargadas
    if (!this.autoridades || this.autoridades.length === 0) {

      problemas.push('autoridades');
    }

    // Verificar que al menos una autoridad tenga nombre
    const rector = this.autoridades?.find(auth => auth.ID_AUTORIDAD === 1);
    const vicerrectora = this.autoridades?.find(auth => auth.ID_AUTORIDAD === 2);

    if ((!rector?.NOMBRE_AUTORIDAD && !vicerrectora?.NOMBRE_AUTORIDAD) && this.autoridades?.length > 0) {
      problemas.push('nombres de autoridades');
    }

    // ✅ CORRECCIÓN: Ser menos estricto - permitir generar PDF con advertencias
    if (problemas.length > 0) {

      // Mostrar advertencia pero permitir continuar
      this.notificationService.showWarningReport(
        'Configuración incompleta',
        `Algunos datos de configuración no están completos: ${problemas.join(', ')}. El PDF se generará con la información disponible.`,
        'Continuar'
      );

      // ✅ NUEVO: Crear datos por defecto si no existen
      if (!this.observacion) {
        this.observacion = {
          PRACTICAS_PREPROFESIONALES_HORAS: '',
          SERVICIO_COMUNITARIO_HORAS: '',
          INGLES_HORAS: ''
        };
      }

      if (!this.autoridades || this.autoridades.length === 0) {
        this.autoridades = [
          { ID_AUTORIDAD: 1, NOMBRE_AUTORIDAD: '' },
          { ID_AUTORIDAD: 2, NOMBRE_AUTORIDAD: '' }
        ];
      }
    }


    return true;
  }


}

