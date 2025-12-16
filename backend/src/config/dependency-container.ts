import { AppConfig } from "./app-config.js";
import { getDbPool } from "./db-connection.js";

// Services
import { UrlContextService } from "../services/url-context-service.js";
import { SessionService } from "../services/session-service.js";
import { GdprService } from "../services/gdpr-service.js";
import { FlowService } from "../services/flow-service.js";
import { LeadService } from "../services/lead-service.js";
import { LoggingService } from "../services/logging-service.js";
import { MessageService } from "../services/message-service.js";
import { CourseCatalogService } from "../services/course-catalog-service.js";
import { CourseCatalogDbRepository } from "../repositories/course-catalog-db-repository.js";
import { SalesforceAuthProvider } from "../integrations/salesforce-auth-provider.js";
import { SalesforceService } from "../integrations/salesforce-service.js";
import { TipoEstudio } from "../domain/enums.js";

// Repositories (all expect a pg Pool, not AppConfig)
import { ChatSessionRepository } from "../repositories/chat-session-repository.js";
import { LeadDraftRepository } from "../repositories/lead-draft-repository.js";
import { MessageLogRepository } from "../repositories/message-log-repository.js";
import { EventLogRepository } from "../repositories/event-log-repository.js";

// Flow engine (current implementation: load JSON definitions → service)
import { FlowLoader } from "../flow-engine/flow-loader.js";
import { FlowEngine } from "../flow-engine/flow-engine.js";

// Integrations
// Simplified stub for Salesforce to avoid integration complexity in this refactor
class StubSalesforceService {
  async createLead(_payload: any): Promise<string> {
    return "FAKE_LEAD_ID";
  }
}

// Controllers
import { SessionController } from "../api/session-controller.js";
import { MessageController } from "../api/message-controller.js";
import { LeadController } from "../api/lead-controller.js";
import { FlowsController } from "../api/flows-controller.js";
import { HealthController } from "../api/health-controller.js";

// Shape consumed by router
export interface Controllers {
  session: SessionController;
  message: MessageController;
  lead: LeadController;
  flows: FlowsController;
  health: HealthController;
  sessionService: SessionService;
}

export function buildDependencyContainer(config: AppConfig): Controllers {
  // DB Pool
  const db = getDbPool();

  // Load flows JSON once
  const flowsRecord = FlowLoader.loadAllFlows();
  const flowEngine = new FlowEngine(flowsRecord); // Para FlowsController
  const flowService = new FlowService(flowsRecord); // Para MessageService

  // Repositories
  const chatSessionRepository = new ChatSessionRepository(db);
  const leadDraftRepository = new LeadDraftRepository(db);
  const messageLogRepository = new MessageLogRepository(db);
  const eventLogRepository = new EventLogRepository(db);

  // Salesforce: decidir entre real y stub según disponibilidad de credenciales
  const salesforceDomain = process.env.SALESFORCE_DOMAIN;
  const salesforceClientId = process.env.SALESFORCE_CLIENT_ID;
  const salesforceClientSecret = process.env.SALESFORCE_CLIENT_SECRET;
  const salesforceApiVersion = process.env.SALESFORCE_API_VERSION || "v60.0";

  let sfService: any;
  if (salesforceDomain && salesforceClientId && salesforceClientSecret) {
    const sfAuth = new SalesforceAuthProvider({
      domain: salesforceDomain,
      clientId: salesforceClientId,
      clientSecret: salesforceClientSecret,
      apiVersion: salesforceApiVersion
    });
    sfService = new SalesforceService(sfAuth);
  } else {
    sfService = new StubSalesforceService();
  }

  // Cross-cutting services
  const courseCatalogRepository = new CourseCatalogDbRepository(db);
  const courseCatalogService = new CourseCatalogService(courseCatalogRepository);
  // Catálogo inicial transformado al formato que espera UrlContextService
  const urlContextService = new UrlContextService(courseCatalogService.getAll().map(c => ({
    slugUrl: c.slug,
    nombre: c.nombre,
    tipoEstudio: c.categoriaFlujo.startsWith("MASTER")
      ? TipoEstudio.MASTER
      : c.categoriaFlujo.includes("ONLINE")
        ? TipoEstudio.ONLINE
        : c.categoriaFlujo === "GRADO"
          ? TipoEstudio.GRADO
          : TipoEstudio.DESCONOCIDO,
    urlFicha: ""
  })));
  const gdprService = new GdprService();
  const loggingService = new LoggingService(messageLogRepository, eventLogRepository);
  const leadService = new LeadService(leadDraftRepository, sfService as any, gdprService);
  const sessionService = new SessionService(db);
  const messageService = new MessageService(chatSessionRepository, flowService, leadService, loggingService, courseCatalogService);

  // Controllers
  return ({
    session: new SessionController(sessionService),
    message: new MessageController(messageService),
    lead: new LeadController(leadService, sessionService),
    flows: new FlowsController(flowEngine),
    health: new HealthController(),
    sessionService,
    leadService,
  } as unknown as Controllers);
}
