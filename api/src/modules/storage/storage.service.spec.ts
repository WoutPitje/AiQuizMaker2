import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { GcsService } from './gcs.service';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';

jest.mock('fs');
jest.mock('fs/promises');

describe('StorageService', () => {
  let service: StorageService;
  let gcsService: GcsService;

  const mockGcsService = {
    isEnabled: jest.fn(),
    uploadFile: jest.fn(),
    downloadFile: jest.fn(),
    deleteFile: jest.fn(),
    listFiles: jest.fn(),
    fileExists: jest.fn(),
    getFileMetadata: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: GcsService,
          useValue: mockGcsService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    gcsService = module.get<GcsService>(GcsService);

    // Reset mocks
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  describe('uploadFile', () => {
    it('should use GCS when enabled', async () => {
      mockGcsService.isEnabled.mockReturnValue(true);
      mockGcsService.uploadFile.mockResolvedValue('test.pdf');

      const result = await service.uploadFile(
        'test.pdf',
        Buffer.from('data'),
        'uploads',
      );

      expect(mockGcsService.uploadFile).toHaveBeenCalledWith(
        'test.pdf',
        Buffer.from('data'),
        'uploads',
      );
      expect(result).toBe('test.pdf');
    });

    it('should use local storage when GCS is disabled', async () => {
      mockGcsService.isEnabled.mockReturnValue(false);
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await service.uploadFile(
        'test.pdf',
        Buffer.from('data'),
        'uploads',
      );

      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        './uploads/test.pdf',
        Buffer.from('data'),
      );
      expect(result).toBe('test.pdf');
    });
  });

  describe('downloadFile', () => {
    it('should use GCS when enabled', async () => {
      mockGcsService.isEnabled.mockReturnValue(true);
      mockGcsService.downloadFile.mockResolvedValue(Buffer.from('data'));

      const result = await service.downloadFile('test.pdf', 'uploads');

      expect(mockGcsService.downloadFile).toHaveBeenCalledWith(
        'test.pdf',
        'uploads',
      );
      expect(result).toEqual(Buffer.from('data'));
    });

    it('should use local storage when GCS is disabled', async () => {
      mockGcsService.isEnabled.mockReturnValue(false);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(Buffer.from('data'));

      const result = await service.downloadFile('test.pdf', 'uploads');

      expect(fsPromises.readFile).toHaveBeenCalledWith('./uploads/test.pdf');
      expect(result).toEqual(Buffer.from('data'));
    });
  });

  describe('saveQuizData', () => {
    it('should save quiz data as JSON', async () => {
      mockGcsService.isEnabled.mockReturnValue(true);
      mockGcsService.uploadFile.mockResolvedValue('quiz123.json');

      const quizData = { id: 'quiz123', questions: [] };
      await service.saveQuizData('quiz123', quizData);

      expect(mockGcsService.uploadFile).toHaveBeenCalledWith(
        'quiz123.json',
        Buffer.from(JSON.stringify(quizData, null, 2)),
        'quiz-storage',
      );
    });
  });

  describe('loadQuizData', () => {
    it('should load and parse quiz data', async () => {
      const quizData = { id: 'quiz123', questions: [] };
      mockGcsService.isEnabled.mockReturnValue(true);
      mockGcsService.downloadFile.mockResolvedValue(
        Buffer.from(JSON.stringify(quizData)),
      );

      const result = await service.loadQuizData('quiz123');

      expect(mockGcsService.downloadFile).toHaveBeenCalledWith(
        'quiz123.json',
        'quiz-storage',
      );
      expect(result).toEqual(quizData);
    });
  });
});
