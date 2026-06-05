import type { Context } from "hono";
import { assertHouseholdAccess } from "../lib/household-access.js";
import { parseOrThrow } from "../lib/validation.js";
import { settlementService, type SettlementService } from "../services/settlement.service.js";
import {
  createSettlementSchema,
  settlementHouseholdParamSchema,
  settlementParamsSchema,
} from "../validators/settlement.validator.js";

export class SettlementController {
  constructor(private readonly service: SettlementService = settlementService) {}

  list = async (c: Context) => {
    const { id } = parseOrThrow(settlementHouseholdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const settlements = await this.service.listByHousehold(id);
    return c.json(settlements, 200);
  };

  create = async (c: Context) => {
    const { id } = parseOrThrow(settlementHouseholdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const body = parseOrThrow(createSettlementSchema, await c.req.json());
    const settlement = await this.service.create(id, body);
    return c.json(settlement, 201);
  };

  remove = async (c: Context) => {
    const { id, settlementId } = parseOrThrow(settlementParamsSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const settlement = await this.service.delete(id, settlementId);
    return c.json(settlement, 200);
  };
}

export const settlementController = new SettlementController();
