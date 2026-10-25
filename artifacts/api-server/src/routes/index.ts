import { Router, type IRouter } from "express";
import healthRouter from "./health";
import draftmateRouter from "./draftmate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(draftmateRouter);

export default router;
