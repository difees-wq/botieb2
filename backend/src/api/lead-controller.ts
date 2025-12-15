import { Request, Response } from "express";
import { LeadService } from "../services/lead-service";
import { SessionService } from "../services/session-service";
import { mapErrorToHttp } from "./error-mapper";

export class LeadController {
  constructor(
    private readonly leadService: LeadService,
    private readonly sessionService: SessionService
  ) {}

  // Method name expected by router: process
  process = async (req: Request, res: Response) => {
    try {
      const { idSesion } = req.params;
      const session = await this.sessionService.getSession(idSesion);

      const result = await (this.leadService as any).processLead(session, {
        nombre: req.body.nombre,
        apellidos: req.body.apellidos,
        email: req.body.email,
        telefono: req.body.telefono,
        canalPreferido: req.body.canalPreferido,
        aceptoGdpr: req.body.aceptoGdpr,
        citaFecha: req.body.citaFecha,
        citaHora: req.body.citaHora
      });

      res.json(result);
    } catch (err) {
      const { status, body } = mapErrorToHttp(err);
      res.status(status).json(body);
    }
  };
}


