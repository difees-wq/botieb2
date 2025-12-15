
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { SessionService } from "../../src/services/session-service";
import { UrlContextService } from "../../src/services/url-context-service";
import { TipoEstudio } from "../../src/domain/enums";
import { NotFoundError } from "../../src/domain/errors";

const mockRepo = {
  create: jest.fn() as jest.Mock,
  findById: jest.fn() as jest.Mock,
  updateFlowState: jest.fn() as jest.Mock
};

const mockUrlService = new UrlContextService([
  {
    slugUrl: "master/finanzas",
    nombre: "Máster en Finanzas",
    tipoEstudio: TipoEstudio.MASTER,
    urlFicha: "https://www.ieb.es/programas/master/finanzas"
  }
]);

const service = new SessionService(
// @ts-expect-error mock parcial
mockRepo,
mockUrlService
);

describe("SessionService", () => {
beforeEach(() => {
jest.clearAllMocks();
});

it("crea sesión con tipoEstudio detectado", async () => {
const result = await service.createSession({
  urlOrigen: "https://www.ieb.es/programas/master/finanzas",
  visitanteHash: "hash-test"
});

expect(result.idSesion).toBeDefined();
expect(result.tipoEstudio).toBe(TipoEstudio.MASTER);
expect(mockRepo.create).toHaveBeenCalled();


});

it("lanza NotFoundError si no encuentra sesión", async () => {
(mockRepo.findById as any).mockResolvedValueOnce(null);

await expect(service.getSession("no-existe")).rejects.toBeInstanceOf(
  NotFoundError
);


});
});

