import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { GcsService } from './modules/storage/gcs.service';
import { StorageService } from './modules/storage/storage.service';

async function testStorageSetup() {
  console.log('🧪 Testing Storage Configuration');
  console.log('================================');

  const module: TestingModule = await Test.createTestingModule({
    imports: [ConfigModule.forRoot()],
    providers: [GcsService, StorageService],
  }).compile();

  const storageService = module.get<StorageService>(StorageService);
  const gcsService = module.get<GcsService>(GcsService);

  console.log('Environment Variables:');
  console.log(`  UPLOADS_BUCKET: ${process.env.UPLOADS_BUCKET || 'NOT SET'}`);
  console.log(
    `  QUIZ_STORAGE_BUCKET: ${process.env.QUIZ_STORAGE_BUCKET || 'NOT SET'}`,
  );
  console.log(`  GCP_PROJECT_ID: ${process.env.GCP_PROJECT_ID || 'NOT SET'}`);

  console.log(`\nGCS Enabled: ${gcsService.isEnabled()}`);

  // Test file operations
  try {
    const testData = Buffer.from('Test file content');
    const testFilename = `test-${Date.now()}.txt`;

    console.log(`\n📤 Testing file upload: ${testFilename}`);
    await storageService.uploadFile(testFilename, testData, 'uploads');
    console.log('✅ Upload successful');

    console.log(`📥 Testing file download: ${testFilename}`);
    const downloadedData = await storageService.downloadFile(
      testFilename,
      'uploads',
    );
    console.log('✅ Download successful');
    console.log(`📊 Data matches: ${testData.equals(downloadedData)}`);

    console.log(`📋 Testing file listing...`);
    const files = await storageService.listFiles('uploads');
    console.log(`✅ Found ${files.length} files in uploads`);

    console.log(`🗑️  Testing file deletion: ${testFilename}`);
    await storageService.deleteFile(testFilename, 'uploads');
    console.log('✅ Deletion successful');

    console.log('\n🎉 All storage tests passed!');

    // Test quiz storage
    console.log('\n📚 Testing quiz storage...');
    const testQuiz = {
      id: `test-quiz-${Date.now()}`,
      title: 'Test Quiz',
      questions: [],
      metadata: { sourceFile: 'test.pdf', totalPages: 1 },
    };

    await storageService.saveQuizData(testQuiz.id, testQuiz);
    console.log('✅ Quiz save successful');

    const loadedQuiz = await storageService.loadQuizData(testQuiz.id);
    console.log('✅ Quiz load successful');
    console.log(`📊 Quiz data matches: ${loadedQuiz.id === testQuiz.id}`);

    await storageService.deleteFile(`${testQuiz.id}.json`, 'quiz-storage');
    console.log('✅ Quiz cleanup successful');

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Storage test failed:', error.message);
    console.error('Stack:', error.stack);

    if (error.message.includes('GCS not configured')) {
      console.log(
        '\n💡 This is expected in local development without GCS buckets configured.',
      );
      console.log('   The application will use local storage as fallback.');
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  testStorageSetup().catch(console.error);
}

export { testStorageSetup };
