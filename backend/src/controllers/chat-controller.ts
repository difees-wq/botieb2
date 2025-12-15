import { Request, Response } from 'express';
import { loadAppConfig } from '../config/app-config';
import { buildDependencyContainer } from '../config/dependency-container';
import { FlowLoader } from '../flow-engine/flow-loader';
import { FlowEngine } from '../flow-engine/flow-engine';
import { getDbPool } from '../config/db-connection';
import { DynamicQueryHandler } from './dynamic-query-handler';
import { LeadService } from '../services/lead-service';


// Build dependencies once per process
const config = loadAppConfig();
const container = buildDependencyContainer(config);
const sessionService = container.sessionService;

// Instantiate FlowEngine from flow.json via FlowLoader
const flowsRecord = FlowLoader.loadAllFlows();
console.log("DEBUG FLOW N0:", JSON.stringify(flowsRecord.default.nodos.find(n => n.id === "N0"), null, 2));

const flowEngine = new FlowEngine(flowsRecord);

// Real dynamic handler backed by Supabase/PostgreSQL
const dynamicHandler = new DynamicQueryHandler(getDbPool());

// Adapter: map userInput to EntradaUsuario expected by FlowEngine
function toEntradaUsuario(userInput: any): any {
  if (userInput == null) return null;
  if (typeof userInput === 'object' && ('value' in userInput || 'label' in userInput)) {
    return { tipo: 'BOTON', valor: userInput.value ?? userInput.label };
  }
  if (typeof userInput === 'object') {
    return { tipo: 'FORM', campos: userInput };
  }
  // plain text treated as button value
  return { tipo: 'BOTON', valor: String(userInput) };
}

// Adapter: apply dataToSave semantics from node to state
async function applyDataToSave(node: any, userInput: any, prevState: any, dynamicHandler: any): Promise<any> {
  const nextState = { ...prevState };
  const tipo = node?.tipo || node?.type;
  const saveSpec = node?.saveToState ?? node?.dataToSave;
  if (!saveSpec) return nextState;

  // Normaliza userInput
  const selected = {
    value: userInput?.value ?? userInput,
    label:
      userInput?.label ??
      userInput?.texto ??
      userInput?.name ??
      null
  };

  // BOTONERA y DYNAMIC
  if (tipo === "BOTONERA" || tipo === "choice" || tipo === "DYNAMIC" || tipo === "dynamic") {
    if (typeof saveSpec === "string") {
      nextState[saveSpec] = selected.value;
    } else if (typeof saveSpec === "object") {
      for (const [destKey, sourceKey] of Object.entries(saveSpec)) {
        if (sourceKey === "value") nextState[destKey] = selected.value;
        else if (sourceKey === "label") nextState[destKey] = selected.label;
      }
    }
  }

  //  EXTRA: Recuperar label real del curso si dynamicQuery === getCoursesByFilters
  if (node.dynamicQuery === "getCoursesByFilters") {
  try {
    const options = await dynamicHandler.getCoursesByFilters(nextState);
    const opt = (options as Array<any>).find((o: any) => o.value === selected.value);

    if (opt) {
      nextState["selectedCourseName"] = opt.label;
      nextState["selectedCourseSfId"] = opt.sf_id;   
      nextState["selectedStudyInterest"] = opt.study_of_interest;
    }
  } catch (e) {
    console.error("Error resolving selectedCourseName / selectedCourseSfId:", e);
  }
}

  // FORM
  if ((tipo === "FORM" || tipo === "form") && typeof saveSpec === "object") {
    for (const [formField, dest] of Object.entries(saveSpec)) {
      nextState[dest as string] = userInput?.[formField as string];
      // 🔥 Duplicar email para que el Flow de Salesforce no lo borre
      if (formField === "email") {
        nextState["00N8b00000AXnUB"] = userInput.email;  // Campo extra igual que Web-to-Lead
      }
      // Soporte para comentario libre
      if (formField === "comment") {
        nextState["userComment"] = userInput.comment || "";
      }
    }
  }

  return nextState;
}


