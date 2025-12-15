
/**

Mock muy simple de SalesforceService para tests de integración.

No hace llamadas reales, solo devuelve IDs sintéticos.
*/

export class MockSalesforceService {
public createdLeads: any[] = [];
public shouldFail = false;

async createLead(payload: any): Promise<string> {
if (this.shouldFail) {
throw new Error("SALESFORCE_DOWN");
}
const id = 00Q_TEST_${this.createdLeads.length + 1};
this.createdLeads.push({ id, payload });
return id;
}

async updateLead(_id: string, _payload: any): Promise<void> {
if (this.shouldFail) {
throw new Error("SALESFORCE_DOWN");
}
// no-op en mock
}
}

