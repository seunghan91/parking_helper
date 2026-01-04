import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    const supabase = await createClient()

    // 주차장 정보 조회
    const { data: parkingLot, error: parkingError } = await supabase
      .from('parking_lots')
      .select(`
        *,
        place:places(*)
      `)
      .eq('id', id)
      .single()

    if (parkingError || !parkingLot) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Parking lot not found' } },
        { status: 404 }
      )
    }

    // 최근 리뷰 조회 (최대 5개)
    const { data: reviews } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        helpful_count,
        created_at,
        user:profiles(nickname)
      `)
      .eq('parking_lot_id', id)
      .order('created_at', { ascending: false })
      .limit(5)

    // 최근 팁 조회 (최대 3개)
    const { data: tips } = await supabase
      .from('tips')
      .select(`
        id,
        content,
        discount_info,
        created_at,
        user:profiles(nickname)
      `)
      .eq('parking_lot_id', id)
      .order('created_at', { ascending: false })
      .limit(3)

    // 평균 평점 계산 (DB 집계 함수 사용)
    const { data: ratingStats, error: ratingError } = await supabase
      .rpc('get_average_rating', {
        target_id: id,
        target_type: 'parking_lot'
      })
      .single()

    const avgRating = ratingStats?.average_rating || null
    const ratingCount = ratingStats?.rating_count || 0

    const response = {
      data: {
        ...parkingLot,
        average_rating: avgRating,
        rating_count: ratingCount,
        recent_reviews: reviews || [],
        recent_tips: tips || []
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}