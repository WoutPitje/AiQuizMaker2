import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { GcsService } from './gcs.service';

@Module({
  providers: [StorageService, GcsService],
  exports: [StorageService],
})
export class StorageModule {}
