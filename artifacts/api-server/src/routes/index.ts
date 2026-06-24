import { Router, type IRouter } from "express";
import healthRouter from "./health";
import resultsRouter from "./results";
import probabilitiesRouter from "./probabilities";

const router: IRouter = Router();
router.use(healthRouter);
router.use(resultsRouter);
router.use(probabilitiesRouter);

export default router;