
import fetch from "node-fetch";
import { SalesforceAuthProvider } from "./salesforce-auth-provider.js";
import { SalesforceError, IntegrationError } from "../domain/errors.js";

export class SalesforceService {
  constructor(private readonly auth: SalesforceAuthProvider) {}

  async createLead(payload: Record<string, any>): Promise<string> {
    const token = await this.auth.getAccessToken();
    const apiVersion = this.auth.apiVersion || "v60.0"; // fallback if somehow empty
    const baseDomain = this.auth.domain;
    const url = `${baseDomain}/services/data/${apiVersion}/sobjects/Lead`;

    const attempt = async (): Promise<string> => {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        throw new IntegrationError("SF_UNAUTHORIZED", "Token inválido o expirado");
      }

      if (!res.ok) {
        const text = await res.text();
        throw new SalesforceError("SF_LEAD_CREATE_ERROR", `Status ${res.status}: ${text}`);
      }

      const json: any = await res.json();
      const id = json.id || json.Id;
      if (!id) {
        throw new SalesforceError("SF_LEAD_INVALID", "Respuesta sin Id");
      }
      return id;
    };

    try {
      return await attempt();
    } catch (e: any) {
      // Retry once if unauthorized: refresh token and retry
      if (e.code === "SF_UNAUTHORIZED") {
        // Force token refresh before retry
        this.auth.invalidateToken();
        const freshToken = await this.auth.getAccessToken();
        const res2 = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${freshToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        if (!res2.ok) {
          const text = await res2.text();
          throw new SalesforceError("SF_LEAD_CREATE_ERROR", `Retry status ${res2.status}: ${text}`);
        }
        const json2: any = await res2.json();
        const id2 = json2.id || json2.Id;
        if (!id2) {
          throw new SalesforceError("SF_LEAD_INVALID", "Respuesta sin Id tras retry");
        }
        return id2;
      }
      throw e;
    }
  }

