import { Request, Response } from "express";
import { MessageService } from "../services/message-service";
import { mapErrorToHttp } from "./error-mapper";

export class MessageController {
constructor(private readonly service: MessageService) {}

handle = async (req: Request, res: Response) => {
try {
const { idSesion } = req.params;

  const input = {
    tipo: req.body.tipo,
    valor: req.body.valor ?? null,
    campos: req.body.campos ?? null
  };

  const result = await this.service.handleMessage(idSesion, input);
  res.json(result);
} catch (err) {
  const { status, body } = mapErrorToHttp(err);
  res.status(status).json(body);
}


};
}

