type AccountRecord = {
  createdAt: Date;
  email: string;
  id: string;
  passwordHash: string;
  updatedAt: Date;
};

type GenerationJobRecord = {
  completedAt: Date | null;
  createdAt: Date;
  failureReason: string | null;
  id: string;
  notes: string;
  outputPath: string | null;
  ownerId: string;
  projectDescription: string;
  projectName: string;
  startedAt: Date | null;
  state: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  updatedAt: Date;
};

type NotificationRecord = {
  content: string;
  createdAt: Date;
  generationJobId: string | null;
  id: string;
  ownerId: string;
  readAt: Date | null;
  title: string;
  type: 'GENERATION_SUCCEEDED' | 'GENERATION_FAILED';
  updatedAt: Date;
};

function sortByCreatedAtDesc<T extends { createdAt: Date }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}

export function createFakePrismaService() {
  const accounts = new Map<string, AccountRecord>();
  const generationJobs = new Map<string, GenerationJobRecord>();
  const notifications = new Map<string, NotificationRecord>();

  return {
    __internal: {
      accounts,
      generationJobs,
      notifications,
    },
    account: {
      async create({ data }: { data: AccountRecord }) {
        accounts.set(data.id, { ...data });
        return { ...data };
      },
      async update({
        where,
        data,
      }: {
        data: AccountRecord;
        where: { id: string };
      }) {
        accounts.set(where.id, { ...data });
        return { ...data };
      },
      async findUnique({
        where,
      }: {
        where: { email?: string; id?: string };
      }) {
        if (where.id) {
          return accounts.get(where.id) ?? null;
        }

        if (where.email) {
          return (
            [...accounts.values()].find(
              (account) => account.email === where.email,
            ) ?? null
          );
        }

        return null;
      },
    },
    generationJob: {
      async create({ data }: { data: GenerationJobRecord }) {
        generationJobs.set(data.id, { ...data });
        return { ...data };
      },
      async update({
        where,
        data,
      }: {
        data: GenerationJobRecord;
        where: { id: string };
      }) {
        generationJobs.set(where.id, { ...data });
        return { ...data };
      },
      async findUnique({ where }: { where: { id: string } }) {
        return generationJobs.get(where.id) ?? null;
      },
      async findMany({
        where,
      }: {
        orderBy: { createdAt: 'desc' };
        where: { ownerId: string };
      }) {
        return sortByCreatedAtDesc(
          [...generationJobs.values()].filter(
            (job) => job.ownerId === where.ownerId,
          ),
        );
      },
    },
    notification: {
      async create({ data }: { data: NotificationRecord }) {
        notifications.set(data.id, { ...data });
        return { ...data };
      },
      async update({
        where,
        data,
      }: {
        data: NotificationRecord;
        where: { id: string };
      }) {
        notifications.set(where.id, { ...data });
        return { ...data };
      },
      async findUnique({ where }: { where: { id: string } }) {
        return notifications.get(where.id) ?? null;
      },
      async findMany({
        where,
      }: {
        orderBy: { createdAt: 'desc' };
        where: { ownerId: string };
      }) {
        return sortByCreatedAtDesc(
          [...notifications.values()].filter(
            (notification) => notification.ownerId === where.ownerId,
          ),
        );
      },
    },
  };
}