  /**
   * Obtiene cursos activos (Activo__c = true) desde Salesforce.
   * Devuelve un array con los campos solicitados.
   */
  async getActiveCourses(): Promise<any[]> {
    const token = await this.auth.getAccessToken();
    const apiVersion = this.auth.apiVersion || "v60.0"; // fallback defensivo
    const baseDomain = this.auth.domain;
    // SOQL: cursos activos incluyendo nuevos campos Tipo_de_estudio1__c y Tipo_de_estudio2__c
    const soql = [
      "SELECT Id, Name, Activo__c, Course_Type__c, tipo_de_estudio1__c, tipo_de_estudio2__c, hed__Description__c, URL_Web__c",
      "FROM hed__Course__c",
      "WHERE Activo__c = true"
    ].join(" ");
    const url = `${baseDomain}/services/data/${apiVersion}/query/?q=${encodeURIComponent(soql)}`;

    const attempt = async (bearer: string): Promise<any[]> => {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${bearer}`,
          "Content-Type": "application/json"
        }
      });

      if (res.status === 401) {
        throw new IntegrationError("SF_UNAUTHORIZED", "Token inválido o expirado");
      }

      if (!res.ok) {
        const text = await res.text();
        throw new SalesforceError("SF_QUERY_ERROR", `Status ${res.status}: ${text}`);
      }

      const json: any = await res.json();
      const records = Array.isArray(json.records) ? json.records : [];
      return records.map((r: any) => ({
        id: r.Id || r.id,
        name: r.Name,
        activo: r.Activo__c,
        courseType: r.Course_Type__c,
        tipoDeEstudio1: r.tipo_de_estudio1__c,
        tipoDeEstudio2: r.tipo_de_estudio2__c,
        descripcion: r.hed__Description__c,
        urlWeb: r.URL_Web__c
      }));
    };

    try {
      return await attempt(token);
    } catch (e: any) {
      if (e.code === "SF_UNAUTHORIZED") {
        // Refresh y reintento único
        this.auth.invalidateToken();
        const freshToken = await this.auth.getAccessToken();
        return await attempt(freshToken);
      }
      throw e;
    }
  }

  /**
   * Obtiene las ofertas (Course Offerings) de un curso específico.
   * @param courseId Id del curso (Salesforce Id de hed__Course__c)
   */
  async getOfferingsByCourse(courseId: string): Promise<any[]> {
    if (!courseId) {
      throw new SalesforceError("SF_INVALID_ARGUMENT", "courseId requerido");
    }
    const token = await this.auth.getAccessToken();
    const apiVersion = this.auth.apiVersion || "v60.0";
    const baseDomain = this.auth.domain;
    // SOQL: ofertas asociadas al curso
    const soql = [
      "SELECT Id, hed__Start_Date__c, hed__End_Date__c, Price__c, hed__Course__c",
      "FROM hed__Course_Offering__c",
      `WHERE hed__Course__c = '${courseId.replace(/'/g, "\\'")}'`
    ].join(" ");
    const url = `${baseDomain}/services/data/${apiVersion}/query/?q=${encodeURIComponent(soql)}`;

    const attempt = async (bearer: string): Promise<any[]> => {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${bearer}`,
          "Content-Type": "application/json"
        }
      });

      if (res.status === 401) {
        throw new IntegrationError("SF_UNAUTHORIZED", "Token inválido o expirado");
      }

      if (!res.ok) {
        const text = await res.text();
        throw new SalesforceError("SF_QUERY_ERROR", `Status ${res.status}: ${text}`);
      }

      const json: any = await res.json();
      const records = Array.isArray(json.records) ? json.records : [];
  return records.map((r: any) => ({
        id: r.Id || r.id,
        startDate: r.hed__Start_Date__c,
        endDate: r.hed__End_Date__c,
        price: r.Price__c,
        courseId: r.hed__Course__c
      }));
    };

    try {
      return await attempt(token);
    } catch (e: any) {
      if (e.code === "SF_UNAUTHORIZED") {
        this.auth.invalidateToken();
        const freshToken = await this.auth.getAccessToken();
        return await attempt(freshToken);
      }
      throw e;
    }
  }

    /**
   * Ejecuta una consulta SOQL genérica y devuelve records[]
   * Usado para sincronizar picklists u otros datos arbitrarios.
   */
  /**
 * Devuelve los valores activos del Global Value Set "ValuesStudiesInterest".
 * Usa Tooling API porque los picklists globales no se pueden consultar con SOQL estándar.
 */
async getStudyInterestValues(): Promise<Array<{ apiName: string, label: string, active: boolean }>> {
  const token = await this.auth.getAccessToken();
  const apiVersion = this.auth.apiVersion || "v60.0";
  const baseDomain = this.auth.domain;

  const url =
    `${baseDomain}/services/data/${apiVersion}/tooling/query/?q=` +
    encodeURIComponent(`
      SELECT Metadata
      FROM GlobalValueSet
      WHERE DeveloperName = 'ValuesStudiesInterest'
    `);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[SF] Error consultando Global Value Set ValuesStudiesInterest: ${text}`);
  }

  const json: any = await res.json();
  if (!json.records || json.records.length === 0) {
    throw new Error("[SF] No se encontró Global Value Set ValuesStudiesInterest");
  }

  const metadata = json.records[0].Metadata;

  const values = metadata.customValue || [];

  return values
    .filter((v: any) => v.isActive) // solo activos
    .map((v: any) => ({
      apiName: v.valueName,
      label: v.label,
      active: v.isActive
    }));
}
  /**
   * Ejecuta una consulta SOQL genérica y devuelve records[]
   */
  async query(soql: string): Promise<any[]> {
    const token = await this.auth.getAccessToken();
    const apiVersion = this.auth.apiVersion || "v60.0";
    const baseDomain = this.auth.domain;

    const url =
      `${baseDomain}/services/data/${apiVersion}/query/?q=` +
      encodeURIComponent(soql);

    const attempt = async (bearer: string): Promise<any[]> => {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${bearer}`,
          "Content-Type": "application/json"
        }
      });

      if (res.status === 401) {
        throw new IntegrationError("SF_UNAUTHORIZED", "Token inválido o expirado");
      }

      if (!res.ok) {
        const text = await res.text();
        throw new SalesforceError("SF_QUERY_ERROR", `Status ${res.status}: ${text}`);
      }

      const json: any = await res.json();
      return Array.isArray(json.records) ? json.records : [];
    };

    try {
      return await attempt(token);
    } catch (e: any) {
      if (e.code === "SF_UNAUTHORIZED") {
        this.auth.invalidateToken();
        const fresh = await this.auth.getAccessToken();
        return await attempt(fresh);
      }
      throw e;
    }
  }

}

