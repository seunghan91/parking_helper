import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const supabase = await createClient()

    // 장소 정보 조회
    const { data: place, error: placeError } = await supabase
      .from('places')
      .select('*')
      .eq('id', id)
      .single()

    if (placeError || !place) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Place not found' } },
        { status: 404 }
      )
    }

    // 연결된 주차장 조회
    const { data: parkingLots } = await supabase
      .from('parking_lots')
      .select(`
        id,
        name,
        type,
        price_info
      `)
      .eq('place_id', id)

    // 별칭 조회
    const { data: aliases } = await supabase
      .from('place_aliases')
      .select('alias, provider')
      .eq('place_id', id)

    // 외부 링크 조회
    const { data: links } = await supabase
      .from('place_links')
      .select('provider, external_place_id')
      .eq('place_id', id)

    // 리뷰 통계
    const { data: reviewStats } = await supabase
      .from('reviews')
      .select('rating')
      .eq('place_id', id)
      .not('rating', 'is', null)

    const avgRating = reviewStats && reviewStats.length > 0
      ? reviewStats.reduce((sum, r) => sum + r.rating, 0) / reviewStats.length
      : null

    const response = {
      data: {
        ...place,
        parking_lots: parkingLots || [],
        aliases: aliases || [],
        links: links || [],
        average_rating: avgRating,
        rating_count: reviewStats?.length || 0
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