import { User } from '../../entities/user.entity';

export interface RegisterUserDto {
  email: string;
  name: string;
  password: string;
  role?: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface IRegisterUserUseCase {
  execute(dto: RegisterUserDto): Promise<AuthResult>;
}

export interface ILoginUserUseCase {
  execute(dto: LoginUserDto): Promise<AuthResult>;
}

export interface IGetUserByIdUseCase {
  execute(userId: string): Promise<User | null>;
}
