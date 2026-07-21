import { Router, type IRouter } from "express";
import healthRouter from "./health";
import conversationsRouter from "./conversations";
import modelsRouter from "./models";
import githubRouter from "./github";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(conversationsRouter);
router.use(modelsRouter);
router.use(githubRouter);
router.use(settingsRouter);

export default router;
