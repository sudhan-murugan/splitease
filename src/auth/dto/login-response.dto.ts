import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT to send as "Authorization: Bearer <token>"',
  })
  accessToken!: string;
}
