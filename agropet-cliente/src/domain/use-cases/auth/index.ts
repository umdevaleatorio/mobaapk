export interface LoginUseCase { execute(email: string, pass: string): Promise<any>; }
export interface RegisterUseCase { execute(data: any): Promise<any>; }
export interface CheckSessionUseCase { execute(): Promise<boolean>; }
