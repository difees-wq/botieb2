
export class BaseError extends Error {
constructor(public code: string, message: string) {
super(message);
Object.setPrototypeOf(this, new.target.prototype);
}
}

export class ValidationError extends BaseError {}
export class BusinessRuleError extends BaseError {}
export class NotFoundError extends BaseError {}
export class FlowStateError extends BaseError {}

export class SalesforceError extends BaseError {}
export class IntegrationError extends BaseError {}
export class DatabaseError extends BaseError {}


