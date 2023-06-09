import { User } from '@/auth/user.entity';
import { Project } from '@/projects/project.entity';
import { Task } from '@/tasks/task.entity';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Board extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne((_type) => User, (user) => user.boards)
  user: User;

  @ManyToOne((_type) => Project, (project) => project.boards)
  project: Project;

  @OneToMany((_type) => Task, (task) => task.board)
  tasks: Task[];

  @Column()
  projectId: number;

  @Column()
  userId: number;
}
