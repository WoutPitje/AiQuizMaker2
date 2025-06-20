import { Test, TestingModule } from '@nestjs/testing';
import { GcsService } from './gcs.service';
import { Storage } from '@google-cloud/storage';

jest.mock('@google-cloud/storage');

describe('GcsService', () => {
  let service: GcsService;
  let mockStorage: jest.Mocked<Storage>;
  let mockBucket: any;
  let mockFile: any;

  beforeEach(async () => {
    // Setup mocks
    mockFile = {
      createWriteStream: jest.fn(),
      download: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      getMetadata: jest.fn(),
      name: 'test-file.pdf',
    };

    mockBucket = {
      file: jest.fn().mockReturnValue(mockFile),
      getFiles: jest.fn(),
    };

    mockStorage = {
      bucket: jest.fn().mockReturnValue(mockBucket),
    } as any;

    (Storage as jest.MockedClass<typeof Storage>).mockImplementation(() => mockStorage);

    // Set environment variables
    process.env.UPLOADS_BUCKET = 'test-uploads-bucket';
    process.env.QUIZ_STORAGE_BUCKET = 'test-quiz-bucket';
    process.env.GCP_PROJECT_ID = 'test-project';

    const module: TestingModule = await Test.createTestingModule({
      providers: [GcsService],
    }).compile();

    service = module.get<GcsService>(GcsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.UPLOADS_BUCKET;
    delete process.env.QUIZ_STORAGE_BUCKET;
    delete process.env.GCP_PROJECT_ID;
  });

  describe('isEnabled', () => {
    it('should return true when buckets are configured', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('should return false when buckets are not configured', () => {
      delete process.env.UPLOADS_BUCKET;
      const serviceWithoutBuckets = new GcsService();
      expect(serviceWithoutBuckets.isEnabled()).toBe(false);
    });
  });

  describe('uploadFile', () => {
    it('should upload file to uploads bucket', async () => {
      const mockStream = {
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            callback();
          }
          return mockStream;
        }),
        end: jest.fn(),
      };
      mockFile.createWriteStream.mockReturnValue(mockStream);

      const result = await service.uploadFile('test.pdf', Buffer.from('data'), 'uploads');

      expect(mockStorage.bucket).toHaveBeenCalledWith('test-uploads-bucket');
      expect(mockBucket.file).toHaveBeenCalledWith('test.pdf');
      expect(mockFile.createWriteStream).toHaveBeenCalledWith({
        metadata: {
          contentType: 'application/pdf',
        },
      });
      expect(result).toBe('test.pdf');
    });

    it('should throw error when GCS is not enabled', async () => {
      delete process.env.UPLOADS_BUCKET;
      const serviceWithoutBuckets = new GcsService();

      await expect(
        serviceWithoutBuckets.uploadFile('test.pdf', Buffer.from('data'), 'uploads')
      ).rejects.toThrow('GCS not configured');
    });
  });

  describe('downloadFile', () => {
    it('should download file from quiz-storage bucket', async () => {
      const mockBuffer = Buffer.from('file content');
      mockFile.download.mockResolvedValue([mockBuffer]);

      const result = await service.downloadFile('quiz.json', 'quiz-storage');

      expect(mockStorage.bucket).toHaveBeenCalledWith('test-quiz-bucket');
      expect(mockBucket.file).toHaveBeenCalledWith('quiz.json');
      expect(result).toEqual(mockBuffer);
    });
  });

  describe('fileExists', () => {
    it('should check if file exists', async () => {
      mockFile.exists.mockResolvedValue([true]);

      const result = await service.fileExists('test.pdf', 'uploads');

      expect(mockFile.exists).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockFile.exists.mockRejectedValue(new Error('Network error'));

      const result = await service.fileExists('test.pdf', 'uploads');

      expect(result).toBe(false);
    });
  });

  describe('listFiles', () => {
    it('should list files in bucket', async () => {
      const mockFiles = [
        { name: 'file1.pdf' },
        { name: 'file2.pdf' },
      ];
      mockBucket.getFiles.mockResolvedValue([mockFiles]);

      const result = await service.listFiles('uploads');

      expect(mockStorage.bucket).toHaveBeenCalledWith('test-uploads-bucket');
      expect(result).toEqual(['file1.pdf', 'file2.pdf']);
    });
  });
}); 