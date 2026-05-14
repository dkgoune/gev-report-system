export type WorkScheduleStatus = "draft" | "published" | "archived";

export type WorkScheduleAssignmentItem = {
  id: string;
  userId: string;
  postId: string;
  isLeader: boolean;
  isSubleader: boolean;
  attendanceStatus: "scheduled" | "present" | "absent" | "excused";
  user: {
    id: string;
    fullName: string;
    username: string;
  };
  post: {
    id: string;
    name: string;
    code: string;
  };
};

export type WorkScheduleItem = {
  id: string;
  workDate: string;
  status: WorkScheduleStatus;
  createdAt: string;
  service: {
    id: string;
    name: string;
    code: string;
  };
  assignments: WorkScheduleAssignmentItem[];
};

export type WorkScheduleServiceOption = {
  id: string;
  name: string;
  code: string;
};

export type WorkScheduleUserOption = {
  id: string;
  fullName: string;
  username: string;
};

export type WorkSchedulePostOption = {
  id: string;
  name: string;
  code: string;
};

export type WorkScheduleFormState = {
  serviceId: string;
  workDate: string;
  status: Exclude<WorkScheduleStatus, "archived">;
};

export type WorkScheduleAssignmentRowState = {
  userId: string;
  postId: string;
  isLeader: boolean;
  isSubleader: boolean;
  attendanceStatus: WorkScheduleAssignmentItem["attendanceStatus"];
};

export type WeeklyMatrixPerson = {
  userId: string;
  fullName: string;
  isLeader: boolean;
  isSubleader: boolean;
};

export type WeeklyAssignmentsByDate = Record<
  string,
  Record<string, WeeklyMatrixPerson[]>
>;
