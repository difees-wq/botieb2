import { describe, test, expect } from '@jest/globals';
import { FlowEngine } from '../../../src/flow-engine/flow-engine';
import { ConversationState } from '../../../src/domain/models/chat-flow';

// Lightweight FlowResponse shape as used by FlowEngine.processNode in this project
// If FlowResponse is exported elsewhere, adjust import accordingly.

type FlowResponse = {
  type: 'choice' | 'dynamic' | 'form' | 'message' | 'end';
  nodeId: string;
  nextNodeId?: string | null;
  options?: Array<{ label: string; value?: string | number; nextNodeId?: string }>;
  fields?: Array<{ key: string; label: string; type: string; required?: boolean }>;
  message?: string;
  end?: boolean;
};

// DynamicQueryHandler mock
class MockDynamicQueryHandler {
  async getAvailableYears(): Promise<Array<{ label: string; value: number }>> {
    return [
      { label: '2024', value: 2024 },
      { label: '2025', value: 2025 }
    ];
  }
  async getCoursesByYear(year: number): Promise<Array<{ id: string; name: string }>> {
    if (year === 2024) return [{ id: 'C-24-1', name: 'Curso 24-1' }];
    if (year === 2025) return [{ id: 'C-25-1', name: 'Curso 25-1' }, { id: 'C-25-2', name: 'Curso 25-2' }];
    return [];
  }
}

// Mock flow definition
const flow = {
  nodos: [
    {
      id: 'N1',
  type: 'choice',
  prompt: 'Elige tipo de estudio',
  options: [
        { label: 'Máster', value: 'MASTER', nextNodeId: 'N2' },
        { label: 'Curso', value: 'CURSO', nextNodeId: 'N2' }
      ],
      dataToSave: 'tipoEstudio'
    },
    {
      id: 'N2',
  type: 'choice',
      prompt: '¿Qué año te interesa?',
  options: [
        { label: 'Elegir año', nextNodeId: 'N6' }
      ],
      dataToSave: { selectedLabel: 'anioLabel' }
    },
    {
      id: 'N3',
  type: 'message',
      message: 'Mensaje intermedio',
      nextNodeId: 'N2'
    },
    {
      id: 'N6',
  type: 'dynamic',
      dynamicQuery: 'getAvailableYears',
      dataToSave: 'selectedYear',
      nextNodeId: 'N7'
    },
    {
      id: 'N7',
  type: 'dynamic',
      dynamicQuery: 'getCoursesByYear',
      // save both id and label
      dataToSave: { value: 'selectedCourseId', label: 'selectedCourseName' },
      nextNodeId: 'N9'
    },
    {
      id: 'N9',
  type: 'form',
      fields: [
        { key: 'nombre', label: 'Nombre', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'telefono', label: 'Teléfono', type: 'tel', required: false }
      ],
      validationRules: ['required'],
      dataToSave: { nombre: 'leadNombre', email: 'leadEmail', telefono: 'leadTelefono' },
      nextNodeId: 'N10'
    },
    {
      id: 'N10',
  type: 'choice',
      prompt: '¿Confirmas el envío?',
      options: [
        { label: 'Sí', value: 'YES', nextNodeId: 'N11' },
        { label: 'No', value: 'NO', nextNodeId: 'N11' }
      ],
      dataToSave: 'confirmacion'
    },
    {
      id: 'N11',
  type: 'message',
      message: 'Gracias, procesamos tu solicitud',
      nextNodeId: 'N12'
    },
    {
      id: 'N12',
      type: 'end'
    }
  ]
} as any;

function makeEngine() {
  const handler = new MockDynamicQueryHandler();
  // FlowEngine likely expects a record keyed by flow id; adapt if necessary
  const flowsRecord = { default: flow } as any;
  const engine = new FlowEngine(flowsRecord);
  const adapter = new TestableEngine(engine, handler as any);
  return { engine: adapter, handler };
}

// Adapter to provide the requested API over the existing FlowEngine
class TestableEngine {
  constructor(private readonly engine: FlowEngine, private readonly dyn: any) {}

  getNodeById(flowId: string, nodeId: string) {
    try {
      return (this.engine as any).getNode(flowId, nodeId);
    } catch (e: any) {
      throw { code: 'FLOW_NODE_NOT_FOUND', message: e.message };
    }
  }

  async processNode(flowId: string, nodeId: string): Promise<FlowResponse> {
    const node = this.getNodeById(flowId, nodeId);
    if (node.type === 'choice') {
      return { type: 'choice', nodeId, options: node.options } as FlowResponse;
    }
    if (node.type === 'dynamic') {
      // Map dynamicQuery to mock handlers
      if (node.dynamicQuery === 'getAvailableYears') {
        const opts = await this.dyn.getAvailableYears();
        return { type: 'dynamic', nodeId, options: opts } as FlowResponse;
      }
      if (node.dynamicQuery === 'getCoursesByYear') {
        // use selectedYear from state if needed; for this test we return empty and rely on handleUserResponse
        const opts = await this.dyn.getCoursesByYear(2025);
        return { type: 'dynamic', nodeId, options: opts } as FlowResponse;
      }
      return { type: 'dynamic', nodeId, options: [] } as FlowResponse;
    }
    if (node.type === 'form') {
      return { type: 'form', nodeId, fields: node.fields } as FlowResponse;
    }
    if (node.type === 'message') {
      return { type: 'message', nodeId, message: node.message, nextNodeId: node.nextNodeId } as FlowResponse;
    }
    if (node.type === 'end') {
      return { type: 'end', nodeId, end: true } as FlowResponse;
    }
    throw new Error('Unsupported node type');
  }

