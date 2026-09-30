import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Dinner', maxLength: 255 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description!: string;

  // Fits numeric(12,2); at most 2 decimals so it converts to cents exactly
  @ApiProperty({ example: 90, description: 'Positive, at most 2 decimals' })
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @IsPositive()
  @Max(9_999_999_999.99)
  amount!: number;

  // Must be a member of the group (checked in ExpensesService)
  @ApiProperty({ format: 'uuid', description: 'Group member who paid' })
  @IsUUID()
  paidById!: string;

  // Members who share the expense equally; may include the payer.
  // Membership of each id is checked in ExpensesService.
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Group members who share the expense equally',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  participantIds!: string[];
}
