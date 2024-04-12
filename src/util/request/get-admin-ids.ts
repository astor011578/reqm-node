import userModel from '@/models/user';

/**
 * @description 取得具有 Admin 身分的 userIds
 * @returns { string[] } adminIds
 */
export default async (): Promise<string[]> => {
  const admins = await userModel.find({ roles: { $elemMatch: { $eq: 'Administrator' } } });
  const adminIds = admins.map(user => user.userId);
  return adminIds;
};
