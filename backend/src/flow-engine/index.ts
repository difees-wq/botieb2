

import { FlowLoader } from "./flow-loader.js";
import { FlowEngine } from "./flow-engine.js";

export function buildFlowEngine(): FlowEngine {
const flows = FlowLoader.loadAllFlows();
return new FlowEngine(flows);
}