// Reemplaza {{variable}} por el valor del state
function applyTemplate(text: string, state: any): string {
  if (!text || typeof text !== "string") return text;
  return text.replace(/{{\s*([\w\d_]+)\s*}}/g, (_, key) => {
    return state[key] !== undefined ? String(state[key]) : "";
  });
}

// Helper to build frontend response from a node (supports legacy node.type and new node.tipo)
async function buildNodeResponse(node: any, state: any) {
  const tipo = node.tipo || node.type; // prefer nuevo esquema 'tipo'

  // BOTONERA
  if (tipo === 'BOTONERA' || tipo === 'choice') {
    return {
      type: 'choice',
      botMessage: applyTemplate(node.titulo || node.prompt || node.texto || '', state),
      options: node.opciones || node.options || []
    };
  }

  // DYNAMIC
  if (tipo === 'DYNAMIC' || tipo === 'dynamic') {
    let options: any[] = [];
    if (node.dynamicQuery === 'getAvailableYears') {
      const raw = await dynamicHandler.getAvailableYears(state);
      options = (raw || []).map((o: any) => ({ valor: o.value, texto: o.label }));
    } else if (node.dynamicQuery === 'getCoursesByFilters') {
      const raw = await dynamicHandler.getCoursesByFilters(state);
      options = (raw || []).map((o: any) => ({ valor: o.value, texto: o.label, sf_id: o.sf_id, study_of_interest: o.study_of_interest }));
    }
    return {
      type: 'dynamic',
      botMessage: applyTemplate(node.titulo || node.prompt || node.texto || '', state),
      options
    };
  }

  // FORM
  if (tipo === 'FORM' || tipo === 'form') {
    return {
      type: 'form',
      botMessage: applyTemplate(node.titulo || node.prompt || node.texto || '', state),
      options: node.camposFormulario || node.fields || []
    };
  }

  // INFO / MESSAGE
  if (tipo === 'INFO' || tipo === 'message') {
    return {
      type: 'message',
      botMessage: applyTemplate(node.titulo || node.message || node.texto || '', state),
      options: []
    };
  }

  // END
  if (tipo === 'end') {
    return {
      type: 'end',
      botMessage: applyTemplate(node.titulo || node.texto || '', state),
      options: []
    };
  }

  // Fallback
  return { 
    type: 'message', 
    botMessage: applyTemplate(node.titulo || node.texto || '', state), 
    options: [] 
  };
}


