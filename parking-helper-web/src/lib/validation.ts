import { z } from 'zod'

// 공통 스키마
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
})

export const locationSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(10000).default(1000),
})

// Place 관련 스키마
export const placeIngestSchema = z.object({
  provider: z.enum(['naver', 'kakao', 'google']),
  external_place_id: z.string().min(1),
  name: z.string().min(1).max(255),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

// Review 관련 스키마
export const reviewCreateSchema = z.object({
  subject_type: z.enum(['parking_lot', 'place', 'location']),
  parking_lot_id: z.string().uuid().optional(),
  place_id: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
}).refine(
  (data) => {
    if (data.subject_type === 'parking_lot') return !!data.parking_lot_id
    if (data.subject_type === 'place') return !!data.place_id
    if (data.subject_type === 'location') return !!data.latitude && !!data.longitude
    return false
  },
  {
    message: 'Required fields missing for subject_type',
  }
)

export const reviewQuerySchema = z.object({
  parking_lot_id: z.string().uuid().optional(),
  place_id: z.string().uuid().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(100).max(10000).default(500),
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
  sort: z.enum(['created_desc', 'rating_desc', 'helpful_desc']).default('created_desc'),
})

// Parking 관련 스키마
export const parkingSearchSchema = z.object({
  q: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(100).max(10000).default(1000),
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
})

// Tip 관련 스키마
export const tipCreateSchema = z.object({
  parking_lot_id: z.string().uuid(),
  content: z.string().min(1).max(500),
  discount_info: z.string().max(255).optional(),
})

// 에러 응답 스키마
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
})

// 헬퍼 함수
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

export function formatZodError(error: z.ZodError): string {
  return error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
}