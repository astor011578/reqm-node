export type TUser = {
  isResigned: boolean;
  userId: string;
  hash: string;
  email: string;
  nameEn: string;
  nameZh: string | undefined;
  dept: string;
  roles: string[];
  createdAt: Date;
  getAllRoles: () => string[];
};
