export const MODULE_CONTROLS = {
  recruitment: {
    label: "Recruitment intake",
    description: "Accept new public player applications.",
    closedMessage: "Recruitment intake is currently closed",
  },
} as const;

export type ModuleControlKey = keyof typeof MODULE_CONTROLS;

export const MODULE_CONTROL_KEYS = Object.keys(
  MODULE_CONTROLS,
) as ModuleControlKey[];
