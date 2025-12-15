

import { GdprService } from "../../src/services/gdpr-service";
import { BusinessRuleError, ValidationError } from "../../src/domain/errors";

describe("GdprService", () => {
const service = new GdprService();

it("lanza BusinessRuleError si GDPR no aceptado", () => {
expect(() =>
service.ensureGdprAccepted(false)
).toThrow(BusinessRuleError);
});

it("no lanza error si GDPR aceptado", () => {
expect(() => service.ensureGdprAccepted(true)).not.toThrow();
});

it("valida obligatoriedad de canal EMAIL", () => {
expect(() =>
service.validateChannelRequirements({
canalPreferido: "EMAIL",
hasEmail: false,
hasTelefono: false
})
).toThrow(ValidationError);
});

it("permite canal EMAIL con email presente", () => {
expect(() =>
service.validateChannelRequirements({
canalPreferido: "EMAIL",
hasEmail: true,
hasTelefono: false
})
).not.toThrow();
});
});

