import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  date,
  index,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const task = pgTable(
  "task",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    date: date("date").notNull(),
    dueDate: date("due_date"),
    repeatRule: text("repeat_rule"),
    startTime: text("start_time"),
    endTime: text("end_time"),
    estimatedMinutes: integer("estimated_minutes"),
    status: text("status").notNull().default("todo"),
    carriedOverFrom: text("carried_over_from"),
    channel: text("channel"),
    channelId: text("channel_id").references(() => channel.id, { onDelete: "set null" }),
    contextId: text("context_id").references(() => context.id, { onDelete: "set null" }),
    weeklyObjectiveId: text("weekly_objective_id").references(() => weeklyObjective.id, {
      onDelete: "set null",
    }),
    priority: text("priority").notNull().default("normal"),
    position: integer("position").notNull().default(0),
    actualSeconds: integer("actual_seconds").notNull().default(0),
    timerStartedAt: timestamp("timer_started_at"),
    isHighlight: boolean("is_highlight").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("task_userId_date_idx").on(table.userId, table.date),
  ],
);

export const subtask = pgTable(
  "subtask",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    taskId: text("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    done: boolean("done").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("subtask_taskId_idx").on(table.taskId)],
);

export const taskRelations = relations(task, ({ one, many }) => ({
  user: one(user, {
    fields: [task.userId],
    references: [user.id],
  }),
  subtasks: many(subtask),
  channel: one(channel, {
    fields: [task.channelId],
    references: [channel.id],
  }),
  context: one(context, {
    fields: [task.contextId],
    references: [context.id],
  }),
  weeklyObjective: one(weeklyObjective, {
    fields: [task.weeklyObjectiveId],
    references: [weeklyObjective.id],
  }),
}));

export const subtaskRelations = relations(subtask, ({ one }) => ({
  task: one(task, {
    fields: [subtask.taskId],
    references: [task.id],
  }),
}));

export const comment = pgTable(
  "comment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    taskId: text("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("comment_taskId_idx").on(table.taskId)],
);

export const commentRelations = relations(comment, ({ one }) => ({
  task: one(task, {
    fields: [comment.taskId],
    references: [task.id],
  }),
  user: one(user, {
    fields: [comment.userId],
    references: [user.id],
  }),
}));

export const context = pgTable(
  "context",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("sky"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("context_userId_idx").on(table.userId)],
);

export const channel = pgTable(
  "channel",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    contextId: text("context_id")
      .notNull()
      .references(() => context.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    isPrivate: boolean("is_private").notNull().default(false),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("channel_contextId_idx").on(table.contextId)],
);

export const contextRelations = relations(context, ({ one, many }) => ({
  user: one(user, {
    fields: [context.userId],
    references: [user.id],
  }),
  channels: many(channel),
}));

export const channelRelations = relations(channel, ({ one, many }) => ({
  context: one(context, {
    fields: [channel.contextId],
    references: [context.id],
  }),
  tasks: many(task),
}));

export const weeklyObjective = pgTable(
  "weekly_objective",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    weekStartDate: date("week_start_date").notNull(),
    text: text("text").notNull(),
    done: boolean("done").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("weeklyObjective_userId_week_idx").on(table.userId, table.weekStartDate),
  ],
);

export const weeklyObjectiveRelations = relations(weeklyObjective, ({ one }) => ({
  user: one(user, {
    fields: [weeklyObjective.userId],
    references: [user.id],
  }),
}));

// Satu baris per user per hari — dipakai buat Daily Planning (misal
// shutdown time, jam target selesai kerja hari itu). Bisa ditambah field
// lain ke depannya kalau ada setting harian baru.
export const dailyPlan = pgTable(
  "daily_plan",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    shutdownTime: text("shutdown_time"),
  },
  (table) => [
    index("dailyPlan_userId_date_idx").on(table.userId, table.date),
  ],
);

export const dailyPlanRelations = relations(dailyPlan, ({ one }) => ({
  user: one(user, {
    fields: [dailyPlan.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  tasks: many(task),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
