
import {
ValidationError,
NotFoundError,
BusinessRuleError,
FlowStateError,
IntegrationError,
SalesforceError
} from "../domain/errors.js";

export function mapErrorToHttp(err: any) {
if (err instanceof ValidationError) {
return { status: 400, body: { code: err.code, message: err.message } };
}

if (err instanceof NotFoundError) {
return { status: 404, body: { code: err.code, message: err.message } };
}

if (err instanceof BusinessRuleError) {
return { status: 422, body: { code: err.code, message: err.message } };
}

if (err instanceof FlowStateError) {
return { status: 409, body: { code: err.code, message: err.message } };
}

if (err instanceof SalesforceError || err instanceof IntegrationError) {
return { status: 500, body: { code: err.code, message: err.message } };
}

return { status: 500, body: { code: "UNKNOWN_ERROR", message: "Error inesperado" } };
}

