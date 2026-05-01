import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

@Module({
  imports: [AuthModule],
  providers: [StorageService],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}
