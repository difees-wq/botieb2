
import { UrlContextService } from "../../src/services/url-context-service";
import { TipoEstudio } from "../../src/domain/enums";

const catalog = [
{
slugUrl: "master/finanzas",
nombre: "Máster en Finanzas",
tipoEstudio: TipoEstudio.MASTER,
urlFicha: "https://www.ieb.es/programas/master/finanzas
"
},
{
slugUrl: "grado/bilingue-finanzas",
nombre: "Grado en Finanzas",
tipoEstudio: TipoEstudio.GRADO,
urlFicha: "https://www.ieb.es/programas/grado/bilingue-finanzas
"
}
];

describe("UrlContextService", () => {
const service = new UrlContextService(catalog);

it("detecta tipoEstudio MASTER y slug correcto", () => {
const ctx = service.resolveContext(
"https://www.ieb.es/programas/master/finanzas?source=chat
"
);

expect(ctx.tipoEstudio).toBe(TipoEstudio.MASTER);
expect(ctx.cursoSlug).toBe("master/finanzas");


});

it("devuelve DESCONOCIDO cuando no encuentra match", () => {
const ctx = service.resolveContext("https://www.ieb.es/otra-cosa
");

expect(ctx.tipoEstudio).toBe(TipoEstudio.DESCONOCIDO);
expect(ctx.cursoSlug).toBeNull();


});
});