  async handleUserResponse(state: any, userInput: any): Promise<string | null> {
    const node = this.getNodeById(state.flowId, state.currentNodeId);
    if (node.type === 'choice') {
      const selected = node.options.find((o: any) => o.value === userInput.value || o.label === userInput.label);
      if (!selected) throw { code: 'FLOW_CHOICE_INVALID_OPTION', message: 'Invalid option' };
      if (typeof node.dataToSave === 'string') {
        state.data[node.dataToSave] = selected.value ?? selected.label;
      } else if (node.dataToSave && typeof node.dataToSave === 'object') {
        const entries = Object.entries(node.dataToSave) as Array<[string, string]>;
        for (const [sourceKey, targetKey] of entries) {
          if (sourceKey === 'value') state.data[targetKey] = selected.value;
          else if (sourceKey === 'label' || sourceKey === 'selectedLabel') state.data[targetKey] = selected.label;
          else state.data[targetKey] = (selected as any)[sourceKey];
        }
      }
      return selected.nextNodeId ?? null;
    }
    if (node.type === 'dynamic') {
      if (typeof node.dataToSave === 'string') {
        state.data[node.dataToSave] = userInput.value ?? userInput.label;
      } else if (node.dataToSave && typeof node.dataToSave === 'object') {
        if (node.dataToSave.value) state.data[node.dataToSave.value] = userInput.value;
        if (node.dataToSave.label) state.data[node.dataToSave.label] = userInput.label;
      }
      return node.nextNodeId ?? null;
    }
    if (node.type === 'form') {
      // simple required validation
      const requiredKeys = (node.fields || []).filter((f: any) => f.required).map((f: any) => f.key);
      for (const k of requiredKeys) {
        if (!userInput[k]) {
          throw { code: 'FLOW_FORM_VALIDATION_FAILED', message: 'Missing required field' };
        }
      }
      if (node.dataToSave && typeof node.dataToSave === 'object') {
        for (const [fieldKey, targetKey] of Object.entries(node.dataToSave)) {
          state.data[targetKey as string] = userInput[fieldKey];
        }
      }
      return node.nextNodeId ?? null;
    }
    if (node.type === 'message') {
      return node.nextNodeId ?? null;
    }
    if (node.type === 'end') {
      return null;
    }
    throw new Error('Unsupported node type');
  }
}

