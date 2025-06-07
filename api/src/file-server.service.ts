import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as pdfParse from 'pdf-parse';
import { PdfPage, PdfProcessingResult } from './models/pdf.model';

const { Poppler } = require('node-poppler');

@Injectable()
export class FileServerService {
  private readonly logger = new Logger(FileServerService.name);

  /**
   * Split a PDF file into individual pages and extract text content
   */
  async splitPdfToPages(filePath: string, generateImages: boolean = false): Promise<PdfProcessingResult> {
    try {
      this.logger.log(`Starting PDF processing for: ${filePath}`);

      // Verify file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`PDF file not found: ${filePath}`);
      }

      this.logger.log('Reading PDF file...');
      // Extract text content and metadata from PDF
      const pdfBuffer = fs.readFileSync(filePath);
      this.logger.log(`PDF buffer size: ${pdfBuffer.length} bytes`);
      
      this.logger.log('Parsing PDF content...');
      const pdfData = await pdfParse(pdfBuffer);
      this.logger.log(`PDF parsed successfully. Pages: ${pdfData.numpages}, Text length: ${pdfData.text.length}`);

      // Process each page
      const pages: PdfPage[] = [];
      const pageTexts = this.extractPageTexts(pdfData.text, pdfData.numpages);
      this.logger.log(`Extracted text for ${pageTexts.length} pages`);

      if (generateImages) {
        this.logger.log('Generating page images (this may take a while)...');
        
        // Create output directory for page images
        const outputDir = path.join(path.dirname(filePath), 'pages');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Configure node-poppler options
        const poppler = new Poppler();
        const outputPrefix = path.basename(filePath, '.pdf');

        try {
          // Convert PDF pages to images using node-poppler
          this.logger.log(`Converting PDF to images...`);
          const pdfToCairoOptions = {
            pngFile: true,
            singleFile: false,
            firstPageToConvert: 1,
            lastPageToConvert: pdfData.numpages,
            scale: 1024 / 72, // Convert from default 72 DPI to 1024 DPI
          };

          // Convert to images
          await poppler.pdfToCairo(filePath, outputDir + '/' + outputPrefix, pdfToCairoOptions);
          this.logger.log(`Image conversion completed`);

          for (let i = 1; i <= pdfData.numpages; i++) {
            const imageName = `${outputPrefix}-${i.toString().padStart(3, '0')}.png`;
            const imagePath = path.join(outputDir, imageName);

            pages.push({
              pageNumber: i,
              imagePath: fs.existsSync(imagePath) ? imagePath : '',
              textContent: pageTexts[i - 1] || '',
            });
          }
        } catch (error) {
          this.logger.warn(`Image generation failed: ${error.message}, proceeding without images`);
          
          // Fallback to text-only pages if image generation fails
          for (let i = 1; i <= pdfData.numpages; i++) {
            pages.push({
              pageNumber: i,
              imagePath: '',
              textContent: pageTexts[i - 1] || '',
            });
          }
        }
      } else {
        this.logger.log('Skipping image generation, creating text-only pages...');
        
        for (let i = 1; i <= pdfData.numpages; i++) {
          pages.push({
            pageNumber: i,
            imagePath: '', // No image generated
            textContent: pageTexts[i - 1] || '',
          });
        }
      }

      const result: PdfProcessingResult = {
        totalPages: pdfData.numpages,
        pages,
        metadata: {
          title: pdfData.info?.Title,
          author: pdfData.info?.Author,
          subject: pdfData.info?.Subject,
          creator: pdfData.info?.Creator,
          producer: pdfData.info?.Producer,
          creationDate: pdfData.info?.CreationDate,
          modificationDate: pdfData.info?.ModDate,
        },
      };

      this.logger.log(`PDF processing completed successfully. Total pages: ${result.totalPages}`);
      return result;

    } catch (error) {
      this.logger.error(`Error processing PDF: ${error.message}`, error.stack);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(filePath: string): Promise<{
    exists: boolean;
    size: number;
    extension: string;
    name: string;
  }> {
    try {
      const stats = fs.statSync(filePath);
      return {
        exists: true,
        size: stats.size,
        extension: path.extname(filePath),
        name: path.basename(filePath),
      };
    } catch (error) {
      return {
        exists: false,
        size: 0,
        extension: '',
        name: '',
      };
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(directory: string): Promise<void> {
    try {
      if (fs.existsSync(directory)) {
        const files = fs.readdirSync(directory);
        for (const file of files) {
          fs.unlinkSync(path.join(directory, file));
        }
        fs.rmdirSync(directory);
        this.logger.log(`Cleaned up temporary directory: ${directory}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to cleanup directory ${directory}: ${error.message}`);
    }
  }

  /**
   * Extract text content for each page (rough estimation)
   */
  private extractPageTexts(fullText: string, pageCount: number): string[] {
    this.logger.log(`Splitting text into ${pageCount} pages...`);
    
    // This is a simplified approach - in reality, PDF text extraction per page is complex
    // For now, we'll split the text roughly by page count
    const words = fullText.split(/\s+/);
    const wordsPerPage = Math.ceil(words.length / pageCount);
    
    const pageTexts: string[] = [];
    for (let i = 0; i < pageCount; i++) {
      const startIndex = i * wordsPerPage;
      const endIndex = Math.min((i + 1) * wordsPerPage, words.length);
      const pageText = words.slice(startIndex, endIndex).join(' ');
      pageTexts.push(pageText);
      
      this.logger.debug(`Page ${i + 1}: ${pageText.length} characters`);
    }
    
    this.logger.log(`Text splitting completed. Average words per page: ${wordsPerPage}`);
    return pageTexts;
  }
} 