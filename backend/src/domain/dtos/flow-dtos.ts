
export interface FlowOption {
id: string;
label: string;
}

export interface FlowField {
id: string;
label: string;
tipo: "TEXT" | "NUMBER" | "DATE" | "EMAIL" | "TEL";
}

export interface FlowNode {
id: string;
tipo: "INFO" | "BOTONERA" | "FORM";
titulo: string;
texto?: string;
opciones?: FlowOption[];
camposFormulario?: FlowField[];
next: string | Record<string, string>;
}

export interface FlowDefinition {
id: string;
version: string;
nodos: FlowNode[];
}

