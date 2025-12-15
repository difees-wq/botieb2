
export type FlowNodeType = "INFO" | "BOTONERA" | "FORM" | "DYNAMIC";

export interface FlowOption {
id: string;
label: string;
}

export interface FlowFormField {
id: string;
label: string;
tipo: "TEXT" | "NUMBER" | "EMAIL" | "DATE" | "TEL";
obligatorio?: boolean;
}

export interface FlowNode {
	id: string;
	tipo: FlowNodeType;
	titulo: string;
	texto?: string;
	opciones?: FlowOption[];
	camposFormulario?: FlowFormField[];
	// Para nodos DYNAMIC
	dynamicQuery?: string;
	// Persistencia de estado (nuevo esquema)
	saveToState?: string | Record<string, string>;
	// Compatibilidad legacy (opcional)
	dataToSave?: any;
	next: string | Record<string, string>;
}

export interface FlowDefinition {
id: string;
version: string;
nodos: FlowNode[];
}


