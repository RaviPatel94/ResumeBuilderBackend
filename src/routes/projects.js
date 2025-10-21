import express from "express";
import { getProjectsMetadata,createProject, updateProject,  deleteProject, getProject} from "../controllers/projectController.js";

const router = express.Router();

// Routes
router.get("/metadata", getProjectsMetadata);
router.get("/:id", getProject);
router.post("/", createProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;
