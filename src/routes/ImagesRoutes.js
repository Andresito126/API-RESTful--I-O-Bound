import { convertImagesToPDFController } from "../controllers/ImagesController.js";

export const imagesRoutes = (req, res) => {
    if (req.method === "POST" && req.url === "/images/upload") {
        convertImagesToPDFController(req, res);
    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    }
};

