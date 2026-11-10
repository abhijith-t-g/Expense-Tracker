import { z } from 'zod';

export const transactionInputSchema = z.object({
  type: z.enum(['expense', 'income'], {
    message: 'Transaction type must be either Expense or Income',
  }),
  amount: z
    .number({
      message: 'Amount is required and must be a number',
    })
    .int('Amount in paise must be a whole integer')
    .positive('Amount must be greater than ₹0'),
  categoryId: z
    .number({
      message: 'Please select a category',
    })
    .int()
    .positive('Please select a valid category'),
  title: z
    .string()
    .trim()
    .max(100, 'Title cannot exceed 100 characters')
    .optional()
    .default(''),
  description: z
    .string()
    .trim()
    .max(250, 'Description cannot exceed 250 characters')
    .nullable()
    .optional(),
  date: z
    .string({
      message: 'Date is required',
    })
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Date must be in YYYY-MM-DD format (e.g. 2026-11-10)'
    ),
  time: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/,
      'Time must be in HH:MM format'
    )
    .nullable()
    .optional()
    .or(z.literal('')),
});

export type TransactionInputFormValues = z.infer<typeof transactionInputSchema>;

export function validateTransactionInput(values: unknown) {
  return transactionInputSchema.safeParse(values);
}

