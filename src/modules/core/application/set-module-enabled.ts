import { z } from "zod";
import { readSchoolSettings, writeSchoolModules } from "../data/school-settings";
import { MODULES } from "../domain/permissions";
import { defineCommand } from "./define-command";

// FR-3: the Director switches a Module on or off. The command itself is `core`, always on.
export const setModuleEnabled = defineCommand({
  name: "core.setModuleEnabled",
  permission: "settings.manage",
  module: "core",
  writes: true,
  schema: z.object({ module: z.enum(MODULES), enabled: z.boolean() }),
  async handler(tx, input, ctx) {
    // Row lock: a concurrent toggle waits instead of overwriting this one.
    const { modules } = await readSchoolSettings(tx, ctx.schoolId, { forUpdate: true });
    const audit = { entity: "school_settings", entityId: ctx.schoolId, fields: [] as string[] };
    if (modules.includes(input.module) === input.enabled) return { data: { modules }, audit };

    const next = input.enabled ? [...modules, input.module] : modules.filter((m) => m !== input.module);
    await writeSchoolModules(tx, ctx.schoolId, next);
    return { data: { modules: next }, audit: { ...audit, fields: ["modules"] } };
  },
});
