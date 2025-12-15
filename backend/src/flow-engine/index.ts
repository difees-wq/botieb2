

import { FlowLoader } from "./flow-loader";
import { FlowEngine } from "./flow-engine";

export function buildFlowEngine(): FlowEngine {
const flows = FlowLoader.loadAllFlows();
return new FlowEngine(flows);
}

