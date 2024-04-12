import { Document, model, Schema } from 'mongoose';
import { TUser } from '~/user';

export interface IUser extends TUser, Document {}

const userSchema: Schema = new Schema({
  isResigned: {
    type: Boolean,
    required: true,
    default: false
  },
  //員工工號, 同時作為帳號
  userId: {
    type: String,
    required: true
  },
  //密碼雜湊值
  hash: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  //英文姓名
  nameEn: {
    type: String,
    required: true
  },
  //中文姓名 (非必須)
  nameZh: String,
  //所屬部門
  dept: {
    type: String,
    required: true
  },
  //系統權限 ('Add request', 'Review request')
  roles: {
    type: Array,
    required: true,
    default: ['Add request']
  },
  //創建日期
  createdAt: {
    type: Date,
    required: true,
    default: Date.now()
  }
});

//取得 roles 全部的選項值
userSchema.methods.getAllRoles = (): string[] => {
  return ['Add request', 'Review request'];
};

userSchema.set('collection', 'users');

const userModel = model<IUser>('users', userSchema);

export default userModel;