export async function chatNextHandler(req: Request, res: Response) {
  try {
    const { sessionId, visitorHash, urlOrigen, userInput } = req.body || {};
    if (!visitorHash || !urlOrigen) {
      return res.status(400).json({ error: 'visitorHash y urlOrigen requeridos' });
    }

    // 1/2: create or get session
    let session = null as any;
    if (!sessionId) {
      session = await (sessionService as any).createOrGetSession(visitorHash, urlOrigen);
    } else {
      session = await (sessionService as any).getSession(sessionId);
      if (!session) {
        session = await (sessionService as any).createOrGetSession(visitorHash, urlOrigen);
      }
    }

    const flowId = 'default';
    const flow = flowsRecord[flowId] as any;  // <<< evita el error TS
    const startNode = flow.startNode || "N0";

    // Si no hay nodo actual, usar startNode
    let currentNodeId = session.currentNodeId || startNode;
    // Fuerza reinicio desde startNode cuando es la primera carga
    if (userInput == null) {
      currentNodeId = startNode;
    }
    const state = typeof session.state === 'string' ? JSON.parse(session.state) : (session.state || {});

    // 3: first load → do not advance
    if (userInput == null) {
  const node = flowEngine.getNode(flowId, currentNodeId);
  const nodeRes = await buildNodeResponse(node, state);
      console.log("====== DEBUG RES IDENTIFIER ======");
      console.log("[RESPONSE] state.email that goes to frontend:", state?.email);
      console.log("=================================");

      // Persist startNode (N0) as the current node on first load
      await sessionService.updateSession(session.sessionId, state, startNode);

      return res.json({
        sessionId: session.sessionId,
        currentNodeId,
        botMessage: nodeRes.botMessage,
        type: nodeRes.type,
        options: nodeRes.options || [],
        state,
        forceBotMessage: true
      });
    }

    // 4: map input → compute next using FlowEngine
    const entrada = toEntradaUsuario(userInput);
    if (!entrada) {
      return res.status(400).json({ error: 'Entrada de usuario inválida', code: 'FLOW_INPUT_INVALID' });
    }

    // Build minimal ChatSession expected by computeNext
    const chatSession = {
      tipoEstudio: flowId,
      estadoFlujo: currentNodeId
    } as any;

    let nextNodeId: string;
    try {
      console.log("DEBUG N0 CLICK userInput:", userInput);
      console.log("DEBUG N0 CLICK entrada:", entrada);
      const result = flowEngine.computeNext(chatSession, entrada);
      nextNodeId = result.nextNodeId;
    } catch (e: any) {
      return res.status(400).json({ error: e.message, code: e.code });
    }

    // Apply save-to-state semantics (adapter)
    const currentNode = flowEngine.getNode(flowId, currentNodeId);
    const updatedState = await applyDataToSave(currentNode, userInput, state, dynamicHandler);

    if (currentNodeId === "N9") {
      console.log("====== DEBUG N9 ======");
      console.log("[N9] userInput.email:", userInput?.email);
      console.log("[N9] updatedState.email:", updatedState?.email);
      console.log("======================");
    }


   // If we are transitioning from N10 to N11, create a Salesforce Lead asynchronously
   
 if (
  (currentNodeId === 'N10' && nextNodeId === 'N11') ||
  (currentNodeId === 'N10_REPEAT' && nextNodeId === 'N11_REPEAT')
) 
  {
  console.log("====== DEBUG N10→N11 ======");
  console.log("[N10→N11] userInput.value (contactMethod):", userInput?.value);
  console.log("[N10→N11] updatedState.email justo ANTES de crear Lead:", updatedState?.email);
  console.log("[N10→N11] selectedCourseId:", updatedState?.selectedCourseId);
  console.log("===========================");

  // Inicializar array de estudios ya enviados
  updatedState.createdLeads = Array.isArray(updatedState.createdLeads)
    ? updatedState.createdLeads
    : [];

  // Evitar duplicar lead para el mismo estudio
  if (updatedState.createdLeads.includes(updatedState.selectedCourseId)) {
    console.log("[chat-controller] Lead ya creado para este estudio. No se crea otro.");
  } else {
    const contactMethod: string = String(userInput?.value ?? '');
    const visitorHash: string = String(req.body?.visitorHash ?? '');
    const leadService = (container as any).leadService;

    // Marcar ANTES de enviar (evita dobles clicks)
    updatedState.createdLeads.push(updatedState.selectedCourseId);

    (async () => {
      try {
        await leadService.createLeadFromChatbot(updatedState, visitorHash, contactMethod);
      } catch (e: any) {
        console.error('[chat-controller] createLeadFromChatbot failed:', e?.message || e);
      }
    })();
  }
}


    const nextNode = flowEngine.getNode(flowId, nextNodeId);
    const nodeRes = await buildNodeResponse(nextNode, updatedState);

    // Persist updated session
    await (sessionService as any).updateSession(session.sessionId, updatedState, nextNodeId);
    console.log("====== DEBUG UPDATE SESSION ======");
    console.log("[updateSession] Vamos a guardar state.email:", updatedState?.email);
    console.log("=================================");
    // Response
    return res.json({
      sessionId: session.sessionId,
      currentNodeId: nextNodeId,
      botMessage: nodeRes.botMessage,
      type: nodeRes.type,
      options: nodeRes.options || [],
      state: updatedState
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Unexpected error' });
  }
}
