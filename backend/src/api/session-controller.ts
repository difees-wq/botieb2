import { Request, Response } from "express";
import { SessionService } from "../services/session-service";
import { ValidationError, NotFoundError } from "../domain/errors";

export class SessionController {
  constructor(private readonly service: SessionService) {}

  async create(req: Request, res: Response) {
    console.log("[SessionController.create] BODY RECIBIDO:", req.body);

    try {
      const { urlOrigen, visitanteHash } = req.body;

      console.log("[SessionController.create] urlOrigen:", urlOrigen);
      console.log("[SessionController.create] visitanteHash:", visitanteHash);

      if (!urlOrigen) {
        console.log("[SessionController.create] ERROR: falta urlOrigen");
        throw new ValidationError("URL_ORIGEN_REQUERIDO", "Falta urlOrigen");
      }

      const result = await this.service.createSession({
        urlOrigen,
        visitanteHash: visitanteHash ?? ""
      });

      console.log("[SessionController.create] SESION CREADA:", result);

      return res.json(result);
    } catch (err: any) {
      console.error("[SessionController.create] EXCEPCION:", err);

      if (err instanceof ValidationError) {
        return res.status(400).json({ error: err.code, message: err.message });
      }
      return res.status(500).json({ error: "ERROR_INTERNO" });
    }
  }

  async get(req: Request, res: Response) {
    console.log("[SessionController.get] PARAMS:", req.params);

    try {
      const idSesion = req.params.idSesion;

      console.log("[SessionController.get] idSesion:", idSesion);

      const sess = await this.service.getSession(idSesion);

      console.log("[SessionController.get] SESION ENCONTRADA:", sess);

      return res.json(sess);
    } catch (err: any) {
      console.error("[SessionController.get] EXCEPCION:", err);

      if (err instanceof NotFoundError) {
        return res.status(404).json({ error: err.code, message: err.message });
      }
      return res.status(500).json({ error: "ERROR_INTERNO" });
    }
  }
}

