import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AulasService } from '../aulas.service';

@Component({
  selector: 'app-editar-aula',
  templateUrl: './editar-aula.component.html',
  styleUrl: './editar-aula.component.css'
})
export class EditarAulaComponent implements OnInit {
  aula: any = {};
  tipos: string[] = ['Normal','Laboratorio','Taller de moda','Taller de electricidad'];
  id: number = 0;
  constructor(
    private route: ActivatedRoute,
    private aulaService: AulasService,
    public router: Router
  ) { }
  ngOnInit(): void {
    this.id = +this.route.snapshot.paramMap.get('id')!;
    this.aulaService.obtenerAulasId(this.id).subscribe({
      next: (data) => {
        this.aula = {
          nombre: data.NOMBRE_AULA,
          tipo: data.TIPO_AULA
        };
      },
      error: (err) => console.error('Error al obtener aula:', err)
    });
  }



  guardarCambios(): void {
    this.aulaService.actualizarAulas(this.id, this.aula).subscribe({
      next: () => this.router.navigate(['/inicio/gestionar-aulas']),
      error: (err) => console.error('Error al guardar cambios:', err)
    });
  }

}
