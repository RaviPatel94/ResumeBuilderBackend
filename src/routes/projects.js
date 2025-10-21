import express from "express";
import { getProjectsMetadata,createProject, updateProject,  deleteProject, getProject} from "../controllers/projectController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);
// Routes
router.get("/metadata", getProjectsMetadata);
router.get("/:id", getProject);
router.post("/", createProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;
