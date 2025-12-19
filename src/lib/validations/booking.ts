import { z } from 'zod';

// Phone validation for Russia (+7) and common formats
const phoneRegex = /^(\+?7|8)?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

export const bookingStep1Schema = z.object({
  address: z
    .string()
    .min(5, 'Адрес должен содержать минимум 5 символов')
    .max(200, 'Адрес слишком длинный (максимум 200 символов)'),
  district: z
    .string()
    .min(1, 'Выберите район'),
  eventType: z
    .enum(['home', 'kindergarten', 'school', 'office', 'corporate', 'outdoor']),
  childrenCount: z
    .string()
    .min(1, 'Укажите количество детей')
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1 && num <= 50;
    }, 'Количество детей должно быть от 1 до 50'),
  childrenAges: z
    .string()
    .max(100, 'Слишком длинное описание возрастов')
    .optional(),
  comment: z
    .string()
    .max(1000, 'Комментарий слишком длинный (максимум 1000 символов)')
    .optional(),
});

export const bookingStep2Schema = z.object({
  customerName: z
    .string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(100, 'Имя слишком длинное'),
  customerPhone: z
    .string()
    .min(1, 'Укажите номер телефона')
    .refine((val) => {
      // Clean phone and check
      const cleaned = val.replace(/[\s-]/g, '');
      return phoneRegex.test(val) || (cleaned.length >= 9 && cleaned.length <= 15 && /^\+?\d+$/.test(cleaned));
    }, 'Введите корректный номер телефона'),
});

export const fullBookingSchema = bookingStep1Schema.merge(bookingStep2Schema);

export type BookingStep1Data = z.infer<typeof bookingStep1Schema>;
export type BookingStep2Data = z.infer<typeof bookingStep2Schema>;
export type FullBookingData = z.infer<typeof fullBookingSchema>;
