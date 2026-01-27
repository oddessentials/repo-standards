// src/gates/index.ts
// Barrel export for quality and victory gates

export { evaluateEG01, evaluateEG02, evaluateEG03 } from "./entry-gates.js";

export {
  evaluatePG01,
  evaluatePG02,
  evaluatePG03,
  evaluatePG04,
  evaluatePG05,
} from "./phase-gates.js";

export {
  evaluateXG01,
  evaluateXG02,
  evaluateXG03,
  evaluateXG04,
} from "./exit-gates.js";

export {
  evaluateRSG01,
  evaluateRSG02,
  evaluateRSG03,
} from "./remediation-gates.js";

export {
  evaluateVG001,
  evaluateVG002,
  evaluateVG003,
  evaluateVG004,
  evaluateVG005,
  evaluateVGR01,
  evaluateVGR02,
  evaluateVGR03,
} from "./victory-gates.js";
