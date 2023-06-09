import { Board } from '@/boards/board.entity';
import { BoardRepository } from '@/boards/board.repository';
import { Project } from '@/projects/project.entity';
import { ProjectRepository } from '@/projects/project.repository';
import { Test, TestingModule } from '@nestjs/testing';
import 'jest-extended';
import { AppModule } from '../app.module';
import { User } from '../auth/user.entity';
import { UserRepository } from '../auth/user.repository';
import { CreateTaskDTO } from './dto/create-task.dto';
import { TaskSortBy } from './task-sort-by.enum';
import { TaskStatus } from './task-status.enum';
import { Task } from './task.entity';
import { TaskRepository } from './task.repository';

const dateMock = new Date().toISOString();
const createCardDataset: CreateTaskDTO[] = [
  {
    title: 'title',
    description: 'description',
    dueDate: dateMock,
    boardId: 1,
  },
  {
    title: 'title',
    description: null,
    dueDate: null,
    boardId: 1,
  },
  {
    title: 'title',
    description: null,
    dueDate: dateMock,
    boardId: 1,
  },
  {
    title: 'title',
    description: 'description',
    dueDate: null,
    boardId: 1,
  },
];

describe('TaskRepository', () => {
  let userRepository: UserRepository;
  let taskRepository: TaskRepository;
  let boardRepository: BoardRepository;
  let projectRepository: ProjectRepository;
  let module: TestingModule;
  let user: User;
  let board: Board;
  let project: Project;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
      providers: [TaskRepository, UserRepository, BoardRepository],
    }).compile();

    taskRepository = module.get<TaskRepository>(TaskRepository);
    projectRepository = module.get<ProjectRepository>(ProjectRepository);
    boardRepository = module.get<BoardRepository>(BoardRepository);
    userRepository = module.get<UserRepository>(UserRepository);

    await userRepository.insert([
      {
        id: 1,
        username: 'username',
        email: 'email@email.com',
        firstName: 'firstName',
        lastName: 'lastName',
        password: 'password',
        salt: 'salt',
      },
    ]);

    user = await userRepository.findOne({ where: { id: 1 } });

    await projectRepository.insert({
      id: 1,
      title: 'project-title',
      userId: 1,
    });

    project = await projectRepository.findOne({ where: { id: 1 } });

    await boardRepository.insert({
      id: 1,
      title: 'board-title',
      projectId: 1,
      userId: 1,
    });

    board = await boardRepository.findOne({ where: { id: 1 } });
  });

  afterAll(async () => {
    await module.close();
  });

  describe('createTask', () => {
    it.each(createCardDataset)(
      'should return correctly return created task',
      async (createTaskDto: CreateTaskDTO) => {
        const task = await taskRepository.createTask(createTaskDto, user);

        expect(task).toMatchObject({
          ...createTaskDto,
          dueDate: expect.toBeOneOf([null, expect.any(Date)]),
          id: 1,
          status: TaskStatus.OPEN,
          userId: user.id,
          boardId: board.id,
        });
        expect(
          taskRepository.find({ where: { id: task.id } }),
        ).resolves.toBeDefined();
        if (task.dueDate) {
          expect(task.dueDate.toISOString()).toEqual(dateMock);
        }
      },
    );
  });

  describe('get', () => {
    let userTasks: Partial<Task>[];

    beforeEach(async () => {
      // create user tasks
      const userTasksData = [
        {
          id: 1,
          title: 'title-open',
          description: 'description',
          dueDate: new Date(23, 5, 14),
          status: TaskStatus.OPEN,
          userId: user.id,
          boardId: board.id,
        },
        {
          id: 2,
          title: 'title-done',
          description: 'description',
          dueDate: null,
          status: TaskStatus.IN_PROGRESS,
          userId: user.id,
          boardId: board.id,
        },
        {
          id: 3,
          title: 'title-done',
          description: 'description',
          dueDate: new Date(23, 5, 15),
          status: TaskStatus.DONE,
          userId: user.id,
          boardId: board.id,
        },
      ];
      await taskRepository.insert(userTasksData);
      userTasks = await taskRepository.find();

      // creates another user to test that it only returns the requester tasks
      await userRepository.insert({
        id: 2,
        username: 'username2',
        email: 'email2@email.com',
        firstName: 'firstName2',
        lastName: 'lastName2',
        password: 'password2',
        salt: 'salt2',
      });

      await projectRepository.insert({
        id: 2,
        title: 'project-title',
        description: 'description',
        userId: 2,
      });

      await boardRepository.insert({
        id: 2,
        title: 'board-title',
        description: 'description',
        userId: 2,
        projectId: 2,
      });

      await taskRepository.insert({
        id: 3,
        title: 'title-open',
        description: 'description',
        dueDate: null,
        status: TaskStatus.OPEN,
        userId: 2,
        boardId: 2,
      });
    });

    it("should return all user's tasks if no filter was provided", async () => {
      const tasks = await taskRepository.get(
        { status: null, search: null },
        user,
      );

      expect(tasks.length).toEqual(3);
      expect(tasks[0]).toEqual(userTasks[0]);
      expect(tasks[1]).toEqual(userTasks[1]);
      expect(tasks[2]).toEqual(userTasks[2]);
    });

    const taskStatusDataset = [
      TaskStatus.OPEN,
      TaskStatus.IN_PROGRESS,
      TaskStatus.DONE,
    ];

    it.each(taskStatusDataset)(
      "should return user's tasks by status",
      async (status) => {
        const tasks = await taskRepository.get(
          { status: status, search: null },
          user,
        );

        expect(tasks.length).toEqual(1);
        expect(tasks[0].status).toEqual(status);
      },
    );

    it("should return user's tasks by search", async () => {
      const tasks = await taskRepository.get(
        { status: null, search: 'title-open' },
        user,
      );

      expect(tasks.length).toEqual(1);
      expect(tasks[0]).toEqual(userTasks[0]);
    });

    it("should return user's tasks by dueDate orderedBy ASC ", async () => {
      const tasks = await taskRepository.get(
        {
          status: null,
          search: null,
          sortBy: TaskSortBy.DUEDATE,
          orderBy: 'ASC',
        },
        user,
      );

      tasks.map((task) => new Date(task.dueDate).toISOString());

      expect(tasks.length).toEqual(3);
    });
  });

  describe('updateStatus', () => {
    beforeEach(async () => {
      await taskRepository.insert({
        id: 1,
        title: 'title-open',
        description: 'description',
        status: TaskStatus.OPEN,
        userId: user.id,
        boardId: board.id,
      });
    });

    it('should update the status and return the updated task', async () => {
      const task = await taskRepository.findOne({ where: { id: 1 } });

      const updatedTask = await taskRepository.updateStatus(
        task,
        TaskStatus.IN_PROGRESS,
      );

      expect(updatedTask).toEqual({ ...task, status: TaskStatus.IN_PROGRESS });
    });
  });
});
