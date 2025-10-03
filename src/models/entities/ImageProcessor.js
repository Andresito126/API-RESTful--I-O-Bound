export class ImageProcessor {
    constructor(){
        this.images = [];
        this.fileFormatStrategy = null;
    }

    addImages(images) {
        // Falta lógica
        this.images = images;
    }

    setFileFormatStrategy(strategy){
        this.fileFormatStrategy = strategy;
    }
}
