export type AgentEvent = {
  id: string;
  agentId: string;
  status: string;
  featureId: string;
  messageType: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type DemoStep = {
  active: boolean;
  feature: string;
  feature_index: number;
  total_features: number;
  agent: string;
  stage: string;
  status: string;
};

export type DemoState = {
  running: boolean;
  startedAt: string;
  result?: string;
};

const DEMO_FEATURES = [
  { title: "Add CSV Export", request: "Export tasks as CSV via new endpoint" },
  { title: "Add Dark Mode", request: "Theme preference with dark mode toggle" },
  { title: "Add Label Filtering", request: "Filter tasks by label/category" },
  { title: "Add OTP Auth", request: "Two-factor authentication support" },
  { title: "Add Pagination", request: "Page and limit query params for tasks" },
];

const AGENTS = ["spec-agent", "code-gen-agent", "qa-agent", "deploy-agent", "docs-agent"];
const STAGES = ["blueprint", "code_patch", "qa_report", "deployment_result"];
const STAGE_STATUS: Record<string, string> = {
  blueprint: "done",
  code_patch: "done",
  qa_report: "done",
  deployment_result: "deployed",
};

const events: AgentEvent[] = [];
let demoState: DemoState = { running: false, startedAt: "" };
let step: DemoStep = { active: false, feature: "", feature_index: 0, total_features: 5, agent: "", stage: "", status: "" };
let currentFeatureIdx = 0;
let timers: ReturnType<typeof setTimeout>[] = [];

export function getEvents() {
  return events;
}

export function pushEvent(e: Omit<AgentEvent, "id" | "createdAt">) {
  const record: AgentEvent = {
    ...e,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  events.unshift(record);
  if (events.length > 500) events.length = 500;
  return record;
}

export function getDemoState(): DemoState {
  return { ...demoState };
}

export function getStep(): DemoStep {
  return step;
}

export function startDemo() {
  if (demoState.running) return false;
  demoState = { running: true, startedAt: new Date().toISOString() };
  currentFeatureIdx = 0;
  runNextFeature();
  return true;
}

function runNextFeature() {
  if (currentFeatureIdx >= DEMO_FEATURES.length) {
    demoState = { running: false, startedAt: demoState.startedAt, result: "Demo complete! 5/5 features processed successfully." };
    step = { active: false, feature: "", feature_index: 0, total_features: 5, agent: "", stage: "", status: "" };
    return;
  }

  const feature = DEMO_FEATURES[currentFeatureIdx];
  const fid = feature.title;
  let agentIdx = 0;

  step = { active: true, feature: fid, feature_index: currentFeatureIdx, total_features: DEMO_FEATURES.length, agent: AGENTS[0], stage: "submitted", status: "pending" };

  pushEvent({ agentId: "user", status: "done", featureId: fid, messageType: "feature_request", payload: feature });

  function scheduleAgent(delayMs: number) {
    const t = setTimeout(() => {
      if (agentIdx >= AGENTS.length) {
        currentFeatureIdx++;
        runNextFeature();
        return;
      }

      const agent = AGENTS[agentIdx];
      const stage = agentIdx > 0 ? STAGES[agentIdx - 1] : "feature_request";
      const status = agentIdx === AGENTS.length - 1 ? "deployed" : agentIdx >= STAGES.length ? "done" : STAGE_STATUS[stage] || "done";

      step = { ...step, agent, stage, status };

      pushEvent({
        agentId: agent,
        status,
        featureId: fid,
        messageType: stage,
        payload: { feature: fid, agent },
      });

      if (stage === "qa_report") {
        pushEvent({
          agentId: "qa-agent",
          status: "done",
          featureId: fid,
          messageType: "qa_report",
          payload: { feature: fid, qa_signed_off: true, passed: 11, failed: 0 },
        });
      }

      agentIdx++;
      scheduleAgent(800);
    }, delayMs);
    timers.push(t);
  }

  scheduleAgent(500);
}

export function stopDemo() {
  timers.forEach(clearTimeout);
  timers = [];
  demoState = { running: false, startedAt: demoState.startedAt, result: "Demo stopped" };
  step = { active: false, feature: "", feature_index: 0, total_features: 5, agent: "", stage: "", status: "" };
}

export function submitFeature(title: string, request: string) {
  const fid = title;
  pushEvent({ agentId: "user", status: "done", featureId: fid, messageType: "feature_request", payload: { title, request } });
  const t = setTimeout(() => {
    pushEvent({ agentId: "spec-agent", status: "done", featureId: fid, messageType: "blueprint", payload: { feature: fid, complexity: "medium" } });
  }, 1000);
  timers.push(t);
  const t2 = setTimeout(() => {
    pushEvent({ agentId: "code-gen-agent", status: "done", featureId: fid, messageType: "code_patch", payload: { feature: fid, files_changed: 3 } });
  }, 2500);
  timers.push(t2);
  const t3 = setTimeout(() => {
    pushEvent({ agentId: "qa-agent", status: "done", featureId: fid, messageType: "qa_report", payload: { feature: fid, qa_signed_off: true, passed: 11, failed: 0 } });
  }, 4000);
  timers.push(t3);
}