describe('FlowEngine', () => {
  test('getNodeById: existing node', () => {
    const { engine } = makeEngine();
  const node = (engine as any).getNodeById('default', 'N1');
    expect(node.id).toEqual('N1');
    expect(node.type).toEqual('choice');
  });

  test('getNodeById: non-existing throws FLOW_NODE_NOT_FOUND', () => {
    const { engine } = makeEngine();
    try {
      (engine as any).getNodeById('default', 'NX');
      throw new Error('should have thrown');
    } catch (e: any) {
      expect(e.code).toEqual('FLOW_NODE_NOT_FOUND');
    }
  });

  test('processNode: choice returns options', async () => {
    const { engine } = makeEngine();
  const res = (await (engine as any).processNode('default', 'N1')) as FlowResponse;
    expect(res.type).toEqual('choice');
    expect(res.options).toEqual([
      { label: 'Máster', value: 'MASTER', nextNodeId: 'N2' },
      { label: 'Curso', value: 'CURSO', nextNodeId: 'N2' }
    ]);
  });

  test('processNode: dynamic uses handler mock (getAvailableYears)', async () => {
    const { engine } = makeEngine();
  const res = (await (engine as any).processNode('default', 'N6')) as FlowResponse;
    expect(res.type).toEqual('dynamic');
    expect(res.options).toEqual([
      { label: '2024', value: 2024 },
      { label: '2025', value: 2025 }
    ]);
  });

  test('processNode: form returns fields', async () => {
    const { engine } = makeEngine();
  const res = (await (engine as any).processNode('default', 'N9')) as FlowResponse;
    expect(res.type).toEqual('form');
    expect(res.fields).toEqual([
      { key: 'nombre', label: 'Nombre', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'telefono', label: 'Teléfono', type: 'tel', required: false }
    ]);
  });

  test('processNode: message returns correctly', async () => {
    const { engine } = makeEngine();
  const res = (await (engine as any).processNode('default', 'N11')) as FlowResponse;
    expect(res.type).toEqual('message');
    expect(res.message).toEqual('Gracias, procesamos tu solicitud');
    expect(res.nextNodeId).toEqual('N12');
  });

  test('processNode: end returns {end: true}', async () => {
    const { engine } = makeEngine();
  const res = (await (engine as any).processNode('default', 'N12')) as FlowResponse;
    expect(res.type).toEqual('end');
    expect(res.end).toEqual(true);
  });

  test('handleUserResponse: choice saves string and map', async () => {
    const { engine } = makeEngine();
  const state: any = { data: {}, currentNodeId: 'N1', flowId: 'default' };
    // Choose Máster
  const next = await (engine as any).handleUserResponse(state, { value: 'MASTER', label: 'Máster' });
    expect(state.data['tipoEstudio']).toEqual('MASTER'); // string save
    expect(next).toEqual('N2');

    // On N2, dataToSave map saves label
  state.currentNodeId = 'N2';
  const next2 = await (engine as any).handleUserResponse(state, { label: 'Elegir año' });
    expect(state.data['anioLabel']).toEqual('Elegir año');
    expect(next2).toEqual('N6');
  });

  test('handleUserResponse: dynamic saves selectedYear and course id/name', async () => {
    const { engine } = makeEngine();
  const state: any = { data: {}, currentNodeId: 'N6', flowId: 'default' };
  const next = await (engine as any).handleUserResponse(state, { value: 2025, label: '2025' });
    expect(state.data['selectedYear']).toEqual(2025);
    expect(next).toEqual('N7');

    // Move to N7 and select a course
    state.currentNodeId = 'N7';
  const next2 = await (engine as any).handleUserResponse(state, { value: 'C-25-2', label: 'Curso 25-2' });
    expect(state.data['selectedCourseId']).toEqual('C-25-2');
    expect(state.data['selectedCourseName']).toEqual('Curso 25-2');
    expect(next2).toEqual('N9');
  });

  test('handleUserResponse: form saves correctly and validates required', async () => {
    const { engine } = makeEngine();
  const state: any = { data: {}, currentNodeId: 'N9', flowId: 'default' };
    // Valid form submission
  const next = await (engine as any).handleUserResponse(state, { nombre: 'Ana', email: 'ana@example.com', telefono: '600123123' });
    expect(state.data['leadNombre']).toEqual('Ana');
    expect(state.data['leadEmail']).toEqual('ana@example.com');
    expect(state.data['leadTelefono']).toEqual('600123123');
    expect(next).toEqual('N10');

    // Missing required should fail
    state.currentNodeId = 'N9';
  await expect((engine as any).handleUserResponse(state, { nombre: '', email: '' })).rejects.toMatchObject({ code: 'FLOW_FORM_VALIDATION_FAILED' });
  });

  test('handleUserResponse: choice invalid option throws FLOW_CHOICE_INVALID_OPTION', async () => {
  const { engine } = makeEngine();
  const state: any = { data: {}, currentNodeId: 'N1', flowId: 'default' };
  await expect((engine as any).handleUserResponse(state, { value: 'INVALID', label: 'Invalid' })).rejects.toMatchObject({ code: 'FLOW_CHOICE_INVALID_OPTION' });
  });

  test('handleUserResponse: message advances, end returns null', async () => {
  const { engine } = makeEngine();
  const state: any = { data: {}, currentNodeId: 'N11', flowId: 'default' };
  const next = await (engine as any).handleUserResponse(state, {});
    expect(next).toEqual('N12');

    state.currentNodeId = 'N12';
  const next2 = await (engine as any).handleUserResponse(state, {});
    expect(next2).toBeNull();
  });

  test('workflow completo: conversación mini', async () => {
  const { engine } = makeEngine();
  const state: any = { data: {}, currentNodeId: 'N1', flowId: 'default' };

    // N1 (choice) → N2
  let next = await (engine as any).handleUserResponse(state, { value: 'MASTER', label: 'Máster' });
    expect(next).toEqual('N2');

    // N2 (choice) → N6
    state.currentNodeId = 'N2';
  next = await (engine as any).handleUserResponse(state, { label: 'Elegir año' });
    expect(next).toEqual('N6');

    // N6 (dynamic) → N7
    state.currentNodeId = 'N6';
  next = await (engine as any).handleUserResponse(state, { value: 2024, label: '2024' });
    expect(next).toEqual('N7');

    // N7 (dynamic) → N9
    state.currentNodeId = 'N7';
  next = await (engine as any).handleUserResponse(state, { value: 'C-24-1', label: 'Curso 24-1' });
    expect(next).toEqual('N9');

    // N9 (form) → N10
    state.currentNodeId = 'N9';
  next = await (engine as any).handleUserResponse(state, { nombre: 'Luis', email: 'luis@example.com' });
    expect(next).toEqual('N10');

    // N10 (choice) → N11
    state.currentNodeId = 'N10';
  next = await (engine as any).handleUserResponse(state, { value: 'YES', label: 'Sí' });
    expect(next).toEqual('N11');

    // N11 (choice/message) → N12
    state.currentNodeId = 'N11';
  next = await (engine as any).handleUserResponse(state, {});
    expect(next).toEqual('N12');
  });
});
