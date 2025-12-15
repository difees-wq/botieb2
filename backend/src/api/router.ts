
import { Router } from "express";
import { Controllers } from "../config/dependency-container";

export function buildRouter(controllers: Controllers): Router {
const r = Router();

r.post("/session", (req, res) => controllers.session.create(req, res));
r.get("/session/:idSesion", (req, res) => controllers.session.get(req, res));

r.post("/message/:idSesion", (req, res) =>
controllers.message.handle(req, res)
);

r.post("/lead/:idSesion", (req, res) =>
controllers.lead.process(req, res)
);

r.get("/flows/:tipo", (req, res) =>
controllers.flows.getFlow(req, res)
);

r.get("/health", (req, res) => controllers.health.status(req, res));

return r;
}
