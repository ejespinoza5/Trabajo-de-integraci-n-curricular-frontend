import { TestBed } from '@angular/core/testing';

import { VerHorariosDocentesService } from './ver-horarios-docentes.service';

describe('VerHorariosDocentesService', () => {
  let service: VerHorariosDocentesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VerHorariosDocentesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
