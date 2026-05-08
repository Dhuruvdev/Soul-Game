import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import socialRouter from "./social";
import bondsRouter from "./bonds";
import roomsRouter from "./rooms";
import minigamesRouter from "./minigames";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(socialRouter);
router.use(bondsRouter);
router.use(roomsRouter);
router.use(minigamesRouter);
router.use(dashboardRouter);

export default router;
