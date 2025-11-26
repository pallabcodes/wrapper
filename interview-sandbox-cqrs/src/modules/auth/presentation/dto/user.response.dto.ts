import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'USER', enum: ['USER', 'ADMIN', 'MODERATOR'] })
  role: string;

  @ApiProperty({ example: false })
  isEmailVerified: boolean;
}
