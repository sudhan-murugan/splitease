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
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description!: string;

  // Fits numeric(12,2); at most 2 decimals so it converts to cents exactly
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @IsPositive()
  @Max(9_999_999_999.99)
  amount!: number;

  // Must be a member of the group (checked in ExpensesService)
  @IsUUID()
  paidById!: string;

  // Members who share the expense equally; may include the payer.
  // Membership of each id is checked in ExpensesService.
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  participantIds!: string[];
}
