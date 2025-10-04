import { PDFFileFormatStrategy } from "../strategies/PDFFileFormatStrategy.js";

export class FileFormatFactory {
    // Método estático para crear estrategias de distintos formatos de archivos
    static createFileFormatStrategy(format, files){
        switch(format.toLowerCase()){
            case 'pdf':
                return new PDFFileFormatStrategy(files);
                
            default: 
                throw new Error(`Archive format ${format} no support`);
        }
    }
}


