

export interface EntradaUsuario {
tipo: "BOTON" | "FORM";
valor: any;
}

export interface MessageResponseDto {
siguientePaso: {
tipo: string;
titulo: string;
texto: string | null;
opciones: any[];
camposFormulario: any[];
};

flags: {
leadCreado: boolean;
requiereGDPR: boolean;
estadoLead: string;
leadSalesforceId?: string;
};
}

