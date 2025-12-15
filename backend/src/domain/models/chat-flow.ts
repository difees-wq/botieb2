// Conversational flow TypeScript types (discriminated union)
// NOTE: Pure type declarations only, no runtime logic.

export interface BaseNode {
  id: string; // Ej: "N1", "N2"
  botMessage: string;
  type: 'choice' | 'form' | 'dynamic' | 'message' | 'end';
}

export interface ChoiceNode extends BaseNode {
  type: 'choice';
  options: Array<{
    label: string; // visible to user
    value: string; // used for state or decisions
    next: string; // Node ID
  }>;
}

export interface FormNode extends BaseNode {
  type: 'form';
  fields: Array<{
    name: string;
    label: string;
    inputType: 'text' | 'email' | 'phone';
    required: boolean;
    validationRules?: string[];
  }>;
  next: string;
}

export interface DynamicNode extends BaseNode {
  type: 'dynamic';
  dynamicQuery: string; // name of the query to execute
  next: string;
}

export interface MessageNode extends BaseNode {
  type: 'message';
  next?: string;
}

export interface EndNode extends BaseNode {
  type: 'end';
}

export type ChatFlowNode =
  | ChoiceNode
  | FormNode
  | DynamicNode
  | MessageNode
  | EndNode;

export interface ConversationState {
  selectedYear?: number;
  selectedCourseId?: string;
  selectedCourseName?: string;
  type1?: string;
  type2?: string;
  name?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  contactMethod?: string;
}
