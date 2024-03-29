import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import 'dotenv/config';
import { AuthModule } from './auth/auth.module';
import { BoardsModule } from './boards/boards.module';
import { ProjectsModule } from './projects/projects.module';
import { ApiConfigService } from './shared/api-config.service';
import { SharedModule } from './shared/shared.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV
        ? `.${process.env.NODE_ENV}.env`
        : '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) =>
        configService.postgresConfig,
      inject: [ApiConfigService],
    }),
    TasksModule,
    AuthModule,
    ProjectsModule,
    BoardsModule,
  ],
})
export class AppModule {}
