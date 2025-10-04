// epresenta un trabajo de conversión de imágenes a PDF.
export class Job {
    constructor(id, files, format) {
        this.id = id;
        this.files = files;
        this.format = format;
        this.status = "pending";
        this.resultPath = null;
        this.error = null;
    }

    setProcessing() { this.status = "processing"; }
    setDone(path) {
        this.status = "done";
        this.resultPath = path;
    }
    setError(err) {
        this.status = "error";
        this.error = err.message;
    }
}
