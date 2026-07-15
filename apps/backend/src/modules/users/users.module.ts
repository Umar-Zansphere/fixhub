import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { StorageModule } from '../../common/storage/storage.module';
import { UsersController } from './controllers/users.controller';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './services/users.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
